import { useLocation, useNavigate } from 'react-router-dom';
import aiAvatar from '@/assets/ai-character/allrounder-ai-avatar.png';

/** Human-readable label for the current section, used to give the AI assistant page context. */
function contextLabelFor(pathname: string): string | null {
  if (pathname === '/' || pathname.startsWith('/ai-assistant')) return null;
  const segments = pathname.split('/').filter(Boolean);
  const label = segments[segments.length - 1]
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  return label;
}

export function FloatingAiButton() {
  const location = useLocation();
  const navigate = useNavigate();

  // Don't show on the AI assistant itself — it would float over its own composer.
  if (location.pathname.startsWith('/ai-assistant')) return null;

  const context = contextLabelFor(location.pathname);

  function open() {
    navigate('/ai-assistant', { state: context ? { pageContext: context, fromPath: location.pathname } : undefined });
  }

  return (
    <button
      onClick={open}
      className="fixed right-5 z-40 flex items-center gap-2 rounded-full gradient-brand text-white pl-2 pr-2 min-[360px]:pr-4 py-2 text-sm font-semibold shadow-xl shadow-electric-500/25 hover:brightness-110 active:brightness-95 transition-all"
      style={{ bottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))' }}
      aria-label="Ask ALLROUNDER HELPER AI"
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/15 p-1">
        <img src={aiAvatar} alt="" className="h-full w-full object-contain" />
      </span>
      <span className="hidden sm:inline">Ask ALLROUNDER HELPER AI</span>
      <span className="hidden min-[360px]:inline sm:hidden">Ask AI</span>
    </button>
  );
}
