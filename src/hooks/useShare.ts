import { useToast } from '@/components/ToastProvider';

export function useShare() {
  const { showToast } = useToast();

  async function share(text: string, title = 'ALLROUNDER HELPER') {
    if (navigator.share) {
      try {
        await navigator.share({ title, text });
        return;
      } catch {
        // user cancelled or share failed — fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      showToast('Copied — sharing isn\'t supported here, so it\'s on your clipboard instead');
    } catch {
      showToast('Could not share or copy this result', 'error');
    }
  }

  return { share };
}
