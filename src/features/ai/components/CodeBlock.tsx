import { useState } from 'react';
import { Copy, Check, ChevronDown, ChevronUp, Download } from 'lucide-react';
import { useToast } from '@/components/ToastProvider';
import { downloadBlob } from '@/features/document/logic/fileUtils';
import { copyToClipboard } from '@/lib/clipboard';

const COLLAPSE_THRESHOLD_LINES = 12;
const EXT_BY_LANG: Record<string, string> = { js: 'js', javascript: 'js', ts: 'ts', typescript: 'ts', py: 'py', python: 'py', java: 'java', c: 'c', cpp: 'cpp', html: 'html', css: 'css', sql: 'sql', json: 'json' };

export function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);
  const lines = code.split('\n');
  const [collapsed, setCollapsed] = useState(lines.length > COLLAPSE_THRESHOLD_LINES);

  async function copyCode() {
    const ok = await copyToClipboard(code);
    if (!ok) { showToast('Could not copy code'); return; }
    setCopied(true);
    showToast('Code copied');
    setTimeout(() => setCopied(false), 1500);
  }

  function downloadCode() {
    const ext = EXT_BY_LANG[lang.toLowerCase()] ?? 'txt';
    downloadBlob(new Blob([code], { type: 'text/plain' }), `snippet.${ext}`);
  }

  return (
    <div className="rounded-xl overflow-hidden border border-white/10 my-2">
      <div className="flex items-center justify-between gap-2 bg-navy-800 dark:bg-black/60 px-3 py-1.5 text-xs text-ink-400">
        <span className="font-mono truncate min-w-0">{lang || 'text'}</span>
        <div className="flex items-center gap-1 shrink-0">
          {lines.length > COLLAPSE_THRESHOLD_LINES && (
            <button onClick={() => setCollapsed((v) => !v)} aria-label={collapsed ? `Expand code (${lines.length} lines)` : 'Collapse code'} title={collapsed ? `Show ${lines.length} lines` : 'Collapse'} className="flex items-center gap-1 px-2 py-1 rounded hover:bg-white/10">
              {collapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
              <span className="hidden sm:inline">{collapsed ? `Show ${lines.length} lines` : 'Collapse'}</span>
            </button>
          )}
          <button onClick={downloadCode} aria-label="Download code" title="Download" className="flex items-center gap-1 px-2 py-1 rounded hover:bg-white/10"><Download size={12} /></button>
          <button onClick={copyCode} aria-label="Copy code" title={copied ? 'Copied' : 'Copy'} className="flex items-center gap-1 px-2 py-1 rounded hover:bg-white/10">
            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>
      <pre className={`bg-navy-900 dark:bg-black/40 text-ink-100 p-4 overflow-x-auto text-sm m-0 ${collapsed ? 'max-h-40 overflow-y-hidden' : ''}`}>
        <code className="font-mono whitespace-pre">
          {lines.map((l, i) => (
            <div key={i} className="table-row">
              <span className="table-cell pr-3 select-none text-ink-500/50 text-right">{i + 1}</span>
              <span className="table-cell">{l}</span>
            </div>
          ))}
        </code>
      </pre>
      {collapsed && (
        <button onClick={() => setCollapsed(false)} className="w-full text-center text-xs text-electric-400 bg-navy-900 dark:bg-black/40 py-1.5 hover:underline">
          Show full code ({lines.length} lines)
        </button>
      )}
    </div>
  );
}
