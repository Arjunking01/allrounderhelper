import { FileText } from 'lucide-react';

interface Props {
  onSelect: (text: string) => void;
}

/** Contextual "what do you want done with this?" chips shown once a document/text
 *  attachment (PDF, DOCX, TXT, MD — has extracted text) is staged in the composer but
 *  the student hasn't typed anything yet. Tapping one fills the composer with a specific,
 *  student-oriented request rather than sending immediately — the student can still edit
 *  it before sending, and nothing here presumes "summarize" is what they actually want
 *  (see aiHandoff.ts for the same open-ended principle on the document-tools side of this
 *  workflow). Purely a shortcut for the common cases; free-form typing always works too. */
const DOCUMENT_ACTIONS = [
  'Summarize this document',
  'Explain the key points simply',
  'Create viva/oral-exam questions from this',
  'Create multiple-choice questions from this',
  'Turn this into revision notes',
  'Extract the important questions from this',
];

export function DocumentQuickActions({ onSelect }: Props) {
  return (
    <div className="mb-2.5" role="group" aria-label="Quick actions for your attached document">
      <p className="flex items-center gap-1.5 text-[11px] font-medium text-navy-400 dark:text-ink-500 mb-1.5">
        <FileText size={11} /> What would you like me to do with this?
      </p>
      <div className="flex flex-wrap gap-1.5">
        {DOCUMENT_ACTIONS.map((action) => (
          <button
            key={action}
            type="button"
            onClick={() => onSelect(action)}
            className="rounded-full border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-3 py-1.5 text-xs font-medium text-navy-600 dark:text-ink-300 hover:border-electric-500 hover:text-electric-600 dark:hover:text-electric-400 transition-colors"
          >
            {action}
          </button>
        ))}
      </div>
    </div>
  );
}
