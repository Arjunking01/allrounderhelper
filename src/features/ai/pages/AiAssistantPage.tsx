import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Send, BookOpen, Settings, Menu, X, Activity, Square, Search, Upload, Download, ArrowDown, Mic, MicOff } from 'lucide-react';
import { clsx } from '@/lib/utils/clsx';
import { AiFlameAvatar } from '../components/AiFlameAvatar';
import aiAvatar from '@/assets/ai-character/allrounder-ai-avatar.png';
import { useToast } from '@/components/ToastProvider';
import { PageInfoSection } from '@/components/PageInfoSection';
import { ChatSearchBar } from '../components/ChatSearchBar';
import { AiStatusPanel } from '../components/AiStatusPanel';
import { AttachmentBar } from '../components/AttachmentBar';
import { DocumentQuickActions } from '../components/DocumentQuickActions';
import { AiOnboardingDialog } from '../components/AiOnboardingDialog';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { generateImage, isImageGenerationRequest, IMAGE_GENERATION_ENABLED } from '../logic/imageGeneration';
import { hasAttachmentText, hasImageAttachment, totalImagePayloadBytes, collectImageMimeTypes, expiredAttachmentNotice, MAX_TOTAL_IMAGE_PAYLOAD_BYTES, type Attachment } from '../logic/attachmentTypes';
import { Seo, SITE_URL } from '@/components/Seo';
import { Breadcrumbs, breadcrumbJsonLd } from '@/components/ui/Breadcrumbs';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { downloadBlob } from '@/features/document/logic/fileUtils';
import { ChatSidebar } from '../components/ChatSidebar';
import { ChatMessageBubble } from '../components/ChatMessageBubble';
import { FollowUpChips } from '../components/FollowUpChips';
import { getFollowUpSuggestions } from '../logic/followUpSuggestions';
import { TypingIndicator } from '../components/TypingIndicator';
import { PromptLibraryPanel } from '../components/PromptLibraryPanel';
import { useConversations } from '../logic/useConversations';
import { useAISettings } from '../logic/useAISettings';
import { useDailyMessageLimit } from '../logic/useDailyMessageLimit';
import { DailyLimitReached } from '../components/DailyLimitReached';
import { getActiveProvider, hasVisionCapableProvider } from '../logic/providerRegistry';

import { useSpeechToText } from '../logic/useSpeechToText';
import { buildProviderMessages, estimateProviderMessagesBytes, MAX_ESTIMATED_REQUEST_BYTES } from '../logic/promptBuilder';
import { runGenerationLoop, isContinuableFinishReason, findLastRetryableAssistantIndex, MAX_AUTO_CONTINUATIONS, MAX_MANUAL_CONTINUATIONS_PER_ACTION, type GenerationFinishReason } from '../logic/generationEngine';
import type { RoutingContext } from '../logic/providerOrchestrator';
import { CHAT_MODES, getChatMode } from '../logic/chatModes';
import { PROBLEM_STARTERS } from '../logic/promptLibrary';
import { isRecommendationQuery, precedingUserText } from '../logic/affiliateDetection';
import { AffiliateRecommendationCard } from '../components/AffiliateRecommendationCard';
import { getGreeting, getGreetingSubtext } from '@/lib/greeting';
import { usePreferencesStore } from '@/lib/store/preferences';
import { buildPdfTextDocument } from '@/lib/pdfTextDocument';
import { PROVIDER_UNAVAILABLE_MESSAGE, type ChatMessage } from '../logic/aiTypes';
import type { PromptTemplate } from '../logic/promptLibrary';

export default function AiAssistantPage() {
  const { settings } = useAISettings();
  const [chatModeId, setChatModeId] = useState('default');
  const {
    conversations, active, activeId, setActiveId, search, setSearch,
    folderFilter, setFolderFilter,
    createConversation, renameConversation, deleteConversation, appendMessage, updateMessage,
    editMessageAndTruncate, deleteMessagesFrom, deleteMessage, togglePinMessage,
    togglePin, toggleArchive, restoreConversation, permanentlyDelete, clearAllConversations, duplicateConversation, importConversation,
  } = useConversations(settings.activeProviderId);

  const { remaining, limitReached, limit, used: usedToday, recordMessage, canSend } = useDailyMessageLimit();
  const providerReady = getActiveProvider(settings).isConfigured(settings);
  const { showToast } = useToast();
  const handleVoiceResult = useCallback((transcript: string) => {
    setInput((prev) => (prev.trim() ? `${prev.trim()} ${transcript}` : transcript));
  }, []);
  const voice = useSpeechToText(handleVoiceResult);
  useEffect(() => {
    if (voice.errorMessage) showToast(voice.errorMessage, 'error');
  }, [voice.errorMessage, showToast]);
  const abortRef = useRef<AbortController | null>(null);
  // PHASE 2.1 — a synchronous correctness guard, independent of (and stronger than) the
  // `isGenerating` React state check every action already had. `isGenerating` is state: a
  // rapid double-invocation of two different action functions (e.g. two fast taps, or a tap on
  // Send immediately followed by a tap on Retry before React has re-rendered) can both read
  // `isGenerating === false` before either one's `setIsGenerating(true)` has actually flushed,
  // since state updates are not synchronous. A plain ref IS synchronous — set as literally the
  // first statement of every action (send/continueMessage/retryLast/editAndRegenerate) and
  // guaranteed released in that action's `finally`, this ref alone is what actually enforces
  // "at most one generation action mutates this conversation at a time," with `isGenerating`
  // remaining purely a UI-disabling signal on top of it (kept for the disabled/loading states
  // ChatMessageBubble and the composer already render from it).
  const generationLockRef = useRef(false);

  // Mode selection only swaps the system prompt for the outgoing request — same provider,
  // same conversation, same everything else. See chatModes.ts.
  function effectiveSettings() {
    const mode = getChatMode(chatModeId);
    return mode.systemPrompt ? { ...settings, systemPrompt: mode.systemPrompt } : settings;
  }

  // Abort any in-flight generation when the user navigates away — otherwise the fetch
  // keeps streaming against an unmounted component, its chunks silently no-op instead
  // of saving, and the message the user was already charged against their daily limit
  // for is lost with nothing persisted.
  useEffect(() => () => abortRef.current?.abort(), []);
  const importInputRef = useRef<HTMLInputElement>(null);

  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const displayName = usePreferencesStore((s) => s.displayName);
  const greeting = getGreeting(displayName);
  const greetingSubtext = getGreetingSubtext();

  // Auto-grow the composer as content changes — from typing, pasting, or programmatic
  // fills (prompt templates, quote-reply). Capped by the textarea's own max-h-32 (128px);
  // beyond that it scrolls internally instead of growing further.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [input]);
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  // Individual removal (AttachmentBar's X button) and send() already revoke/hand off object
  // URLs correctly. The gap is navigating away with attachments still staged but never sent —
  // in an SPA the document never unloads, so those blob URLs would otherwise leak for the rest
  // of the session. A ref keeps the cleanup reading the latest attachments without re-running
  // the effect (and re-subscribing) on every keystroke/attachment change.
  const pendingAttachmentsRef = useRef(pendingAttachments);
  pendingAttachmentsRef.current = pendingAttachments;
  useEffect(() => () => {
    for (const a of pendingAttachmentsRef.current) {
      if (a.previewUrl) URL.revokeObjectURL(a.previewUrl);
    }
  }, []);
  const [confirmAction, setConfirmAction] = useState<{ type: 'permanentDelete'; id: string } | { type: 'clearAll' } | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const sidebarPanelRef = useRef<HTMLDivElement>(null);
  const sidebarToggleRef = useRef<HTMLButtonElement>(null);

  // Mobile overlay drawer: lock body scroll, trap focus inside the panel, restore focus
  // to the toggle button on close, and allow Escape-to-close — all while open.
  // Desktop's sidebar is a plain static grid column (see render below) and never
  // triggers this — it only applies to the below-lg overlay.
  useEffect(() => {
    if (!showSidebar) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const panel = sidebarPanelRef.current;
    const focusable = () =>
      panel ? Array.from(panel.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])')) : [];
    focusable()[0]?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setShowSidebar(false); return; }
      if (e.key !== 'Tab') return;
      const items = focusable();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
      sidebarToggleRef.current?.focus();
    };
  }, [showSidebar]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pinnedToBottomRef = useRef(true);
  // Mirrors pinnedToBottomRef into render state — the ref alone can't drive the
  // "jump to latest" button's visibility since ref writes don't trigger a re-render.
  const [isPinnedToBottom, setIsPinnedToBottom] = useState(true);
  const routerLocation = useLocation();

  // If the user opened the assistant from the floating "Ask AI" button on another page,
  // prefill the composer so the AI already knows what page they were asking about.
  // If they opened it via a "recent conversation" link (e.g. from the Dashboard), jump
  // straight to that conversation instead.
  useEffect(() => {
    const state = routerLocation.state as { pageContext?: string; openConversationId?: string; draftPrompt?: string } | null;
    // draftPrompt (from a document tool's "Ask AI about this" hand-off) carries real
    // content, so it takes priority over the generic "I'm on the X page" pageContext
    // prefill — having both would mean the actual document text gets silently dropped.
    if (state?.draftPrompt && !input) {
      setInput(state.draftPrompt);
    } else if (state?.pageContext && !input) {
      setInput(`I'm on the ${state.pageContext} page. `);
    }
    if (state?.openConversationId) {
      setActiveId(state.openConversationId);
    }
    // Intentionally run only once on mount — this is a one-time prefill, not a sync.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // exportChat is a plain function redefined every render (it closes over `active`), so we
  // stash the latest version in a ref rather than adding it to the effect's deps below —
  // that keeps the keydown listener subscribed once while still calling the current
  // conversation's export logic instead of a stale one captured at mount time.
  const exportChatRef = useRef(exportChat);
  exportChatRef.current = exportChat;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === '/') { e.preventDefault(); document.getElementById('ai-chat-input')?.focus(); }
      else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'n') { e.preventDefault(); createConversation(); }
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') { e.preventDefault(); exportChatRef.current('md'); }
      else if (e.key === 'Escape') { setShowLibrary(false); setShowStatus(false); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [createConversation]);

  const lastMessageContent = active?.messages[active.messages.length - 1]?.content;

  useEffect(() => {
    if (pinnedToBottomRef.current) {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
    // Depending on the *content* of the last message (not just message count) is what
    // makes this fire on every streamed chunk — updateMessage() grows a message's text
    // in place without changing active.messages.length, so length alone misses streaming.
  }, [active?.messages.length, lastMessageContent, isThinking]);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    // "Near" bottom (40px slack) rather than exact, so this doesn't fight rounding/scrollbar jitter.
    const nowPinned = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    pinnedToBottomRef.current = nowPinned;
    // Functional update + only touching state on an actual change keeps this cheap even
    // though onScroll can fire dozens of times per second while dragging the scrollbar.
    setIsPinnedToBottom((prev) => (prev === nowPinned ? prev : nowPinned));
  }

  function jumpToLatest() {
    pinnedToBottomRef.current = true;
    setIsPinnedToBottom(true);
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }

  async function send(text?: string) {
    if (generationLockRef.current || isGenerating) return;
    generationLockRef.current = true;
    try {
    const content = (text ?? input).trim();
    if (!content) return;
    pinnedToBottomRef.current = true; // sending should always bring the new message into view
    setIsPinnedToBottom(true);
    if (!canSend()) {
      showToast(`You've reached today's ${limit}-message AI limit.`, 'info');
      return;
    }
    if (pendingAttachments.some((a) => a.status === 'reading')) {
      showToast('Still reading an attached file \u2014 send again in a moment.', 'info');
      return;
    }
    // Checked BEFORE recordMessage()/sending, using the actual base64-encoded size (not raw
    // file size) of every image that would be sent \u2014 real images plus any rasterized scanned-
    // PDF pages together \u2014 so an over-budget request is rejected with an honest, actionable
    // error and doesn't burn a daily message credit, rather than failing later as a generic
    // HTTP 413 from the server proxy (see api/_shared.ts's MAX_AI_BODY_BYTES_VISION, which this
    // budget is deliberately kept under) after the user has already waited on it.
    const imagePayloadBytes = totalImagePayloadBytes(pendingAttachments);
    if (imagePayloadBytes > MAX_TOTAL_IMAGE_PAYLOAD_BYTES) {
      showToast('These attachments are too large to send together \u2014 try removing one image or scanned PDF.', 'error');
      return;
    }

    // Built here (rather than after recordMessage()/appendMessage() as before) so the PHASE 1.7
    // whole-request size check below can run \u2014 and reject an over-budget send honestly,
    // without burning a message credit or showing a message that's about to be refused \u2014
    // BEFORE anything is committed to the conversation. Reused again further down for the
    // actual send, so this is the only place buildProviderMessages is called for this turn.
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user', content, createdAt: new Date().toISOString(), attachments: pendingAttachments.length ? pendingAttachments : undefined };
    const imagesAttached = hasImageAttachment(userMessage.attachments);
    const imageMimeTypes = collectImageMimeTypes(userMessage.attachments);
    const baseProviderMessages = buildProviderMessages([...(active?.messages ?? []), userMessage], effectiveSettings());

    // PHASE 1.7 \u2014 the client-side image-only budget above (MAX_TOTAL_IMAGE_PAYLOAD_BYTES)
    // never accounted for conversation history, extracted document text, or the system prompt
    // sharing the same request body \u2014 all of which travel in the same JSON payload to
    // api/_shared.ts's MAX_AI_BODY_BYTES_VISION-guarded proxy (24MB). buildProviderMessages now
    // bounds history automatically (see promptBuilder.ts's boundHistory), but this is the actual
    // "did that bounding, plus everything else in this specific request, land under the wire
    // limit" check \u2014 a deterministic measurement of the real payload, not another guess.
    // MAX_ESTIMATED_REQUEST_BYTES is kept comfortably under the proxy's 24MB so there's still
    // room for each provider's own wrapper JSON (generationConfig, safetySettings, sampling
    // params, etc. \u2014 all small next to message content, but non-zero).
    const estimatedBytes = estimateProviderMessagesBytes(baseProviderMessages);
    if (estimatedBytes > MAX_ESTIMATED_REQUEST_BYTES) {
      showToast('This conversation plus its attachments is too large to send in one request \u2014 try starting a new chat or removing an attachment.', 'error');
      return;
    }

    recordMessage();

    let id = activeId;
    if (!id) id = createConversation();

    setPendingAttachments([]);
    appendMessage(id, userMessage);
    setInput('');

    // Image generation is a distinct capability from text chat (see imageGeneration.ts) —
    // detected and handled here, before any text provider is invoked, rather than asking
    // a text-completion model to somehow "generate" an image.
    if (IMAGE_GENERATION_ENABLED && isImageGenerationRequest(content)) {
      setIsGenerating(true);
      try {
        const imageResult = await generateImage(content);
        if (imageResult.ok) {
          appendMessage(id, {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: 'Here\u2019s what I generated:',
            createdAt: new Date().toISOString(),
            modelUsed: 'Pollinations (image)',
            attachments: [{ id: crypto.randomUUID(), name: 'generated-image.jpg', size: 0, type: 'image/jpeg', previewUrl: imageResult.objectUrl, status: 'ready' }],
          });
        } else {
          appendMessage(id, { id: crypto.randomUUID(), role: 'assistant', content: imageResult.message, createdAt: new Date().toISOString(), isSystemNotice: true, isError: true });
        }
      } catch {
        // Defensive fallback: generateImage() already catches its own errors, but an
        // uncaught throw here must still not leave isGenerating — and therefore the
        // header flame — stuck on indefinitely.
        appendMessage(id, { id: crypto.randomUUID(), role: 'assistant', content: 'Image generation failed unexpectedly.', createdAt: new Date().toISOString(), isSystemNotice: true, isError: true });
      } finally {
        setIsGenerating(false);
      }
      return;
    }

    // Honest capability check, BEFORE any provider is invoked: if this message carries real
    // image data (see attachmentsWithImages \u2014 not just "an image was picked", but the
    // base64 read genuinely finished) and nothing currently configured can actually view an
    // image \u2014 or, Phase 1.7, nothing configured supports THIS specific format \u2014 say so
    // plainly right now rather than silently routing to a text-only model and letting it either
    // ignore the image or claim it "can't see" something the app never attempted to show it.
    // The image data still isn't sent in this case (see openAICompatibleProvider's vision
    // guard), but any accompanying text question still goes through normally below.
    const hasAnyVisionProvider = imagesAttached ? hasVisionCapableProvider(settings) : true;
    const hasFormatMatchedVisionProvider = imagesAttached ? hasVisionCapableProvider(settings, imageMimeTypes) : true;
    if (imagesAttached && !hasAnyVisionProvider) {
      appendMessage(id, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "I don't have a vision-capable AI provider connected right now, so I can't analyze the image you attached. If there's a text question alongside it, I can still help with that.",
        createdAt: new Date().toISOString(),
        isSystemNotice: true,
      });
    } else if (imagesAttached && !hasFormatMatchedVisionProvider) {
      // A vision provider IS connected, but none of them support this exact image format
      // (see providerRegistry's supportsImageFormats \u2014 e.g. a WebP upload with only xAI
      // configured, which documents jpg/jpeg + png only). Distinct message from "no vision
      // provider at all" so the student understands the AI can see images in general, just
      // not this one, rather than assuming vision is broken entirely.
      appendMessage(id, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "The image you attached is in a format the connected AI provider doesn't support (it can view other image types, just not this one), so I can't analyze it. If there's a text question alongside it, I can still help with that, or try re-attaching it as a JPEG or PNG.",
        createdAt: new Date().toISOString(),
        isSystemNotice: true,
      });
    }

    setIsThinking(true);
    setIsGenerating(true);

    const assistantId = crypto.randomUUID();
    let started = false;
    const startedAt = Date.now();
    const routingContext: RoutingContext = { userText: content, hasDocumentAttachment: hasAttachmentText(userMessage.attachments), hasImageAttachment: imagesAttached, imageMimeTypes };

    // PHASE 2 — the auto-continue loop (still bounded by MAX_AUTO_CONTINUATIONS, unchanged
    // behavior from Phase 1.7) now lives in generationEngine.ts's runGenerationLoop, shared
    // with Continue/Retry/Edit — see that module's doc comment for why.
    const outcome = await runGenerationLoop({
      baseProviderMessages,
      seedText: '',
      settings,
      routing: routingContext,
      maxPasses: MAX_AUTO_CONTINUATIONS,
      nextController: () => { const c = new AbortController(); abortRef.current = c; return c; },
      onProgress: (fullText) => {
        if (!started) {
          started = true;
          setIsThinking(false);
          appendMessage(id!, { id: assistantId, role: 'assistant', content: fullText, createdAt: new Date().toISOString(), isStreaming: true });
        } else {
          updateMessage(id!, assistantId, fullText, true);
        }
      },
    });
    abortRef.current = null;

    setIsThinking(false);
    setIsGenerating(false);

    if (outcome.finishReason === 'cancelled') {
      // If cancelled before the first chunk ever arrived, no assistant message exists yet —
      // the typing indicator and Stop button both disappear silently, leaving the student
      // unsure whether their tap actually did anything. Surface a brief system notice so
      // stopping mid-"thinking" has the same visible confirmation as stopping mid-stream.
      // A cancelled response is deliberately NOT marked continuable — the app can't honestly
      // tell "cancelled with more to say" apart from "cancelled right at the natural end".
      if (started) updateMessage(id, assistantId, `${outcome.accumulatedText}\n\n*(stopped)*`, false, { finishReason: 'cancelled', continuable: false });
      else appendMessage(id, { id: assistantId, role: 'assistant', content: 'Stopped.', createdAt: new Date().toISOString(), isSystemNotice: true });
      return;
    }

    if (outcome.switchedFrom) {
      appendMessage(id, { id: crypto.randomUUID(), role: 'assistant', content: `Switched to ${outcome.providerName} — the previous provider was unavailable.`, createdAt: new Date().toISOString(), isSystemNotice: true });
    }

    if (outcome.finishReason === 'error' && outcome.error) {
      // A continuation pass can fail after earlier passes already produced good content —
      // that content stays on screen (marked continuable so the student can retry just the
      // rest via Continue) rather than being replaced wholesale by the error.
      if (outcome.accumulatedText.trim()) {
        updateMessage(id, assistantId, outcome.accumulatedText, false, { isError: false, finishReason: 'length', continuable: true, manualContinuations: 0 });
        showToast(`Couldn't finish the rest — ${outcome.error.message}`, 'error');
      } else if (started) {
        updateMessage(id, assistantId, outcome.error.message, false, { isError: true, finishReason: 'error', continuable: false });
      } else {
        appendMessage(id, { id: assistantId, role: 'assistant', content: outcome.error.message, createdAt: new Date().toISOString(), isSystemNotice: true, isError: true });
      }
      return;
    }

    // Still marked 'length'/'unknown' after using up every automatic continuation pass — the
    // answer is genuinely very long, or this provider never told us either way. PHASE 2: no
    // caveat text is baked into `content` anymore (that used to mean re-sending the caveat
    // itself as "the answer" the moment a manual Continue extended it — see PHASE_2_LEDGER.md,
    // "Continue must not duplicate content"). `content` stays exactly the model's own text;
    // ChatMessageBubble renders the caveat/Continue action from `finishReason`/`continuable`.
    const continuable = isContinuableFinishReason(outcome.finishReason);
    const meta = { generationMs: Date.now() - startedAt, modelUsed: settings.model || outcome.providerId, finishReason: outcome.finishReason as GenerationFinishReason, continuable, manualContinuations: 0 };
    if (started) updateMessage(id, assistantId, outcome.accumulatedText, false, meta);
    else appendMessage(id, { id: assistantId, role: 'assistant', content: outcome.accumulatedText, createdAt: new Date().toISOString(), ...meta });
    } finally {
      // Defense in depth: the normal path resets these after the generation loop, but an unexpected throw
      // in between would otherwise leave isGenerating true — and every action early-returns while it is —
      // even though the ref lock itself is released here. Idempotent on the normal path.
      setIsThinking(false);
      setIsGenerating(false);
      generationLockRef.current = false;
    }
  }

  function cancelGeneration() {
    abortRef.current?.abort();
  }

  /** PHASE 2 — real Continue: extends an existing, already-persisted assistant answer in
   *  place. Never creates a visible "continue" user message (see PHASE_2_LEDGER.md), reuses
   *  the ORIGINAL user turn's history/attachments/routing so vision/document capability
   *  requirements can't drift just because the literal continuation instruction carries none
   *  of that context itself (see generationEngine.ts's baseProviderMessages doc comment), and
   *  writes back through the exact same `updateMessage` a normal stream uses — so there is
   *  never more than one authoritative copy of this message's text. */
  async function continueMessage(messageId: string) {
    if (generationLockRef.current || isGenerating || !active || !activeId) return;
    const idx = active.messages.findIndex((m) => m.id === messageId);
    if (idx === -1) return;
    const target = active.messages[idx];
    if (target.role !== 'assistant' || !target.continuable) return;
    const manualSoFar = target.manualContinuations ?? 0;
    if (manualSoFar >= MAX_MANUAL_CONTINUATIONS_PER_ACTION) return;
    if (!canSend()) {
      showToast(`You've reached today's ${limit}-message AI limit.`, 'info');
      return;
    }

    // Everything before this assistant message — ends with the user turn (and, possibly, an
    // interleaved system notice, which buildProviderMessages already filters out) that
    // originally produced it. Deliberately NOT the literal word "Continue": routing derived
    // below comes from that original user turn so an image/PDF question can't lose its
    // capability requirements mid-continuation.
    const historyForBase = active.messages.slice(0, idx);
    const baseProviderMessages = buildProviderMessages(historyForBase, effectiveSettings());
    const estimatedBytes = estimateProviderMessagesBytes(baseProviderMessages);
    if (estimatedBytes > MAX_ESTIMATED_REQUEST_BYTES) {
      showToast('This conversation is too large to continue — try starting a new chat.', 'error');
      return;
    }
    const originUser = [...historyForBase].reverse().find((m) => m.role === 'user');
    const routing: RoutingContext | undefined = originUser
      ? { userText: originUser.content, hasDocumentAttachment: hasAttachmentText(originUser.attachments), hasImageAttachment: hasImageAttachment(originUser.attachments), imageMimeTypes: collectImageMimeTypes(originUser.attachments) }
      : undefined;

    // Honest degradation, not silent guessing: an image attachment can still be LISTED on the
    // original user message (metadata persists) while its actual base64 data is long gone
    // (see useConversations' stripUnpersistableAttachmentData — dataUrl/pageImages are never
    // persisted). If that happened, this continuation genuinely can't see the image anymore —
    // say so, rather than quietly continuing as text-only and letting the student assume the
    // model still has visual context it no longer does. PHASE 2.1: the same honest check now
    // also covers a scanned PDF whose rasterized pages expired, using the small persisted
    // `hadRasterizedPages` flag (see attachmentTypes.ts) that survives even after `pageImages`
    // itself is stripped — previously this case was left undetectable and undocumented.
    const expiredNotice = expiredAttachmentNotice(originUser?.attachments);
    if (expiredNotice) showToast(expiredNotice, 'info');

    generationLockRef.current = true;
    try {
    recordMessage();
    pinnedToBottomRef.current = true;
    setIsPinnedToBottom(true);
    setIsGenerating(true);
    updateMessage(activeId, messageId, target.content, true); // mark streaming immediately

    const outcome = await runGenerationLoop({
      baseProviderMessages,
      seedText: target.content,
      settings,
      routing,
      maxPasses: MAX_AUTO_CONTINUATIONS,
      nextController: () => { const c = new AbortController(); abortRef.current = c; return c; },
      onProgress: (fullText) => updateMessage(activeId, messageId, fullText, true),
    });
    abortRef.current = null;
    setIsGenerating(false);

    if (outcome.finishReason === 'cancelled') {
      // PHASE 2.1 — a cancelled/failed continuation attempt no longer counts against
      // MAX_MANUAL_CONTINUATIONS_PER_ACTION: the credit for this click is already spent (see
      // recordMessage() above), but "the click didn't actually produce more text" shouldn't
      // also cost the student one of their remaining manual-continue attempts on this message.
      // `continuable` still goes false here regardless — a cancelled response is a new terminal
      // state for THIS attempt, same rule as every other action's cancellation handling.
      updateMessage(activeId, messageId, `${outcome.accumulatedText}\n\n*(stopped)*`, false, { finishReason: 'cancelled', continuable: false, manualContinuations: manualSoFar });
      return;
    }
    if (outcome.switchedFrom) {
      appendMessage(activeId, { id: crypto.randomUUID(), role: 'assistant', content: `Switched to ${outcome.providerName} — the previous provider was unavailable.`, createdAt: new Date().toISOString(), isSystemNotice: true });
    }
    if (outcome.finishReason === 'error' && outcome.error) {
      // Keep whatever text existed before this attempt (outcome.accumulatedText starts from
      // the same seed, so it's never less than what was already on screen) — never let a
      // failed continuation attempt erase an already-good truncated answer. PHASE 2.1: a
      // provider failure likewise doesn't consume a manual-continue attempt — see the
      // cancellation branch above for the same reasoning.
      updateMessage(activeId, messageId, outcome.accumulatedText, false, {
        finishReason: target.finishReason,
        continuable: manualSoFar < MAX_MANUAL_CONTINUATIONS_PER_ACTION,
        manualContinuations: manualSoFar,
      });
      showToast(`Couldn't continue — ${outcome.error.message}`, 'error');
      return;
    }

    // Only a genuinely successful continuation pass counts against the manual cap.
    const manualContinuations = manualSoFar + 1;
    const continuable = isContinuableFinishReason(outcome.finishReason) && manualContinuations < MAX_MANUAL_CONTINUATIONS_PER_ACTION;
    updateMessage(activeId, messageId, outcome.accumulatedText, false, {
      modelUsed: settings.model || outcome.providerId,
      finishReason: outcome.finishReason as GenerationFinishReason,
      continuable,
      manualContinuations,
    });
    } finally {
      // Defense in depth: the normal path resets these after the generation loop, but an unexpected throw
      // in between would otherwise leave isGenerating true — and every action early-returns while it is —
      // even though the ref lock itself is released here. Idempotent on the normal path.
      setIsThinking(false);
      setIsGenerating(false);
      generationLockRef.current = false;
    }
  }

  /** PHASE 2.1 — targets the same message findLastRetryableAssistantIndex would pick (the most
   *  recent real answer, skipping past trailing pure-info system notices like "Switched to
   *  ..."), not necessarily the literal last array element — see that function's own doc
   *  comment for why the old "must be the literal last message" rule was a real bug. */
  async function retryLast() {
    if (generationLockRef.current || isGenerating || !active || !activeId) return;
    const targetIdx = findLastRetryableAssistantIndex(active.messages);
    if (targetIdx === -1) return;
    const target = active.messages[targetIdx];
    pinnedToBottomRef.current = true;
    setIsPinnedToBottom(true);
    if (!canSend()) {
      showToast(`You've reached today's ${limit}-message AI limit.`, 'info');
      return;
    }
    generationLockRef.current = true;
    try {
    recordMessage();
    // Removes the retried answer AND any trailing notice describing that specific attempt
    // (e.g. a stale "Switched to ..." about the very answer being replaced) — `history` is
    // exactly the conversation state the new attempt should be built from.
    const history = deleteMessagesFrom(activeId, target.id);
    if (!history) return;
    setIsGenerating(true);
    setIsThinking(true);
    const providerMessages = buildProviderMessages(history, effectiveSettings());
    const assistantId = crypto.randomUUID();
    let started = false;
    const retryStartedAt = Date.now();
    const lastUserMessage = [...history].reverse().find((m) => m.role === 'user');
    // PHASE 8 — same honest reload-expiry check `continueMessage` already had (see
    // `expiredAttachmentNotice`'s doc comment): without this, retrying a question that
    // originally included an image/scanned document after a page reload silently rebuilt a
    // text-only request with no indication anything was dropped.
    const retryExpiredNotice = expiredAttachmentNotice(lastUserMessage?.attachments);
    if (retryExpiredNotice) showToast(retryExpiredNotice, 'info');
    // Regenerate should actually read differently, not just re-run the exact same
    // request and hope the provider's own sampling varies it. Nudging temperature up
    // for this one retry (never persisted to settings/localStorage, clamped to a safe
    // ceiling) is a nudge toward a different phrasing, not a guarantee — some providers
    // reinterpret or ignore temperature entirely, so regeneration itself (a genuinely fresh
    // request/response cycle) remains the actual mechanism Retry relies on.
    const retrySettings = { ...settings, temperature: Math.min(1.5, settings.temperature + 0.3) };
    const routing: RoutingContext | undefined = lastUserMessage
      ? { userText: lastUserMessage.content, hasDocumentAttachment: hasAttachmentText(lastUserMessage.attachments), hasImageAttachment: hasImageAttachment(lastUserMessage.attachments), imageMimeTypes: collectImageMimeTypes(lastUserMessage.attachments) }
      : undefined;

    const outcome = await runGenerationLoop({
      baseProviderMessages: providerMessages,
      seedText: '',
      settings: retrySettings,
      routing,
      maxPasses: MAX_AUTO_CONTINUATIONS,
      nextController: () => { const c = new AbortController(); abortRef.current = c; return c; },
      onProgress: (fullText) => {
        if (!started) { started = true; setIsThinking(false); appendMessage(activeId, { id: assistantId, role: 'assistant', content: fullText, createdAt: new Date().toISOString(), isStreaming: true }); }
        else updateMessage(activeId, assistantId, fullText, true);
      },
    });
    abortRef.current = null;
    setIsThinking(false);
    setIsGenerating(false);
    if (outcome.switchedFrom) {
      appendMessage(activeId, { id: crypto.randomUUID(), role: 'assistant', content: `Switched to ${outcome.providerName} — the previous provider was unavailable.`, createdAt: new Date().toISOString(), isSystemNotice: true });
    }
    if (outcome.finishReason === 'cancelled') {
      if (started) updateMessage(activeId, assistantId, `${outcome.accumulatedText}\n\n*(stopped)*`, false, { finishReason: 'cancelled', continuable: false });
      else appendMessage(activeId, { id: assistantId, role: 'assistant', content: 'Stopped.', createdAt: new Date().toISOString(), isSystemNotice: true });
      return;
    }
    if (outcome.finishReason === 'error' && outcome.error) {
      if (started) updateMessage(activeId, assistantId, outcome.error.message, false, { isError: true, finishReason: 'error', continuable: false });
      else appendMessage(activeId, { id: assistantId, role: 'assistant', content: outcome.error.message, createdAt: new Date().toISOString(), isSystemNotice: true, isError: true });
      return;
    }
    const continuable = isContinuableFinishReason(outcome.finishReason);
    const meta = { generationMs: Date.now() - retryStartedAt, modelUsed: settings.model || outcome.providerId, finishReason: outcome.finishReason as GenerationFinishReason, continuable, manualContinuations: 0 };
    if (started) updateMessage(activeId, assistantId, outcome.accumulatedText, false, meta);
    else appendMessage(activeId, { id: assistantId, role: 'assistant', content: outcome.accumulatedText, createdAt: new Date().toISOString(), ...meta });
    } finally {
      // Defense in depth: the normal path resets these after the generation loop, but an unexpected throw
      // in between would otherwise leave isGenerating true — and every action early-returns while it is —
      // even though the ref lock itself is released here. Idempotent on the normal path.
      setIsThinking(false);
      setIsGenerating(false);
      generationLockRef.current = false;
    }
  }

  /** PHASE 2 — real Edit semantics: updates the edited user message's text, discards every
   *  message that came after it, and regenerates a fresh assistant answer from that point,
   *  through the same shared generation loop as every other action. Attachments on the edited
   *  message are untouched (only `content` changes).
   *
   *  PHASE 2.1 — fixed a real data-integrity bug: this used to call `editMessageAndTruncate()`
   *  (which destructively discards downstream messages and revokes their blob URLs) BEFORE
   *  running the request-size check, so an edit that was correctly rejected as too large could
   *  still permanently destroy conversation history for nothing — the truncation had already
   *  happened by the time the rejection fired. Every validation now runs against a candidate
   *  history built from the WOULD-BE edit (`candidateHistory` below) without touching `active`/
   *  localStorage at all; the destructive truncation is only actually committed once every
   *  check has passed. A failure/cancellation that happens AFTER that point (i.e. a real
   *  generation attempt genuinely started) is deliberately NOT rolled back — it behaves exactly
   *  like every other action's failure in this app (the committed edit stays, an honest
   *  error/partial state is shown, Retry remains available afterward), rather than surprising
   *  the student by silently reverting an edit they explicitly saved because of an unrelated
   *  network hiccup. */
  async function editAndRegenerate(messageId: string, content: string) {
    if (generationLockRef.current || isGenerating || !active || !activeId) return;
    if (!canSend()) {
      showToast(`You've reached today's ${limit}-message AI limit.`, 'info');
      return;
    }
    const idx = active.messages.findIndex((m) => m.id === messageId);
    if (idx === -1 || active.messages[idx].role !== 'user') return;
    const editedMessage: ChatMessage = { ...active.messages[idx], content };
    const candidateHistory = [...active.messages.slice(0, idx), editedMessage];

    const baseProviderMessages = buildProviderMessages(candidateHistory, effectiveSettings());
    const estimatedBytes = estimateProviderMessagesBytes(baseProviderMessages);
    if (estimatedBytes > MAX_ESTIMATED_REQUEST_BYTES) {
      showToast('This edited conversation is too large to send — try removing an attachment.', 'error');
      return; // nothing committed: active.messages is untouched, no credit consumed
    }

    const imagesAttached = hasImageAttachment(editedMessage.attachments);
    const imageMimeTypes = collectImageMimeTypes(editedMessage.attachments);
    const routing: RoutingContext = { userText: content, hasDocumentAttachment: hasAttachmentText(editedMessage.attachments), hasImageAttachment: imagesAttached, imageMimeTypes };

    generationLockRef.current = true;
    try {
    // Only now — after every pre-flight check has passed — is the destructive truncation
    // actually committed.
    const truncated = editMessageAndTruncate(activeId, messageId, content);
    if (!truncated) return;

    recordMessage();
    pinnedToBottomRef.current = true;
    setIsPinnedToBottom(true);
    setIsThinking(true);
    setIsGenerating(true);

    const hasAnyVisionProvider = imagesAttached ? hasVisionCapableProvider(settings) : true;
    const hasFormatMatchedVisionProvider = imagesAttached ? hasVisionCapableProvider(settings, imageMimeTypes) : true;
    if (imagesAttached && !hasAnyVisionProvider) {
      appendMessage(activeId, { id: crypto.randomUUID(), role: 'assistant', content: "I don't have a vision-capable AI provider connected right now, so I can't analyze the image in this edited message.", createdAt: new Date().toISOString(), isSystemNotice: true });
    } else if (imagesAttached && !hasFormatMatchedVisionProvider) {
      appendMessage(activeId, { id: crypto.randomUUID(), role: 'assistant', content: "The image in this edited message is in a format the connected AI provider doesn't support.", createdAt: new Date().toISOString(), isSystemNotice: true });
    } else {
      // PHASE 8 — an edited message keeps the ORIGINAL attachments (only `content` changes,
      // see this function's own doc comment), so if the image/scanned-document data behind
      // them expired since a page reload, `imagesAttached` above is already false and neither
      // branch above fires — this is the case that previously fell through silently.
      const editExpiredNotice = expiredAttachmentNotice(editedMessage.attachments);
      if (editExpiredNotice) showToast(editExpiredNotice, 'info');
    }

    const assistantId = crypto.randomUUID();
    let started = false;
    const startedAt = Date.now();
    const outcome = await runGenerationLoop({
      baseProviderMessages,
      seedText: '',
      settings,
      routing,
      maxPasses: MAX_AUTO_CONTINUATIONS,
      nextController: () => { const c = new AbortController(); abortRef.current = c; return c; },
      onProgress: (fullText) => {
        if (!started) { started = true; setIsThinking(false); appendMessage(activeId, { id: assistantId, role: 'assistant', content: fullText, createdAt: new Date().toISOString(), isStreaming: true }); }
        else updateMessage(activeId, assistantId, fullText, true);
      },
    });
    abortRef.current = null;
    setIsThinking(false);
    setIsGenerating(false);

    if (outcome.switchedFrom) {
      appendMessage(activeId, { id: crypto.randomUUID(), role: 'assistant', content: `Switched to ${outcome.providerName} — the previous provider was unavailable.`, createdAt: new Date().toISOString(), isSystemNotice: true });
    }
    if (outcome.finishReason === 'cancelled') {
      if (started) updateMessage(activeId, assistantId, `${outcome.accumulatedText}\n\n*(stopped)*`, false, { finishReason: 'cancelled', continuable: false });
      else appendMessage(activeId, { id: assistantId, role: 'assistant', content: 'Stopped.', createdAt: new Date().toISOString(), isSystemNotice: true });
      return;
    }
    if (outcome.finishReason === 'error' && outcome.error) {
      if (started) updateMessage(activeId, assistantId, outcome.error.message, false, { isError: true, finishReason: 'error', continuable: false });
      else appendMessage(activeId, { id: assistantId, role: 'assistant', content: outcome.error.message, createdAt: new Date().toISOString(), isSystemNotice: true, isError: true });
      return;
    }
    const continuable = isContinuableFinishReason(outcome.finishReason);
    const meta = { generationMs: Date.now() - startedAt, modelUsed: settings.model || outcome.providerId, finishReason: outcome.finishReason as GenerationFinishReason, continuable, manualContinuations: 0 };
    if (started) updateMessage(activeId, assistantId, outcome.accumulatedText, false, meta);
    else appendMessage(activeId, { id: assistantId, role: 'assistant', content: outcome.accumulatedText, createdAt: new Date().toISOString(), ...meta });
    } finally {
      // Defense in depth: the normal path resets these after the generation loop, but an unexpected throw
      // in between would otherwise leave isGenerating true — and every action early-returns while it is —
      // even though the ref lock itself is released here. Idempotent on the normal path.
      setIsThinking(false);
      setIsGenerating(false);
      generationLockRef.current = false;
    }
  }

  function applyPromptTemplate(template: PromptTemplate) {
    setInput(template.template);
    setShowLibrary(false);
  }

  async function exportChat(format: 'md' | 'json' | 'txt' | 'pdf' = 'md') {
    if (!active) return;
    const name = active.title.slice(0, 40) || 'conversation';
    if (format === 'json') {
      // `active` carries `attachments[].previewUrl` as a live `blob:` object URL — valid only
      // in this tab, for as long as the underlying Blob is held in memory. Serializing it
      // verbatim (as this used to do, despite the comment below claiming otherwise) writes a
      // dead reference into the export: re-importing it later, in this session or any other,
      // passes `sanitizeAttachments`'s id/name check and gets stored as if it were real, so the
      // thumbnail permanently renders broken (`ChatMessageBubble`'s `blob:`-prefix guard still
      // lets it through, since a stale blob: URL is still a string starting with "blob:"). Strip
      // it here so an imported attachment falls back to its non-preview "download" treatment
      // instead of an unrecoverable broken-image state.
      const exportable = {
        ...active,
        messages: active.messages.map((m) => ({
          ...m,
          attachments: m.attachments?.map(({ previewUrl: _previewUrl, ...rest }) => rest),
        })),
      };
      downloadBlob(new Blob([JSON.stringify(exportable, null, 2)], { type: 'application/json' }), `${name}.json`);
      return;
    }
    const realMessages = active.messages.filter((m) => !m.isSystemNotice);
    if (format === 'txt') {
      const text = realMessages.map((m) => `${m.role === 'user' ? 'You' : 'Assistant'}: ${m.content}`).join('\n\n');
      downloadBlob(new Blob([text], { type: 'text/plain' }), `${name}.txt`);
      return;
    }
    if (format === 'pdf') {
      try {
        const bytes = await buildPdfTextDocument({
          title: active.title || 'Conversation',
          subtitle: 'Exported from ALLROUNDER HELPER · AI Study Assistant',
          sections: realMessages.map((m) => ({ heading: m.role === 'user' ? 'You' : 'Assistant', body: m.content })),
        });
        downloadBlob(new Blob([bytes as BlobPart], { type: 'application/pdf' }), `${name}.pdf`);
      } catch {
        showToast('Could not generate the PDF', 'error');
      }
      return;
    }
    const md = realMessages.map((m) => `### ${m.role === 'user' ? 'You' : 'Assistant'}\n\n${m.content}`).join('\n\n---\n\n');
    downloadBlob(new Blob([`# ${active.title}\n\n${md}`], { type: 'text/markdown' }), `${name}.md`);
  }

  // "Export chat" produces at most a few MB even for a very long conversation (it's plain
  // text/JSON, no embedded images — attachment previewUrls are session-local blob: URLs and
  // are never serialized into the export). A file far outside that range is not a real export
  // — most likely the wrong file picked by mistake — and reading it fully into memory via
  // FileReader + JSON.parse before finding that out can freeze the tab for tens of seconds
  // on a large enough file. Reject before reading rather than after.
  const MAX_IMPORT_FILE_SIZE = 20 * 1024 * 1024; // 20MB

  function importChat(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    if (file.size > MAX_IMPORT_FILE_SIZE) {
      showToast('That file is too large to be an exported conversation', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        const id = importConversation(parsed);
        if (id) showToast('Conversation imported');
        else showToast('This file is not a valid exported conversation', 'error');
      } catch {
        showToast('Could not read this file', 'error');
      }
    };
    reader.readAsText(file);
  }

  const crumbs = [{ label: 'AI Study Assistant' }];

  return (
    <div className="noise-bg min-h-[70vh]">
      <AiOnboardingDialog />
      <ConfirmDialog
        open={confirmAction !== null}
        title={confirmAction?.type === 'clearAll' ? 'Clear all chats?' : 'Delete permanently?'}
        description={
          confirmAction?.type === 'clearAll'
            ? 'Every conversation will be moved to Trash. You can restore them individually from there, or they\u2019ll be gone for good once removed from Trash.'
            : 'This conversation will be permanently deleted. This can\u2019t be undone.'
        }
        confirmLabel={confirmAction?.type === 'clearAll' ? 'Clear all' : 'Delete permanently'}
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => {
          if (confirmAction?.type === 'clearAll') clearAllConversations();
          else if (confirmAction?.type === 'permanentDelete') permanentlyDelete(confirmAction.id);
          setConfirmAction(null);
        }}
      />
      <Seo
        title="AI Study Assistant"
        description="A smart study assistant for homework help, study plans, quiz generation, and more — chat interface ready, provider-agnostic architecture underneath."
        path="/ai-assistant"
        jsonLd={breadcrumbJsonLd(crumbs, SITE_URL)}
      />
      {/* Breadcrumbs kept for SEO/structure but pushed down out of the mobile fold — a
          returning user opening the AI chat doesn't need "Home / AI Study Assistant" eating
          the top of a 375px screen every time. Desktop keeps its original spacing. */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-2 sm:pt-8">
        <Breadcrumbs items={crumbs} className="hidden sm:flex" />
      </div>

      <header className="mx-auto max-w-7xl px-4 sm:px-6 pt-2 pb-2 sm:pt-6 sm:pb-4 flex items-center justify-between gap-2 sm:gap-3">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <button ref={sidebarToggleRef} onClick={() => setShowSidebar((v) => !v)} aria-label="Toggle conversations" className="lg:hidden flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-navy-200 dark:border-white/10">
            {showSidebar ? <X size={16} /> : <Menu size={16} />}
          </button>
          <AiFlameAvatar active={isGenerating || isThinking} energetic={!isThinking} idleSrc={aiAvatar} size={36} className="shrink-0 sm:hidden" />
          <AiFlameAvatar active={isGenerating || isThinking} energetic={!isThinking} idleSrc={aiAvatar} size={40} className="shrink-0 hidden sm:flex" />
          <div className="min-w-0">
            <h1 className="text-base sm:text-2xl font-semibold leading-tight truncate">AI Study Assistant</h1>
            {/* Full status line (provider connection + limit bar) is desktop-only real estate;
                mobile gets just the one number that actually matters in the moment. */}
            {providerReady ? (
              <>
                <p className="hidden sm:block text-xs text-navy-500 dark:text-ink-500">
                  Default provider: {getActiveProvider(settings).name}
                  {' · '}
                  <span className={limitReached ? 'text-amber-500 font-medium' : ''}>{remaining} of {limit} messages left today</span>
                </p>
                <div className="hidden sm:flex mt-1.5 items-center gap-2">
                  <div className="h-1.5 w-24 rounded-full bg-navy-100 dark:bg-white/10 overflow-hidden" role="progressbar" aria-valuenow={usedToday} aria-valuemin={0} aria-valuemax={limit} aria-label="Today's free chats used">
                    <div className="h-full rounded-full gradient-brand transition-all" style={{ width: `${Math.min(100, (usedToday / limit) * 100)}%` }} />
                  </div>
                  <span className="text-[11px] text-navy-400 dark:text-ink-500">{usedToday} of {limit} used</span>
                </div>
                <p className={clsx('sm:hidden text-[11px]', limitReached ? 'text-amber-500 font-medium' : 'text-navy-400 dark:text-ink-500')}>
                  {remaining} of {limit} chats left today
                </p>
              </>
            ) : (
              // No provider: the daily quota is meaningless (nothing can be sent), so don't show it
              // next to the unavailable notice - that pairing read as a contradiction.
              <p className="text-[11px] sm:text-xs text-amber-600 dark:text-amber-400" role="status">
                {PROVIDER_UNAVAILABLE_MESSAGE}
              </p>
            )}
          </div>
        </div>

        {/* Desktop: every control visible, unchanged. Mobile: just Search + a single "More"
            menu holding Status/Prompts/Export/Import/Settings/mode — six buttons that used to
            wrap across two or three rows above the chat now collapse to one. */}
        <div className="hidden sm:flex flex-wrap items-center gap-1.5 sm:gap-2">
          <select
            value={chatModeId}
            onChange={(e) => setChatModeId(e.target.value)}
            aria-label="Chat mode"
            className="hidden sm:block shrink-0 rounded-lg border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-2.5 py-1.5 text-xs outline-none focus:border-electric-500"
          >
            {CHAT_MODES.map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
          <Button size="sm" variant="outline" className="shrink-0" aria-label="Search conversations" icon={<Search size={14} />} onClick={() => setShowSearch((v) => !v)}><span className="hidden sm:inline">Search</span></Button>
          <Button size="sm" variant="outline" className="shrink-0" aria-label="Provider status" icon={<Activity size={14} />} onClick={() => setShowStatus((v) => !v)}><span className="hidden sm:inline">Status</span></Button>
          <Button size="sm" variant="outline" className="shrink-0" aria-label="Prompt library" icon={<BookOpen size={14} />} onClick={() => setShowLibrary((v) => !v)}><span className="hidden sm:inline">Prompts</span></Button>
          <select onChange={(e) => { void exportChat(e.target.value as 'md' | 'json' | 'txt' | 'pdf'); e.target.value = ''; }} defaultValue="" aria-label="Export chat" disabled={!active || active.messages.length === 0} className="shrink-0 w-[6.5rem] text-xs rounded-lg border border-navy-200 dark:border-white/10 bg-transparent px-2 py-1.5 disabled:opacity-40">
            <option value="" disabled>Export...</option>
            <option value="md">Markdown</option>
            <option value="pdf">PDF</option>
            <option value="json">JSON</option>
            <option value="txt">Text</option>
          </select>
          <Button size="sm" variant="outline" className="shrink-0" aria-label="Import chat" icon={<Upload size={14} />} onClick={() => importInputRef.current?.click()}><span className="hidden sm:inline">Import</span></Button>
          <Link to="/ai-assistant/settings" className="shrink-0">
            <Button size="sm" variant="ghost" aria-label="AI settings" icon={<Settings size={14} />}><span className="hidden sm:inline">Settings</span></Button>
          </Link>
        </div>

        <input ref={importInputRef} type="file" accept="application/json" tabIndex={-1} className="sr-only" onChange={(e) => { importChat(e.target.files); e.target.value = ''; }} />

        {/* Mobile-only compact controls */}
        <div className="flex sm:hidden items-center gap-1.5 shrink-0">
          <button onClick={() => setShowSearch((v) => !v)} aria-label="Search conversations" className="flex h-9 w-9 items-center justify-center rounded-full border border-navy-200 dark:border-white/10">
            <Search size={15} />
          </button>
          <div className="relative">
            <button onClick={() => setShowMobileMenu((v) => !v)} aria-label="More options" aria-expanded={showMobileMenu} className="flex h-9 w-9 items-center justify-center rounded-full border border-navy-200 dark:border-white/10">
              <Menu size={15} />
            </button>
            {showMobileMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMobileMenu(false)} />
                <div className="absolute right-0 top-11 z-50 w-52 rounded-xl border border-navy-100 dark:border-white/10 bg-white dark:bg-navy-900 shadow-xl p-1.5 flex flex-col gap-0.5">
                  <label className="px-2.5 pt-1.5 pb-1 text-[10px] font-semibold uppercase tracking-wide text-navy-400 dark:text-ink-500">Chat mode</label>
                  <select
                    value={chatModeId}
                    onChange={(e) => setChatModeId(e.target.value)}
                    aria-label="Chat mode"
                    className="mx-1.5 mb-1 rounded-lg border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-2 py-1.5 text-xs outline-none"
                  >
                    {CHAT_MODES.map((m) => (
                      <option key={m.id} value={m.id}>{m.label}</option>
                    ))}
                  </select>
                  <button onClick={() => { setShowStatus((v) => !v); setShowMobileMenu(false); }} className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-navy-700 dark:text-ink-200 hover:bg-navy-50 dark:hover:bg-white/5"><Activity size={14} /> Provider status</button>
                  <button onClick={() => { setShowLibrary(true); setShowMobileMenu(false); }} className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-navy-700 dark:text-ink-200 hover:bg-navy-50 dark:hover:bg-white/5"><BookOpen size={14} /> Prompt library</button>
                  <button disabled={!active || active.messages.length === 0} onClick={() => { void exportChat('md'); setShowMobileMenu(false); }} className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-navy-700 dark:text-ink-200 hover:bg-navy-50 dark:hover:bg-white/5 disabled:opacity-40"><Download size={14} /> Export chat (.md)</button>
                  <button onClick={() => { importInputRef.current?.click(); setShowMobileMenu(false); }} className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-navy-700 dark:text-ink-200 hover:bg-navy-50 dark:hover:bg-white/5"><Upload size={14} /> Import chat</button>
                  <Link to="/ai-assistant/settings" onClick={() => setShowMobileMenu(false)} className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-navy-700 dark:text-ink-200 hover:bg-navy-50 dark:hover:bg-white/5"><Settings size={14} /> AI settings</Link>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 pb-4 sm:pb-10">
        <div className="grid lg:grid-cols-[260px_1fr] gap-4 h-[calc(100dvh-11.5rem)] min-h-[420px] sm:h-[70dvh] sm:min-h-[520px]">
          <Card className="hidden lg:block p-4">
            <ChatSidebar
              conversations={conversations}
              activeId={activeId}
              search={search}
              onSearchChange={setSearch}
              folderFilter={folderFilter}
              onFolderFilterChange={setFolderFilter}
              onSelect={(id) => { setActiveId(id); setShowSidebar(false); }}
              onCreate={() => { createConversation(); setShowSidebar(false); }}
              onRename={renameConversation}
              onDelete={deleteConversation}
              onTogglePin={togglePin}
              onToggleArchive={toggleArchive}
              onRestore={restoreConversation}
              onPermanentDelete={(id) => setConfirmAction({ type: 'permanentDelete', id })}
              onDuplicate={duplicateConversation}
              onClearAll={() => setConfirmAction({ type: 'clearAll' })}
            />
          </Card>

          {/* Mobile overlay drawer — always mounted (below lg) so open/close both animate;
              visibility is purely via opacity/transform, not conditional rendering. */}
          <div className={`lg:hidden fixed inset-0 z-50 transition-opacity duration-300 ${showSidebar ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} role="dialog" aria-modal="true" aria-label="Conversations">
            <div className="absolute inset-0 bg-navy-950/50 backdrop-blur-sm" onClick={() => setShowSidebar(false)} />
            <div
              ref={sidebarPanelRef}
              className={`absolute left-0 top-0 bottom-0 w-[85vw] max-w-sm bg-white dark:bg-navy-900 shadow-2xl flex flex-col transition-transform duration-300 ease-out ${showSidebar ? 'translate-x-0' : '-translate-x-full'}`}
              style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            >
              <div className="flex items-center justify-between px-4 pt-4 shrink-0">
                <span className="text-sm font-semibold text-navy-900 dark:text-ink-100">Conversations</span>
                <button onClick={() => setShowSidebar(false)} aria-label="Close conversations" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-navy-100 dark:hover:bg-white/5">
                  <X size={16} />
                </button>
              </div>
              <div className="flex-1 min-h-0 p-4">
                <ChatSidebar
                  conversations={conversations}
                  activeId={activeId}
                  search={search}
                  onSearchChange={setSearch}
                  folderFilter={folderFilter}
                  onFolderFilterChange={setFolderFilter}
                  onSelect={(id) => { setActiveId(id); setShowSidebar(false); }}
                  onCreate={() => { createConversation(); setShowSidebar(false); }}
                  onRename={renameConversation}
                  onDelete={deleteConversation}
                  onTogglePin={togglePin}
                  onToggleArchive={toggleArchive}
                  onRestore={restoreConversation}
                  onPermanentDelete={(id) => setConfirmAction({ type: 'permanentDelete', id })}
                  onDuplicate={duplicateConversation}
                  onClearAll={() => setConfirmAction({ type: 'clearAll' })}
                />
              </div>
            </div>
          </div>

          <Card className="flex flex-col p-0 overflow-hidden">
            {showSearch && (
              <ChatSearchBar
                conversation={active}
                onClose={() => setShowSearch(false)}
                onJump={(id) => {
                  const el = document.getElementById(`ai-msg-${id}`);
                  el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  el?.classList.add('ring-2', 'ring-electric-500');
                  setTimeout(() => el?.classList.remove('ring-2', 'ring-electric-500'), 1200);
                }}
              />
            )}
            {showStatus && <div className="p-4 border-b border-navy-100 dark:border-white/10"><AiStatusPanel settings={settings} conversation={active} /></div>}
            {showLibrary ? (
              <div className="flex-1 overflow-y-auto p-5">
                <PromptLibraryPanel onUse={applyPromptTemplate} />
              </div>
            ) : (
              // relative wrapper scoped to just the scroll region, so the "jump to latest"
              // button sits pinned above the composer instead of floating over the whole Card
              // (which includes the search bar / status panel / composer above and below it).
              <div className="relative flex-1 min-h-0">
                {/* Announced once per completed reply (not per streamed chunk, which would spam
                    screen readers dozens of times per response) — see TypingIndicator for the
                    separate "request in flight" announcement while generating. */}
                <div className="sr-only" aria-live="polite" aria-atomic="true">
                  {!isGenerating && !isThinking && active && active.messages.length > 0 && active.messages[active.messages.length - 1].role === 'assistant'
                    ? 'Assistant replied'
                    : ''}
                </div>
                <div ref={scrollRef} onScroll={handleScroll} className="h-full overflow-y-auto p-5 space-y-4">
                {!active || active.messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center">
                    <div className="text-center mb-1">
                      <h2 className="text-2xl font-display font-medium text-navy-900 dark:text-ink-100 flex items-center justify-center gap-2">
                        {greeting.text}
                        <span aria-hidden="true">{greeting.emoji}</span>
                      </h2>
                    </div>
                    <div className="flex flex-col items-center justify-center text-center py-8 px-6">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-brand p-1.5 mb-4">
                        <img src={aiAvatar} alt="ALLROUNDER HELPER AI" className="h-full w-full object-contain" />
                      </div>
                      <h3 className="font-semibold text-navy-800 dark:text-ink-100">{greetingSubtext}</h3>
                      <p className="text-sm text-navy-500 dark:text-ink-500 mt-1 max-w-xs">Tell me what's getting in your way — I'll help you figure out the next step and point you to the right ALLROUNDER HELPER tool.</p>
                    </div>
                    <div className="mt-2 flex flex-wrap justify-center gap-2 max-w-xl px-4">
                      {PROBLEM_STARTERS.map((prompt) => (
                        <button
                          key={prompt}
                          onClick={() => send(prompt)}
                          className="rounded-full border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-3.5 py-2 text-xs font-medium text-navy-700 dark:text-ink-300 hover:border-electric-500 hover:text-electric-600 dark:hover:text-electric-400 transition-colors"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setShowLibrary(true)}
                      className="mt-3 text-xs font-medium text-navy-400 dark:text-ink-500 hover:text-electric-600 dark:hover:text-electric-400 transition-colors underline underline-offset-2"
                    >
                      Or browse the subject-help prompt library
                    </button>
                  </div>
                ) : (
                  // PHASE 2.1 — Retry/Continue target the most recent REAL answer, skipping past
                  // trailing pure-info system notices (e.g. "Switched to ...") — see
                  // findLastRetryableAssistantIndex's own doc comment. Computed once per render
                  // rather than per-message so every row in the map below agrees on the same index.
                  (() => {
                    const retryTargetIdx = findLastRetryableAssistantIndex(active.messages);
                    return active.messages.map((m, idx) => (
                    <motion.div
                      key={m.id}
                      id={`ai-msg-${m.id}`}
                      className="rounded-xl transition-shadow"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                    >
                      <ChatMessageBubble
                        message={m}
                        canRegenerate={idx === retryTargetIdx && getActiveProvider(settings).isConfigured(settings) && !isGenerating}
                        isGenerating={isGenerating}
                        onEdit={m.role === 'user' ? (content) => editAndRegenerate(m.id, content) : undefined}
                        onDelete={() => deleteMessage(activeId!, m.id)}
                        onRetry={idx === retryTargetIdx ? retryLast : undefined}
                        onContinue={idx === retryTargetIdx && m.continuable ? () => continueMessage(m.id) : undefined}
                        onQuote={(content) => setInput((prev) => `${prev}\n> ${content.split('\n')[0]}\n`)}
                        onTogglePin={() => togglePinMessage(activeId!, m.id)}
                      />
                      {m.role === 'assistant' && !m.isSystemNotice && !m.isStreaming && isRecommendationQuery(precedingUserText(active.messages, idx)) && (
                        <AffiliateRecommendationCard />
                      )}
                      {m.role === 'assistant' && !m.isSystemNotice && !m.isStreaming && !m.isError && !isGenerating && idx === active.messages.length - 1 && (
                        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, ease: 'easeOut' }}>
                          <FollowUpChips
                            suggestions={getFollowUpSuggestions(chatModeId, m.content)}
                            onSelect={(text) => send(text)}
                          />
                        </motion.div>
                      )}
                    </motion.div>
                  ));
                  })()
                )}
                {/* AnimatePresence here so the indicator fades out when the reply starts
                 *  streaming in, instead of the previous hard cut — this happens on every
                 *  single AI turn, so it's the highest-frequency state change in the app. */}
                <AnimatePresence>
                  {isThinking && (
                    <motion.div
                      key="typing-indicator"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                    >
                      <TypingIndicator providerName={getActiveProvider(settings).isConfigured(settings) ? getActiveProvider(settings).name : undefined} />
                    </motion.div>
                  )}
                </AnimatePresence>
                </div>
                {!isPinnedToBottom && active && active.messages.length > 0 && (
                  <button
                    onClick={jumpToLatest}
                    aria-label={isGenerating ? 'Jump to latest message — response still generating' : 'Jump to latest message'}
                    className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-800 px-3.5 py-1.5 text-xs font-medium text-navy-700 dark:text-ink-200 shadow-lg hover:border-electric-500 hover:text-electric-600 dark:hover:text-electric-400 transition-colors"
                  >
                    <ArrowDown size={13} />
                    {isGenerating ? 'New message' : 'Jump to latest'}
                    {isGenerating && <span className="h-1.5 w-1.5 rounded-full bg-electric-500 animate-pulse" aria-hidden="true" />}
                  </button>
                )}
              </div>
            )}

            {limitReached ? (
              <div className="border-t border-navy-100 dark:border-white/10">
                <DailyLimitReached limit={limit} />
              </div>
            ) : (
            <div className="border-t border-navy-100 dark:border-white/10 px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <AttachmentBar attachments={pendingAttachments} onChange={setPendingAttachments} />
              {!input.trim() && hasAttachmentText(pendingAttachments) && (
                <DocumentQuickActions onSelect={(text) => { setInput(text); textareaRef.current?.focus(); }} />
              )}
              <div className="flex items-end gap-2">
                <textarea
                  ref={textareaRef}
                  id="ai-chat-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (isGenerating) return;
                    if ((e.key === 'Enter' && !e.shiftKey) || (e.key === 'Enter' && e.ctrlKey)) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  rows={1}
                  placeholder="Ask anything about your studies..."
                  aria-label="Message"
                  className="flex-1 resize-none rounded-xl border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-4 py-2.5 text-base sm:text-sm outline-none focus:border-electric-500 focus:ring-2 focus:ring-electric-500/20 max-h-32"
                />
                {settings.voiceEnabled && voice.isSupported && (
                  <Button
                    type="button"
                    variant={voice.state === 'listening' ? 'primary' : 'outline'}
                    aria-label={voice.state === 'listening' ? 'Stop voice input' : 'Start voice input'}
                    aria-pressed={voice.state === 'listening'}
                    icon={voice.state === 'listening' ? <MicOff size={15} /> : <Mic size={15} />}
                    onClick={() => (voice.state === 'listening' ? voice.stop() : voice.start())}
                  />
                )}
                {isGenerating ? (
                  <Button variant="outline" icon={<Square size={15} />} onClick={cancelGeneration}>Stop</Button>
                ) : (
                  <Button icon={<Send size={15} />} onClick={() => send()} disabled={!input.trim()}>Send</Button>
                )}
              </div>
            </div>
            )}
          </Card>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 pb-16">
        <PageInfoSection
          about="AI Study Assistant is a full chat interface — conversations, markdown and code rendering, math and diagram support, attachments, and a prompt library. Beyond general chat, it includes seven purpose-built modes (General, Study Assistant, Coding Assistant, Social Media Assistant, Content Creator Assistant, Resume Assistant, and Career Assistant), each applying a different system prompt so responses stay focused on the task you're actually doing."
          tips={[
            'Pick a specific chat mode from the dropdown before you start — Study Assistant explains concepts step by step, while Coding Assistant prioritizes working code over long explanations. The right mode changes the shape of the answer, not just the topic.',
            'Attach a PDF, image, or text file (.png, .jpg, .webp, .pdf, .txt, .md, .docx are supported) directly to a message when you need the assistant to reference specific material, like lecture notes or a past assignment.',
            'Ask for a specific format when it matters — "explain this in 3 steps," "give me a table," or "just the formula, no explanation" — the assistant follows structural instructions more reliably than open-ended ones.',
            'Browse the Prompt Library (book icon) for ready-made starting prompts for study plans, summaries, and quiz generation instead of writing a prompt from scratch.',
            'Pin important conversations from the sidebar so they stay at the top as your conversation list grows.',
            'Use Export to save a conversation as Markdown, PDF, JSON, or plain text, and Import to bring a previously exported JSON conversation back in.',
          ]}
          faqs={[
            { question: 'Why isn\u2019t the assistant responding?', answer: 'The AI service may be temporarily unavailable, or you may have used all of today\u2019s free messages (the counter at the top shows how many are left). Your conversations, history, and formatting keep working either way — try again in a little while.' },
            { question: 'Is my conversation history stored anywhere?', answer: 'Conversations are kept in your browser\u2019s local storage on your device, the same way notes and planners are — not on a server.' },
            { question: 'Should I trust the assistant\u2019s answers for graded work?', answer: 'Treat it as a study aid, not a source of truth. Like any AI model, it can be confidently wrong, especially on precise figures, dates, citations, or institution-specific policies (like exact grading rules). Verify anything that will actually be graded or submitted against your course material or a teacher.' },
            { question: 'What kinds of questions is it actually good for?', answer: 'Explaining a concept a different way, working through a problem step by step, summarizing a document you attach, drafting or tightening writing (resumes, captions, outlines), and brainstorming — anything where seeing a first attempt and refining it is faster than starting from a blank page.' },
            { question: 'Can it read a PDF I attach and answer questions about it?', answer: 'Yes — attach the PDF to a message and ask about its contents. Very long or scanned/image-only PDFs may not extract cleanly; if a scanned document doesn\u2019t attach with readable text, try the OCR Text Extraction tool first and attach the resulting .txt file instead.' },
          ]}
          related={[
            { label: 'AI Assistant Settings', href: '/ai-assistant/settings' },
            { label: 'Study Planner', href: '/productivity/study-planner' },
            { label: 'OCR Text Extraction', href: '/document-tools/ocr-text-extraction' },
            { label: 'Notes', href: '/productivity/notes' },
          ]}
        />
      </div>
    </div>
  );
}
