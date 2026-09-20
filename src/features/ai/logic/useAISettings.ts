import { useLocalStorage } from '@/hooks/useLocalStorage';
import { DEFAULT_AI_SETTINGS, type AISettings } from './aiTypes';

const STORAGE_KEY = 'ar-ai-settings';

export function useAISettings() {
  const [stored, setSettings, persistError] = useLocalStorage<AISettings>(STORAGE_KEY, DEFAULT_AI_SETTINGS);
  // Merge with current defaults so settings saved before new fields were added never end up undefined.
  const settings: AISettings = { ...DEFAULT_AI_SETTINGS, ...stored };

  function updateSettings(patch: Partial<AISettings>) {
    setSettings((prev) => ({ ...DEFAULT_AI_SETTINGS, ...prev, ...patch }));
  }

  function resetSettings() {
    setSettings(DEFAULT_AI_SETTINGS);
  }

  return { settings, updateSettings, resetSettings, persistError };
}
