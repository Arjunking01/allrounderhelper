import { useNavigate } from 'react-router-dom';
import { Bot } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { buildAskAiAboutTextState } from '../logic/aiHandoff';

interface Props {
  /** The extracted text to hand off (already the full/success-state text — this
   *  component doesn't truncate itself, buildAskAiAboutTextState does). */
  text: string;
  /** Human-readable tool name used in the generated prompt, e.g. "OCR Text Extraction". */
  toolName: string;
}

/** "Ask AI about this" — carries extracted document text straight into the AI Assistant's
 *  composer via router state, so a student never has to manually copy a long extraction
 *  result out of a textarea and paste it into chat. See features/document/logic/aiHandoff.ts. */
export function AskAiAboutTextButton({ text, toolName }: Props) {
  const navigate = useNavigate();

  return (
    <Button
      size="sm"
      variant="outline"
      icon={<Bot size={14} />}
      disabled={!text.trim()}
      onClick={() => navigate('/ai-assistant', { state: buildAskAiAboutTextState(text, toolName) })}
    >
      Ask AI about this
    </Button>
  );
}
