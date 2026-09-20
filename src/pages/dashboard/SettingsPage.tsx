import { useMemo, useRef, useState } from 'react';
import { Settings as SettingsIcon, Sun, Moon, Monitor, Download, Upload, Trash2, Database, Globe, Volume2 } from 'lucide-react';
import { Seo } from '@/components/Seo';
import { Card, SoftCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useThemeStore } from '@/lib/store/theme';
import { usePreferencesStore, ACCENT_HEX, type AccentColor } from '@/lib/store/preferences';
import { useToast } from '@/components/ToastProvider';
import { downloadBlob } from '@/features/document/logic/fileUtils';
import { playUiSound } from '@/lib/audio/uiSound';

const AR_KEY_PREFIX = 'ar-';

// A genuine "Export all data" backup is inherently bounded by this origin's localStorage
// quota (typically a few MB, well under this), since it's a snapshot of what's already
// there. This guard isn't for a legitimate backup — it's for a student mis-selecting the
// wrong file (any large unrelated JSON, or a renamed file of another type entirely) in the
// file picker. Without it, `FileReader` + `JSON.parse` on the full file runs unconditionally
// before any content validation, and can freeze the tab for a large-enough file. Mirrors the
// same pre-read size check already used for "Import chat" in AiAssistantPage.tsx.
const MAX_IMPORT_FILE_SIZE = 20 * 1024 * 1024; // 20MB

function collectAllData(): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(AR_KEY_PREFIX)) {
      try {
        data[key] = JSON.parse(localStorage.getItem(key) ?? 'null');
      } catch {
        data[key] = localStorage.getItem(key);
      }
    }
  }
  return data;
}

function storageSizeBytes(): number {
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(AR_KEY_PREFIX)) total += (localStorage.getItem(key)?.length ?? 0) * 2;
  }
  return total;
}

export default function SettingsPage() {
  const { theme, setTheme } = useThemeStore();
  const {
    accent, setAccent,
    reduceMotion, setReduceMotion,
    displayName, setDisplayName,
    uiSoundEnabled, setUiSoundEnabled,
    uiSoundVolume, setUiSoundVolume,
  } = usePreferencesStore();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const storageKb = useMemo(() => (storageSizeBytes() / 1024).toFixed(1), []);

  function exportData() {
    const data = collectAllData();
    downloadBlob(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), `allrounder-helper-backup-${new Date().toISOString().slice(0, 10)}.json`);
    showToast('Data exported');
  }

  function importData(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    if (file.size > MAX_IMPORT_FILE_SIZE) {
      showToast('That file is too large to be a backup', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(reader.result as string) as Record<string, unknown>;
      } catch {
        showToast('Could not read this backup file', 'error');
        return;
      }
      const entries = Object.entries(parsed).filter(([key]) => key.startsWith(AR_KEY_PREFIX));
      if (entries.length === 0) {
        showToast('This file doesn\'t contain any recognizable backup data', 'error');
        return;
      }
      const previousValues = new Map<string, string | null>();
      try {
        for (const [key, value] of entries) {
          previousValues.set(key, localStorage.getItem(key));
          const raw = key === 'ar-theme' && typeof value === 'string' ? value : JSON.stringify(value);
          localStorage.setItem(key, raw);
        }
        showToast('Data imported — reload to see changes');
      } catch {
        // Roll back any keys already written in this import to avoid a half-applied backup.
        for (const [key, prev] of previousValues) {
          if (prev === null) localStorage.removeItem(key);
          else localStorage.setItem(key, prev);
        }
        showToast('Could not import this backup — your data was not changed', 'error');
      }
    };
    reader.readAsText(file);
  }

  function resetAll() {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(AR_KEY_PREFIX))
      .forEach((k) => localStorage.removeItem(k));
    showToast('All local data cleared');
    setConfirmReset(false);
    setTimeout(() => window.location.reload(), 800);
  }

  return (
    <div className="noise-bg min-h-[70vh]">
      <Seo title="Settings" description="Appearance, accessibility, and data management settings for ALLROUNDER HELPER." path="/settings" noindex />
      <div className="mx-auto max-w-3xl px-4 sm:px-6 pt-10 pb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl gradient-brand text-white">
            <SettingsIcon size={20} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold">Settings</h1>
            <p className="text-navy-500 dark:text-ink-400 text-sm">Appearance, accessibility, and your local data.</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 sm:px-6 pb-24 space-y-6">
        <Card>
          <h2 className="font-semibold mb-4">Profile</h2>
          <label className="block">
            <span className="text-sm font-medium text-navy-700 dark:text-ink-300 mb-2 block">Your name</span>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Alex"
              maxLength={40}
              className="w-full rounded-lg border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-3.5 py-2 text-sm text-navy-900 dark:text-ink-100 placeholder:text-navy-400 dark:placeholder:text-ink-500 focus:border-electric-500 focus:outline-none transition-colors"
            />
            <span className="text-xs text-navy-400 dark:text-ink-500 mt-1.5 block">Used to personalize greetings, like on the AI Assistant page. Stored only on this device.</span>
          </label>
        </Card>

        <Card>
          <h2 className="font-semibold mb-4">Appearance</h2>
          <div className="space-y-5">
            <div>
              <p className="text-sm font-medium text-navy-700 dark:text-ink-300 mb-2">Theme</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setTheme('light')} aria-pressed={theme === 'light'} className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium border transition-colors ${theme === 'light' ? 'border-electric-500 bg-electric-500/10 text-electric-500' : 'border-navy-200 dark:border-white/10 text-navy-500 dark:text-ink-400'}`}>
                  <Sun size={14} /> Light
                </button>
                <button onClick={() => setTheme('dark')} aria-pressed={theme === 'dark'} className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium border transition-colors ${theme === 'dark' ? 'border-electric-500 bg-electric-500/10 text-electric-500' : 'border-navy-200 dark:border-white/10 text-navy-500 dark:text-ink-400'}`}>
                  <Moon size={14} /> Dark
                </button>
                <button onClick={() => setTheme('system')} aria-pressed={theme === 'system'} className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium border transition-colors ${theme === 'system' ? 'border-electric-500 bg-electric-500/10 text-electric-500' : 'border-navy-200 dark:border-white/10 text-navy-500 dark:text-ink-400'}`}>
                  <Monitor size={14} /> System
                </button>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-navy-700 dark:text-ink-300 mb-2">Accent color</p>
              <div className="flex gap-2">
                {(Object.keys(ACCENT_HEX) as AccentColor[]).map((a) => (
                  <button
                    key={a}
                    onClick={() => setAccent(a)}
                    aria-label={`${a} accent`}
                    aria-pressed={accent === a}
                    className={`h-9 w-9 rounded-full border-2 transition-all ${accent === a ? 'border-navy-900 dark:border-white scale-110' : 'border-transparent'}`}
                    style={{ background: `linear-gradient(135deg, ${ACCENT_HEX[a].from}, ${ACCENT_HEX[a].to})` }}
                  />
                ))}
              </div>
            </div>

            <label className="flex items-center justify-between">
              <span className="text-sm font-medium text-navy-700 dark:text-ink-300">Reduce animations</span>
              <input type="checkbox" checked={reduceMotion} onChange={(e) => setReduceMotion(e.target.checked)} className="h-4 w-4 accent-electric-500" />
            </label>
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold mb-4 flex items-center gap-1.5"><Volume2 size={15} /> Sound &amp; effects</h2>
          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <span className="text-sm font-medium text-navy-700 dark:text-ink-300">Sound effects</span>
              <input type="checkbox" checked={uiSoundEnabled} onChange={(e) => setUiSoundEnabled(e.target.checked)} className="h-4 w-4 accent-electric-500" />
            </label>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-navy-700 dark:text-ink-300">Volume</span>
                <Button size="sm" variant="outline" disabled={!uiSoundEnabled} onClick={() => playUiSound('success', uiSoundVolume)}>Test sound</Button>
              </div>
              <input
                type="range" min={0} max={1} step={0.05}
                value={uiSoundVolume}
                disabled={!uiSoundEnabled}
                onChange={(e) => setUiSoundVolume(Number(e.target.value))}
                className="w-full accent-electric-500 disabled:opacity-50"
                aria-label="Sound effects volume"
              />
            </div>
            <p className="text-xs text-navy-400 dark:text-ink-500">
              Plays a short tone for success and error notifications across the app. This is separate from the Pomodoro Timer's and Focus Mode's own alarm/completion sound settings on those pages.
            </p>
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold mb-4 flex items-center gap-1.5"><Globe size={15} /> Language</h2>
          <SoftCard>
            <p className="text-sm text-navy-600 dark:text-ink-300">English (default)</p>
            <p className="text-xs text-navy-400 dark:text-ink-500 mt-1">Additional languages are planned — this selector is reserved for that release.</p>
          </SoftCard>
        </Card>

        <Card>
          <h2 className="font-semibold mb-4 flex items-center gap-1.5"><Database size={15} /> Data management</h2>
          <p className="text-sm text-navy-500 dark:text-ink-400 mb-4">
            Everything you've entered — tasks, notes, goals, saved colors, and more — lives only in this browser. Roughly <span className="font-medium">{storageKb} KB</span> is currently stored.
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            <Button size="sm" icon={<Download size={14} />} onClick={exportData}>Export all data</Button>
            <Button size="sm" variant="outline" icon={<Upload size={14} />} onClick={() => fileInputRef.current?.click()}>Import backup</Button>
            <input ref={fileInputRef} type="file" accept="application/json" tabIndex={-1} className="sr-only" onChange={(e) => { importData(e.target.files); e.target.value = ''; }} />
          </div>

          {!confirmReset ? (
            <Button size="sm" variant="ghost" icon={<Trash2 size={14} />} onClick={() => setConfirmReset(true)}>Reset application data</Button>
          ) : (
            <SoftCard className="flex items-center justify-between gap-3">
              <p className="text-sm text-red-500">Permanently delete all locally stored data? This can't be undone.</p>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" variant="outline" onClick={resetAll}>Yes, delete everything</Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirmReset(false)}>Cancel</Button>
              </div>
            </SoftCard>
          )}
        </Card>
      </div>
    </div>
  );
}
