import { useMemo } from 'react';
import { parseMarkdownBlocks } from '@/lib/markdown';
import { CodeBlock } from './CodeBlock';
import { MermaidDiagram } from './MermaidDiagram';

export function MarkdownRenderer({ source }: { source: string }) {
  const blocks = useMemo(() => parseMarkdownBlocks(source), [source]);

  return (
    <div className="prose-content space-y-1">
      {blocks.map((block, i) => {
        if (block.type === 'code') return <CodeBlock key={i} lang={block.lang} code={block.code} />;
        if (block.type === 'mermaid') return <MermaidDiagram key={i} code={block.code} />;
        return <div key={i} dangerouslySetInnerHTML={{ __html: block.html }} />;
      })}
    </div>
  );
}
