import { useEffect, useRef, useState } from 'react';
import { Settings, RotateCcw, Eye, EyeOff, ShieldCheck, Download, Upload, Check } from 'lucide-react';
import { Seo, SITE_URL } from '@/components/Seo';
import { Breadcrumbs, breadcrumbJsonLd } from '@/components/ui/Breadcrumbs';
import { Card, SoftCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ToastProvider';
import { downloadBlob } from '@/features/document/logic/fileUtils';
import { useAISettings } from '../logic/useAISettings';
import { PROVIDER_CATALOG } from '../logic/providerRegistry';
import { DEFAULT_AI_SETTINGS, type AISettings, type SafetyLevel } from '../logic/aiTypes';

const SAFETY_LEVELS: SafetyLevel[] = ['strict', 'balanced', 'relaxed'];

/** Picks only known AISettings keys from arbitrary parsed JSON, keeping a value only if its
 * type matches the corresponding default — anything missing or wrong-typed is left out so
 * `updateSettings` falls back to the existing/default value instead of importing garbage. */
function sanitizeImportedSettings(input: unknown): Partial<AISettings> {
  if (typeof input !== 'object' || input === null) return {};
  const raw = input as Record<string, unknown>;
  const out: Partial<AISettings> = {};
  for (const key of Object.keys(DEFAULT_AI_SETTINGS) as (keyof AISettings)[]) {
    if (key === 'apiKey') continue; // never import a key from a file
    const value = raw[key];
    const defaultValue = DEFAULT_AI_SETTINGS[key];
    if (key === 'safetyLevel') {
      if (typeof value === 'string' && (SAFETY_LEVELS as string[]).includes(value)) out.safetyLevel = value as SafetyLevel;
      continue;
    }
    if (typeof value === typeof defaultValue) {
      (out as Record<string, unknown>)[key] = value;
    }
  }
  return out;
}

export default function AiSettingsPage() {
  const { settings, updateSettings, resetSettings, persistError } = useAISettings();
  const { showToast } = useToast();
  const [showKey, setShowKey] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isFirstRender = useRef(true);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // This page has no separate "draft" state — updateSettings() writes straight to
  // localStorage via useAISettings/useLocalStorage on every change, so there is nothing
  // for an explicit Save button to actually do; adding one would be the same class of bug
  // just fixed above (a control implying behavior that isn't real). Instead, surface a
  // real, brief "Saved" confirmation tied to the actual persisted write, debounced so
  // rapid changes (e.g. dragging a slider) don't flicker it repeatedly. persistError comes
  // from useLocalStorage's own write attempt, so a quota/private-mode failure shows here
  // as a real warning instead of a false "Saved".
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setJustSaved(true);
    clearTimeout(savedTimerRef.current);
    savedTimerRef.current = setTimeout(() => setJustSaved(false), 1600);
    return () => clearTimeout(savedTimerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  const crumbs = [{ label: 'AI Study Assistant', href: '/ai-assistant' }, { label: 'AI Settings' }];

  function exportSettings() {
    const safe = { ...settings, apiKey: '' }; // never export the key
    downloadBlob(new Blob([JSON.stringify(safe, null, 2)], { type: 'application/json' }), 'ai-settings.json');
  }

  function importSettings(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        const safe = sanitizeImportedSettings(parsed);
        if (Object.keys(safe).length === 0) {
          showToast('This file doesn\'t look like an AI settings export', 'error');
          return;
        }
        updateSettings(safe);
        showToast('Settings imported');
      } catch {
        showToast('Could not read this settings file', 'error');
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="noise-bg min-h-[70vh]">
      <Seo title="AI Settings" description="Configure the AI provider, model, and behavior for the Smart Study Assistant." path="/ai-assistant/settings" jsonLd={breadcrumbJsonLd(crumbs, SITE_URL)} noindex />
      <div className="mx-auto max-w-3xl px-4 sm:px-6 pt-8"><Breadcrumbs items={crumbs} /></div>

      <div className="mx-auto max-w-3xl px-4 sm:px-6 pt-6 pb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl gradient-brand text-white"><Settings size={20} /></div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-semibold">AI Settings</h1>
              <span
                aria-live="polite"
                className={`text-xs font-medium flex items-center gap-1 transition-opacity duration-300 ${justSaved ? 'opacity-100' : 'opacity-0'} ${persistError ? 'text-red-500' : 'text-emerald-500'}`}
              >
                <Check size={13} /> {persistError ? "Not saved — storage full or unavailable" : 'Saved'}
              </span>
            </div>
            <p className="text-navy-500 dark:text-ink-400 text-sm">Provider, model, and behavior settings below are used for real — everything is saved locally in this browser.</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 sm:px-6 pb-24 space-y-6">
        <Card>
          <h2 className="font-semibold mb-4">Provider</h2>
          <div className="grid sm:grid-cols-2 gap-2">
            {PROVIDER_CATALOG.map((p) => (
              <button key={p.id} onClick={() => updateSettings({ activeProviderId: p.id })} disabled={p.status === 'planned'}
                className={`text-left rounded-xl border p-3 transition-colors ${settings.activeProviderId === p.id ? 'border-electric-500 bg-electric-500/5' : 'border-navy-100 dark:border-white/10'} ${p.status === 'planned' ? 'opacity-50 cursor-not-allowed' : 'hover:border-electric-500'}`}>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-sm font-medium">{p.name}</span>
                  <Badge tone={p.status === 'available' ? 'emerald' : 'neutral'}>{p.status === 'available' ? 'Active' : 'Planned'}</Badge>
                </div>
                <p className="text-xs text-navy-500 dark:text-ink-500">{p.description}</p>
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold mb-4">Connection</h2>
          <SoftCard className="mb-4 flex items-start gap-2.5">
            <ShieldCheck size={15} className="text-emerald-500 shrink-0 mt-0.5" />
            <p className="text-sm text-navy-600 dark:text-ink-300">Stored only in this browser. The API key field below isn't used — every provider is configured with its own key on the server, never a key typed here or bundled into the app. It's kept for a possible future "bring your own key" mode, and exporting settings always excludes it either way.</p>
          </SoftCard>
          <label className="block text-sm mb-4">
            API key (not currently used by any provider — see note above)
            <div className="relative mt-1.5">
              <input type={showKey ? 'text' : 'password'} value={settings.apiKey} onChange={(e) => updateSettings({ apiKey: e.target.value })} placeholder="sk-..."
                className="w-full rounded-lg border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-3 py-2 pr-10 outline-none focus:border-electric-500 font-mono text-sm" />
              <button type="button" onClick={() => setShowKey((v) => !v)} aria-label={showKey ? 'Hide API key' : 'Show API key'} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-navy-400">
                {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </label>
          <label className="block text-sm">
            Model (placeholder)
            <input type="text" value={settings.model} onChange={(e) => updateSettings({ model: e.target.value })} placeholder="e.g. gemini-2.0-flash, gpt-4o"
              className="mt-1.5 w-full rounded-lg border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-3 py-2 outline-none focus:border-electric-500 text-sm" />
          </label>
        </Card>

        <Card>
          <h2 className="font-semibold mb-4">Sampling parameters</h2>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <label className="text-sm">Temperature — {settings.temperature.toFixed(1)}
              <input type="range" min={0} max={1.5} step={0.1} value={settings.temperature} onChange={(e) => updateSettings({ temperature: Number(e.target.value) })} className="mt-1.5 w-full accent-electric-500" />
            </label>
            <label className="text-sm">Creativity — {settings.creativity}
              <input type="range" min={0} max={100} value={settings.creativity} onChange={(e) => updateSettings({ creativity: Number(e.target.value) })} className="mt-1.5 w-full accent-electric-500" />
            </label>
            <label className="text-sm">Top P — {settings.topP.toFixed(2)}
              <input type="range" min={0} max={1} step={0.05} value={settings.topP} onChange={(e) => updateSettings({ topP: Number(e.target.value) })} className="mt-1.5 w-full accent-electric-500" />
            </label>
            <label className="text-sm">Top K — {settings.topK}
              <input type="range" min={1} max={100} value={settings.topK} onChange={(e) => updateSettings({ topK: Number(e.target.value) })} className="mt-1.5 w-full accent-electric-500" />
            </label>
            <label className="text-sm">Frequency penalty — {settings.frequencyPenalty.toFixed(1)}
              <input type="range" min={0} max={2} step={0.1} value={settings.frequencyPenalty} onChange={(e) => updateSettings({ frequencyPenalty: Number(e.target.value) })} className="mt-1.5 w-full accent-electric-500" />
            </label>
            <label className="text-sm">Presence penalty — {settings.presencePenalty.toFixed(1)}
              <input type="range" min={0} max={2} step={0.1} value={settings.presencePenalty} onChange={(e) => updateSettings({ presencePenalty: Number(e.target.value) })} className="mt-1.5 w-full accent-electric-500" />
            </label>
            <label className="text-sm">Max tokens
              <input type="number" min={1} value={settings.maxTokens} onChange={(e) => updateSettings({ maxTokens: Number(e.target.value) || 1 })} className="mt-1.5 w-full rounded-lg border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-3 py-2 outline-none focus:border-electric-500" />
            </label>
            <label className="text-sm">Context length
              <input type="number" min={512} step={512} value={settings.contextLength} onChange={(e) => updateSettings({ contextLength: Number(e.target.value) || 512 })} className="mt-1.5 w-full rounded-lg border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-3 py-2 outline-none focus:border-electric-500" />
            </label>
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold mb-4">Behavior</h2>
          <label className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Stream responses when supported</span>
            <input type="checkbox" checked={settings.streaming} onChange={(e) => updateSettings({ streaming: e.target.checked })} className="h-4 w-4 accent-electric-500" />
          </label>
          <label className="block text-sm mb-3">
            Safety level
            <select value={settings.safetyLevel} onChange={(e) => updateSettings({ safetyLevel: e.target.value as SafetyLevel })} className="mt-1.5 w-full rounded-lg border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-3 py-2 text-sm outline-none focus:border-electric-500">
              <option value="strict">Strict</option>
              <option value="balanced">Balanced</option>
              <option value="relaxed">Relaxed</option>
            </select>
          </label>
          <div className="grid sm:grid-cols-3 gap-3 mb-3">
            <label className="flex items-center justify-between text-sm border border-navy-100 dark:border-white/10 rounded-lg px-3 py-2">
              Reasoning <input type="checkbox" checked={settings.reasoningMode} onChange={(e) => updateSettings({ reasoningMode: e.target.checked })} className="accent-electric-500" />
            </label>
            <label className="flex items-center justify-between text-sm border border-navy-100 dark:border-white/10 rounded-lg px-3 py-2">
              Vision <input type="checkbox" checked={settings.visionEnabled} onChange={(e) => updateSettings({ visionEnabled: e.target.checked })} className="accent-electric-500" />
            </label>
            <label className="flex items-center justify-between text-sm border border-navy-100 dark:border-white/10 rounded-lg px-3 py-2">
              Voice <input type="checkbox" checked={settings.voiceEnabled} onChange={(e) => updateSettings({ voiceEnabled: e.target.checked })} className="accent-electric-500" />
            </label>
          </div>
          <p className="text-xs text-navy-400 dark:text-ink-500 mb-4">Reasoning and Vision are placeholders — no provider implements them yet. Voice uses your browser's built-in speech recognition for dictation (Chrome/Edge/Safari; not supported in Firefox) — a mic button appears next to the composer when enabled and your browser supports it.</p>
          <label className="block text-sm">
            <span className="flex items-baseline justify-between">
              <span>System prompt</span>
              <span className="text-xs text-navy-400 dark:text-ink-500 tabular-nums">{settings.systemPrompt.length.toLocaleString()} characters</span>
            </span>
            <textarea value={settings.systemPrompt} onChange={(e) => updateSettings({ systemPrompt: e.target.value })} rows={4}
              className="mt-1.5 w-full rounded-lg border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-3 py-2 outline-none focus:border-electric-500 text-sm leading-relaxed" />
          </label>
        </Card>

        <Card>
          <div className="flex flex-wrap gap-2 mb-4">
            <Button size="sm" variant="outline" icon={<Download size={14} />} onClick={exportSettings}>Export settings</Button>
            <Button size="sm" variant="outline" icon={<Upload size={14} />} onClick={() => fileInputRef.current?.click()}>Import settings</Button>
            <input ref={fileInputRef} type="file" accept="application/json" tabIndex={-1} className="sr-only" onChange={(e) => importSettings(e.target.files)} />
          </div>
          {!confirmReset ? (
            <Button variant="ghost" size="sm" icon={<RotateCcw size={14} />} onClick={() => setConfirmReset(true)}>Reset AI settings to defaults</Button>
          ) : (
            <SoftCard className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-sm text-red-500 min-w-0">Reset all AI settings? Saved conversations are not affected.</p>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" variant="outline" onClick={() => { resetSettings(); setConfirmReset(false); }}>Reset</Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirmReset(false)}>Cancel</Button>
              </div>
            </SoftCard>
          )}
        </Card>
      </div>
    </div>
  );
}
