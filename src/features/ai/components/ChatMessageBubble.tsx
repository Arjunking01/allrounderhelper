import { useState } from 'react';
import { Copy, Info, User, RotateCw, Pencil, Trash2, Quote, Pin, Share2, Check, X, AlertCircle, FileWarning, MoreHorizontal, ChevronsDown } from 'lucide-react';
import aiAvatar from '@/assets/ai-character/allrounder-ai-avatar.png';
import { clsx } from '@/lib/utils/clsx';
import { AiFlameAvatar } from './AiFlameAvatar';
import { MarkdownRenderer } from './MarkdownRenderer';
import { useToast } from '@/components/ToastProvider';
import { copyToClipboard } from '@/lib/clipboard';
import { estimateTokens } from '../logic/useConversations';
import type { ChatMessage } from '../logic/aiTypes';

interface Props {
  message: ChatMessage;
  canRegenerate?: boolean;
  /** PHASE 2 — true whenever ANY generation is in flight in this conversation (not just this
   *  message). Disables Edit/Retry/Continue on every message while true, per PHASE_2's "never
   *  mutate conversation history while a provider stream is writing to it" rule — a stream only
   *  ever writes to the LAST message, but Edit/Retry/Continue on an earlier message would still
   *  race the in-flight request's own appendMessage/updateMessage calls. */
  isGenerating?: boolean;
  onEdit?: (content: string) => void;
  onDelete?: () => void;
  onRetry?: () => void;
  /** PHASE 2 — present only for the most recent assistant message when it's actually
   *  continuable (see generationEngine.isContinuableFinishReason + the persisted
   *  `continuable` flag) — undefined otherwise, so this component never has to re-derive the
   *  continuability rule itself. */
  onContinue?: () => void;
  onQuote?: (content: string) => void;
  onTogglePin?: () => void;
}

/** Renders one image attachment thumbnail, falling back to a plain icon+name chip if the
 *  image fails to load. This is the common case for any attachment/generated image from a
 *  *previous* session: previewUrl is a `blob:` object URL, which only lives as long as the
 *  page that created it — reloading the tab invalidates it. Rather than a broken-image
 *  icon, older messages degrade to a clearly-labeled "no longer available" chip. */
function AttachmentThumb({ name, previewUrl }: { name: string; previewUrl: string }) {
  const [broken, setBroken] = useState(false);
  // previewUrl should only ever be a same-session `blob:` object URL created by
  // URL.createObjectURL (see AttachmentBar.tsx) — never user- or file-supplied text. But a
  // ChatMessage can also arrive via "Import chat" (an untrusted JSON file), which could set
  // this field to an arbitrary string like `javascript:...`. React doesn't sanitize href/src
  // protocols, so without this check a crafted import could turn an attachment thumbnail into
  // a click-to-execute link. Enforcing the documented `blob:` contract here — the single place
  // this value reaches the DOM — closes that off regardless of which caller produced the data.
  if (broken || !previewUrl.startsWith('blob:')) {
    return (
      <span className="inline-flex items-center gap-1 rounded bg-black/10 dark:bg-white/10 px-1.5 py-1 text-[10px] h-fit" title="This image was only available during the session it was sent">
        <FileWarning size={12} className="shrink-0" /> {name} (expired)
      </span>
    );
  }
  return (
    <a href={previewUrl} target="_blank" rel="noopener noreferrer" aria-label={`Open ${name} full size`} className="block h-20 w-20 rounded-lg overflow-hidden border border-black/10 dark:border-white/10 hover:opacity-90 transition-opacity">
      <img src={previewUrl} alt={name} className="h-full w-full object-cover" onError={() => setBroken(true)} />
    </a>
  );
}

export function ChatMessageBubble({ message, canRegenerate, isGenerating, onEdit, onDelete, onRetry, onContinue, onQuote, onTogglePin }: Props) {
  const { showToast } = useToast();
  const [showMoreActions, setShowMoreActions] = useState(false);
  const isUser = message.role === 'user';
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.content);

  if (message.isSystemNotice && !message.isError) {
    return (
      <div className="flex items-start gap-2.5 rounded-xl border border-amber-400/30 bg-amber-400/5 px-4 py-3 max-w-2xl">
        <Info size={15} className="text-amber-500 shrink-0 mt-0.5" />
        <p className="text-sm text-navy-600 dark:text-ink-300">{message.content}</p>
      </div>
    );
  }

  function commitEdit() {
    if (draft.trim() && draft !== message.content) onEdit?.(draft.trim());
    setEditing(false);
  }

  function share() {
    copyToClipboard(message.content).then((ok) => {
      showToast(ok ? 'Copied — paste it anywhere to share' : 'Could not copy message');
    });
  }

  if (message.isError) {
    return (
      <div className="flex items-start gap-2.5 rounded-xl border border-red-400/30 bg-red-400/5 px-4 py-3 max-w-2xl">
        <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-navy-700 dark:text-ink-200">{message.content}</p>
          <div className="flex items-center gap-2 mt-2">
            <button onClick={() => { copyToClipboard(message.content).then((ok) => showToast(ok ? 'Copied message' : 'Could not copy message')); }} className="flex items-center gap-1 text-xs font-medium text-navy-500 dark:text-ink-400 hover:text-navy-700 dark:hover:text-ink-200">
              <Copy size={12} /> Copy
            </button>
            {onRetry && (
              <button
                onClick={canRegenerate ? onRetry : undefined}
                disabled={!canRegenerate}
                title={canRegenerate ? 'Retry' : 'Retry isn\'t available right now'}
                className={clsx('flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300', !canRegenerate && 'opacity-40 cursor-not-allowed')}
              >
                <RotateCw size={12} /> Retry
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx('flex gap-3 max-w-2xl', isUser && 'ml-auto flex-row-reverse')}>
      {isUser ? (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full overflow-hidden bg-navy-900 dark:bg-white text-white dark:text-navy-900">
          <User size={14} />
        </div>
      ) : (
        // The AI's identity in the conversation itself — same flame character as the header,
        // lit only while this specific message is still streaming. This is the one place the
        // flame actually needs to live (see AiFlameAvatar.tsx); the header instance mirrors
        // the overall isThinking/isGenerating state, this one reflects this message.
        <AiFlameAvatar active={!!message.isStreaming} idleSrc={aiAvatar} size={32} className="shrink-0" />
      )}
      <div className={clsx('group relative rounded-2xl px-4 py-3 text-sm leading-relaxed min-w-0 break-words', isUser ? 'bg-navy-900 dark:bg-white text-white dark:text-navy-900' : 'glass-panel')}>
        {editing ? (
          <div className="min-w-0 w-full sm:min-w-[240px]">
            <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={3} aria-label="Edit message" className="w-full rounded-lg border border-electric-500 bg-white dark:bg-navy-900 text-navy-900 dark:text-ink-100 p-2 text-sm outline-none" />
            <p className={clsx('mt-1 text-[11px]', isUser ? 'text-white/70 dark:text-navy-500' : 'text-navy-400 dark:text-ink-500')}>
              Editing this message will regenerate the conversation from here.
            </p>
            <div className="flex gap-1.5 mt-1.5">
              <button onClick={commitEdit} aria-label="Save edit and regenerate" className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-emerald-500 text-white"><Check size={11} /> Save &amp; regenerate</button>
              <button onClick={() => { setEditing(false); setDraft(message.content); }} aria-label="Cancel edit" className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-navy-200 dark:bg-white/10"><X size={11} /> Cancel</button>
            </div>
          </div>
        ) : (
          <>
            {message.pinned && <Pin size={11} className="text-amber-500 mb-1" />}
            {message.attachments && message.attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {message.attachments.filter((a) => a.previewUrl).map((a) => (
                  <AttachmentThumb key={a.id} name={a.name} previewUrl={a.previewUrl!} />
                ))}
                {message.attachments.filter((a) => !a.previewUrl).map((a) => (
                  <span key={a.id} className="inline-flex items-center gap-1 rounded bg-black/10 dark:bg-white/10 px-1.5 py-0.5 text-[10px] h-fit">
                    {a.name}
                  </span>
                ))}
              </div>
            )}
            <MarkdownRenderer source={message.content} />
            {message.isStreaming && <span className="inline-block w-1.5 h-4 bg-electric-500 animate-pulse ml-0.5 align-middle" aria-hidden="true" />}
            {/* PHASE 2 — the truncated/unknown-completion caveat and the real Continue action
             *  both live here, driven entirely by persisted metadata (never baked into
             *  `message.content` — see AiAssistantPage's send()/continueMessage() doc comments
             *  for why), so a reloaded conversation renders the exact same honest state it had
             *  before the reload. */}
            {!message.isStreaming && !isUser && (message.finishReason === 'length' || message.finishReason === 'unknown') && (
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <span className="text-[11px] text-navy-400 dark:text-ink-500 italic">
                  {message.finishReason === 'length' ? 'Response is very long — it may be cut off.' : "This provider doesn't report whether the response was cut off."}
                </span>
                {onContinue ? (
                  <button
                    onClick={onContinue}
                    disabled={isGenerating}
                    aria-label={message.finishReason === 'length' ? 'Continue response' : 'Continue response if this looks incomplete'}
                    title={message.finishReason === 'length' ? 'Continue generating from where this left off' : 'Continue if this looks incomplete'}
                    className={clsx(
                      'flex items-center gap-1.5 rounded-full border px-3 py-2 sm:px-2.5 sm:py-1 text-xs sm:text-[11px] font-medium border-electric-500/40 text-electric-600 dark:text-electric-400 hover:bg-electric-500/10 transition-colors min-h-[36px] sm:min-h-0',
                      isGenerating && 'opacity-40 cursor-not-allowed'
                    )}
                  >
                    <ChevronsDown size={12} />
                    {message.finishReason === 'length' ? 'Continue' : 'Continue if incomplete'}
                  </button>
                ) : (
                  <span className="text-[11px] text-navy-400 dark:text-ink-500">Reached the continuation limit for this response — start a new question if you need more.</span>
                )}
              </div>
            )}
            <div className={clsx('flex items-center gap-2 mt-1.5 text-[10px]', isUser ? 'text-white/60 dark:text-navy-500' : 'text-navy-400 dark:text-ink-500')}>
              <span>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <span>· ~{estimateTokens(message.content)} tok</span>
              {message.modelUsed && <span>· {message.modelUsed}</span>}
              {typeof message.generationMs === 'number' && <span>· {(message.generationMs / 1000).toFixed(1)}s</span>}
            </div>
          </>
        )}

        {!editing && (
          <div className={clsx('static mt-2 sm:mt-0 sm:absolute sm:-bottom-3 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity flex items-center gap-2 sm:gap-1 flex-wrap', isUser ? 'sm:left-1' : 'sm:right-1')}>
            <button onClick={() => { copyToClipboard(message.content).then((ok) => showToast(ok ? 'Copied message' : 'Could not copy message')); }} aria-label="Copy message" className="flex h-9 w-9 sm:h-7 sm:w-7 items-center justify-center rounded-full border shadow-sm bg-white dark:bg-navy-800 border-navy-100 dark:border-white/10">
              <Copy size={11} className="text-navy-500 dark:text-ink-400" />
            </button>
            {/* Quote/Pin/Share/Delete: full-size, always-available on desktop (hover-revealed
                along with the rest of this row), but folded into the compact "More" popover
                below on mobile instead of six always-visible buttons stacked under every
                message — see the mobile-only block further down. */}
            {onQuote && (
              <button onClick={() => onQuote(message.content)} aria-label="Quote reply" className="hidden sm:flex h-7 w-7 items-center justify-center rounded-full border shadow-sm bg-white dark:bg-navy-800 border-navy-100 dark:border-white/10">
                <Quote size={11} className="text-navy-500 dark:text-ink-400" />
              </button>
            )}
            {onTogglePin && (
              <button onClick={onTogglePin} aria-label={message.pinned ? 'Unpin' : 'Pin message'} className="hidden sm:flex h-7 w-7 items-center justify-center rounded-full border shadow-sm bg-white dark:bg-navy-800 border-navy-100 dark:border-white/10">
                <Pin size={11} className={message.pinned ? 'text-amber-500' : 'text-navy-500 dark:text-ink-400'} />
              </button>
            )}
            <button onClick={share} aria-label="Share message" className="hidden sm:flex h-7 w-7 items-center justify-center rounded-full border shadow-sm bg-white dark:bg-navy-800 border-navy-100 dark:border-white/10">
              <Share2 size={11} className="text-navy-500 dark:text-ink-400" />
            </button>
            {isUser && onEdit && (
              <button
                onClick={() => !isGenerating && setEditing(true)}
                disabled={isGenerating}
                aria-label={isGenerating ? 'Edit message (unavailable while a response is generating)' : 'Edit message'}
                title={isGenerating ? 'Wait for the current response to finish, or Stop it, before editing' : 'Edit'}
                className={clsx('flex h-9 w-9 sm:h-7 sm:w-7 items-center justify-center rounded-full border shadow-sm bg-white dark:bg-navy-800 border-navy-100 dark:border-white/10', isGenerating && 'opacity-40 cursor-not-allowed')}
              >
                <Pencil size={11} className="text-navy-500 dark:text-ink-400" />
              </button>
            )}
            {onDelete && (
              <button onClick={onDelete} disabled={isGenerating} aria-label="Delete message" className={clsx('hidden sm:flex h-7 w-7 items-center justify-center rounded-full border shadow-sm bg-white dark:bg-navy-800 border-navy-100 dark:border-white/10', isGenerating && 'opacity-40 cursor-not-allowed')}>
                <Trash2 size={11} className="text-red-500" />
              </button>
            )}
            {!isUser && onRetry && (
              <button
                onClick={canRegenerate ? onRetry : undefined}
                disabled={!canRegenerate}
                aria-label={canRegenerate ? 'Retry response' : 'Retry (not available right now)'}
                title={canRegenerate ? 'Retry' : 'Retry isn\'t available right now'}
                className={clsx('flex h-9 w-9 sm:h-7 sm:w-7 items-center justify-center rounded-full border shadow-sm bg-white dark:bg-navy-800 border-navy-100 dark:border-white/10', !canRegenerate && 'opacity-40 cursor-not-allowed')}
              >
                <RotateCw size={11} className="text-navy-500 dark:text-ink-400" />
              </button>
            )}
            {(onQuote || onTogglePin || onDelete) && (
              <div className="relative sm:hidden">
                <button onClick={() => setShowMoreActions((v) => !v)} aria-label="More message actions" aria-expanded={showMoreActions} className="flex h-9 w-9 items-center justify-center rounded-full border shadow-sm bg-white dark:bg-navy-800 border-navy-100 dark:border-white/10">
                  <MoreHorizontal size={14} className="text-navy-500 dark:text-ink-400" />
                </button>
                {showMoreActions && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowMoreActions(false)} />
                    <div className={clsx('absolute z-50 top-11 w-40 rounded-xl border border-navy-100 dark:border-white/10 bg-white dark:bg-navy-900 shadow-xl p-1.5 flex flex-col gap-0.5', isUser ? 'right-0' : 'left-0')}>
                      <button onClick={() => { share(); setShowMoreActions(false); }} className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-navy-700 dark:text-ink-200 hover:bg-navy-50 dark:hover:bg-white/5">
                        <Share2 size={13} /> Share
                      </button>
                      {onQuote && (
                        <button onClick={() => { onQuote(message.content); setShowMoreActions(false); }} className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-navy-700 dark:text-ink-200 hover:bg-navy-50 dark:hover:bg-white/5">
                          <Quote size={13} /> Quote reply
                        </button>
                      )}
                      {onTogglePin && (
                        <button onClick={() => { onTogglePin(); setShowMoreActions(false); }} className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-navy-700 dark:text-ink-200 hover:bg-navy-50 dark:hover:bg-white/5">
                          <Pin size={13} className={message.pinned ? 'text-amber-500' : undefined} /> {message.pinned ? 'Unpin' : 'Pin message'}
                        </button>
                      )}
                      {onDelete && (
                        <button onClick={() => { onDelete(); setShowMoreActions(false); }} className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10">
                          <Trash2 size={13} /> Delete
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
