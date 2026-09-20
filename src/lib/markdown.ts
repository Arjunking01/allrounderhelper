import katex from 'katex';
import 'katex/dist/katex.min.css';

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderMath(expr: string, displayMode: boolean): string {
  try {
    return katex.renderToString(expr, { throwOnError: false, displayMode, output: 'html' });
  } catch {
    return `<code class="text-red-500">${escapeHtml(expr)}</code>`;
  }
}

function safeUrl(url: string): string {
  const trimmed = url.trim();
  return /^(https?:|mailto:|tel:|#|\/)/i.test(trimmed) ? trimmed : '#';
}

/** Escapes characters that would let markdown-sourced text break out of an HTML attribute
 *  value (e.g. a link URL or image alt text containing a literal `"`). The `&`/`<`/`>` pass
 *  earlier in `inline()` already neutralizes those; this only needs to cover quote characters,
 *  since re-running the full escape here would double-encode the already-escaped ampersands. */
function escapeAttr(input: string): string {
  return input.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/** Renders inline formatting: bold/italic, inline code, links, images, footnote refs, sup/sub, and real inline KaTeX math. */
export function inline(text: string): string {
  // Extract math first (needs the raw, unescaped LaTeX source) and replace with placeholders,
  // so the HTML-escape pass below can't mangle either the LaTeX source or KaTeX's rendered HTML.
  const mathHtml: string[] = [];
  let withPlaceholders = text
    .replace(/\$\$([^$]+)\$\$/g, (_m, expr) => {
      mathHtml.push(renderMath(expr, true));
      return `\u0000MATH${mathHtml.length - 1}\u0000`;
    })
    .replace(/\$([^$\n]+)\$/g, (_m, expr) => {
      mathHtml.push(renderMath(expr, false));
      return `\u0000MATH${mathHtml.length - 1}\u0000`;
    });

  withPlaceholders = withPlaceholders
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_m, alt, url) => `<img src="${escapeAttr(safeUrl(url))}" alt="${escapeAttr(alt)}" class="max-w-full rounded-lg my-2" loading="lazy" />`)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, label, url) => `<a href="${escapeAttr(safeUrl(url))}" class="text-electric-500 underline" target="_blank" rel="noopener noreferrer">${label}</a>`)
    .replace(/`([^`]+)`/g, '<code class="rounded bg-navy-100 dark:bg-white/10 px-1 py-0.5 text-[0.85em] font-mono">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(?<!_)_([^_]+)_(?!_)/g, '<em>$1</em>')
    .replace(/\^([^\s^]+)\^/g, '<sup>$1</sup>')
    .replace(/~([^\s~]+)~/g, '<sub>$1</sub>')
    .replace(/\[\^(\w+)\]/g, '<sup><a href="#footnote-$1" class="text-electric-500">[$1]</a></sup>');

  return withPlaceholders.replace(/\u0000MATH(\d+)\u0000/g, (_m, idx) => mathHtml[Number(idx)]);
}

function renderTable(lines: string[]): string {
  const rows = lines.map((l) => l.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim()));
  const [header, , ...body] = rows;
  const thead = `<thead><tr>${header.map((c) => `<th class="text-left px-3 py-1.5 border-b border-navy-200 dark:border-white/10 font-semibold">${inline(c)}</th>`).join('')}</tr></thead>`;
  const tbody = `<tbody>${body.map((r) => `<tr>${r.map((c) => `<td class="px-3 py-1.5 border-b border-navy-100 dark:border-white/5">${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody>`;
  return `<div class="overflow-x-auto my-2"><table class="w-full text-sm border-collapse">${thead}${tbody}</table></div>`;
}

export type MarkdownBlock =
  | { type: 'html'; html: string }
  | { type: 'code'; lang: string; code: string }
  | { type: 'mermaid'; code: string };

/**
 * Splits Markdown source into a sequence of blocks. Fenced code and ```mermaid blocks
 * are returned as raw, unescaped data so a React component can render them with real
 * interactivity (copy button, collapse, diagram rendering) — everything else is safe
 * pre-rendered HTML (escaped up front) for a single dangerouslySetInnerHTML per block.
 */
export function parseMarkdownBlocks(source: string): MarkdownBlock[] {
  const rawLines = source.split('\n');
  const blocks: MarkdownBlock[] = [];
  const htmlBuffer: string[] = [];
  let inList: 'ul' | 'ol' | null = null;
  let i = 0;

  function closeList() {
    if (inList) {
      htmlBuffer.push(inList === 'ul' ? '</ul>' : '</ol>');
      inList = null;
    }
  }

  function flushHtml() {
    closeList();
    if (htmlBuffer.length > 0) {
      blocks.push({ type: 'html', html: htmlBuffer.join('\n') });
      htmlBuffer.length = 0;
    }
  }

  while (i < rawLines.length) {
    const rawLine = rawLines[i];
    const line = rawLine.trimEnd();

    const fenceMatch = /^```(\w*)\s*$/.exec(line.trim());
    if (fenceMatch) {
      closeList();
      const lang = fenceMatch[1];
      const codeLines: string[] = [];
      i++;
      while (i < rawLines.length && rawLines[i].trim() !== '```') {
        codeLines.push(rawLines[i]);
        i++;
      }
      i++;
      const code = codeLines.join('\n');
      if (lang.toLowerCase() === 'mermaid') {
        flushHtml();
        blocks.push({ type: 'mermaid', code });
      } else {
        flushHtml();
        blocks.push({ type: 'code', lang, code });
      }
      continue;
    }

    if (line.includes('|') && /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?\s*$/.test(rawLines[i + 1] ?? '')) {
      closeList();
      const tableLines = [line, rawLines[i + 1]];
      let j = i + 2;
      while (j < rawLines.length && rawLines[j].includes('|')) {
        tableLines.push(rawLines[j]);
        j++;
      }
      htmlBuffer.push(renderTable(tableLines));
      i = j;
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line.trim())) {
      closeList();
      htmlBuffer.push('<hr class="my-3 border-navy-100 dark:border-white/10" />');
      i++;
      continue;
    }

    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    const taskItem = /^[-*]\s+\[([ xX])\]\s+(.*)$/.exec(line);
    const bullet = /^(\s*)[-*]\s+(.*)$/.exec(line);
    const numbered = /^(\s*)\d+\.\s+(.*)$/.exec(line);
    const quote = /^>\s?(.*)$/.exec(line);

    if (heading) {
      closeList();
      const level = Math.min(6, heading[1].length + 2);
      htmlBuffer.push(`<h${level} class="font-semibold mt-3 mb-1">${inline(heading[2])}</h${level}>`);
    } else if (taskItem) {
      if (inList !== 'ul') {
        closeList();
        htmlBuffer.push('<ul class="list-none pl-0 space-y-1">');
        inList = 'ul';
      }
      const checked = taskItem[1].toLowerCase() === 'x';
      htmlBuffer.push(
        `<li class="flex items-center gap-2"><input type="checkbox" disabled ${checked ? 'checked' : ''} class="accent-electric-500" /><span${checked ? ' class="line-through text-navy-400 dark:text-ink-500"' : ''}>${inline(taskItem[2])}</span></li>`
      );
    } else if (bullet) {
      if (inList !== 'ul') {
        closeList();
        htmlBuffer.push('<ul class="list-disc pl-5 space-y-0.5">');
        inList = 'ul';
      }
      const indent = bullet[1].length;
      htmlBuffer.push(`<li${indent > 0 ? ' class="ml-4"' : ''}>${inline(bullet[2])}</li>`);
    } else if (numbered) {
      if (inList !== 'ol') {
        closeList();
        htmlBuffer.push('<ol class="list-decimal pl-5 space-y-0.5">');
        inList = 'ol';
      }
      const indent = numbered[1].length;
      htmlBuffer.push(`<li${indent > 0 ? ' class="ml-4"' : ''}>${inline(numbered[2])}</li>`);
    } else if (quote) {
      closeList();
      htmlBuffer.push(`<blockquote class="border-l-2 border-electric-500 pl-3 italic text-navy-500 dark:text-ink-400">${inline(quote[1])}</blockquote>`);
    } else if (/^\[\^(\w+)\]:\s*(.*)$/.test(line)) {
      closeList();
      const m = /^\[\^(\w+)\]:\s*(.*)$/.exec(line)!;
      htmlBuffer.push(`<p id="footnote-${m[1]}" class="text-xs text-navy-400 dark:text-ink-500">[${m[1]}] ${inline(m[2])}</p>`);
    } else if (line.trim() === '') {
      closeList();
      htmlBuffer.push('<br />');
    } else {
      closeList();
      htmlBuffer.push(`<p>${inline(line)}</p>`);
    }
    i++;
  }
  flushHtml();

  return blocks;
}

/** Back-compat: renders the whole message as one HTML string (used where block-level interactivity isn't needed). */
export function renderMarkdown(source: string): string {
  return parseMarkdownBlocks(source)
    .map((b) => {
      if (b.type === 'html') return b.html;
      if (b.type === 'mermaid') return `<pre class="mermaid-fallback text-xs font-mono bg-navy-900 text-ink-100 rounded-xl p-4 overflow-x-auto">${escapeHtml(b.code)}</pre>`;
      return `<pre class="rounded-xl bg-navy-900 dark:bg-black/40 text-ink-100 p-4 overflow-x-auto my-2 text-sm"><code class="font-mono">${escapeHtml(b.code)}</code></pre>`;
    })
    .join('\n');
}

