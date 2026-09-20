import { useEffect, useRef, useState } from 'react';

let mermaidInitialized = false;

export function MermaidDiagram({ code }: { code: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        const mermaid = (await import('mermaid')).default;
        if (!mermaidInitialized) {
          mermaid.initialize({ startOnLoad: false, theme: 'neutral', securityLevel: 'strict' });
          mermaidInitialized = true;
        }
        const id = `mermaid-${Math.random().toString(36).slice(2)}`;
        const { svg: rendered } = await mermaid.render(id, code);
        if (!cancelled) {
          setSvg(rendered);
          setError(null);
        }
      } catch {
        if (!cancelled) setError('Could not render this diagram — check the Mermaid syntax.');
      }
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [code]);

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 my-2">
        <p className="text-sm text-red-500 mb-2">{error}</p>
        <pre className="text-xs font-mono text-navy-500 dark:text-ink-400 overflow-x-auto">{code}</pre>
      </div>
    );
  }

  if (!svg) {
    return <div className="rounded-xl border border-navy-100 dark:border-white/10 p-6 my-2 text-center text-sm text-navy-400 animate-pulse">Rendering diagram...</div>;
  }

  return <div ref={containerRef} className="rounded-xl border border-navy-100 dark:border-white/10 bg-white p-4 my-2 overflow-x-auto [&_svg]:mx-auto" dangerouslySetInnerHTML={{ __html: svg }} />;
}
