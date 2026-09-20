import { useEffect, useMemo, useState } from 'react';
import { CalendarClock } from 'lucide-react';
import { CalculatorLayout } from '@/components/CalculatorLayout';
import { Card } from '@/components/ui/Card';
import { TextField } from '@/components/ui/Field';
import { ResultStat } from '@/components/ui/ResultStat';
import { calculateDeadline } from '../logic/calculations';
import { getToolBySlug } from '@/data/toolsRegistry';

const tool = getToolBySlug('deadline-calculator')!;

export default function DeadlineCalculatorPage() {
  const [taskName, setTaskName] = useState('');
  const [deadline, setDeadline] = useState('');
  const [, forceTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => forceTick((v) => v + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const result = useMemo(() => (deadline ? calculateDeadline(deadline) : null), [deadline]);

  return (
    <CalculatorLayout
      toolName={tool.name} tagline={tool.tagline} description={tool.description}
      path="/academic-tools/deadline-calculator" icon={CalendarClock}
      breadcrumb={{ label: 'Deadline Calculator' }} article={article}
      resultSummary={result ? (result.passed ? `${taskName || 'Deadline'}: already passed` : `${taskName || 'Deadline'}: ${result.days}d ${result.hours}h ${result.minutes}m remaining`) : ''}
    >
      <Card>
        <div className="grid sm:grid-cols-2 gap-4">
          <TextField id="taskName" label="Task or exam name" placeholder="e.g. Assignment 2 submission" value={taskName} onChange={(e) => setTaskName(e.target.value)} />
          <TextField id="deadline" label="Deadline" type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </div>
        <div className="mt-8 border-t border-navy-100 dark:border-white/10 pt-6">
          {result ? (
            result.passed ? (
              <p className="text-lg font-semibold text-navy-500 dark:text-ink-400">{taskName || 'This deadline'} has passed.</p>
            ) : (
              <div className="grid grid-cols-3 gap-6">
                <ResultStat label="Days" value={String(result.days)} />
                <ResultStat label="Hours" value={String(result.hours)} tone="violet" />
                <ResultStat label="Minutes" value={String(result.minutes)} tone="emerald" />
              </div>
            )
          ) : (
            <p className="text-navy-400 dark:text-ink-500 text-sm">Pick a deadline to see the countdown.</p>
          )}
        </div>
      </Card>
    </CalculatorLayout>
  );
}

const article = {
  intro: 'This calculator counts down the exact days, hours, and minutes remaining until an assignment, exam, or project deadline you specify.',
  whyItMatters: 'A precise countdown makes deadlines feel real rather than abstract, helping with time-blocking and reducing last-minute surprises.',
  howItWorks: [
    'Name the task or exam you\'re tracking.',
    'Pick the exact date and time of the deadline.',
    'The tool calculates the difference between now and the deadline, updating automatically.',
  ],
  examples: [
    { title: 'Upcoming deadline', body: 'A deadline three days and six hours away shows "3 Days, 6 Hours, 12 Minutes Remaining".' },
    { title: 'Passed deadline', body: 'If the selected date and time has already passed, the tool clearly states the deadline has passed instead of showing negative numbers.' },
  ],
  mistakes: [
    'Forgetting to check time zone settings if you\'re studying abroad or the deadline is set in a different zone.',
    'Entering a date without the specific time, defaulting to midnight when the actual deadline is earlier in the day.',
    'Relying on a single countdown without also adding it to your calendar for reminders.',
  ],
  tips: [
    'Set deadlines a little earlier than the official time to build in a buffer for submission issues.',
    'Use alongside the Study Hours Calculator to work backward from a deadline into a daily study plan.',
    'If you\'re tracking several deadlines at once, use the Assignment Tracker in Productivity Tools instead — it\'s built for multiple deadlines with reminders, while this tool is focused on one deadline at a time.',
  ],
  faqs: [
    { question: 'Does the countdown update automatically?', answer: 'Yes — it refreshes every minute while the page is open.' },
    { question: 'Can I track multiple deadlines?', answer: 'This tool tracks one deadline at a time by design, for a focused countdown view. For multiple deadlines with reminders, use the Assignment Tracker in Productivity Tools.' },
    { question: 'What happens right at the deadline?', answer: 'Once the deadline time passes, the tool switches to a "has passed" message instead of showing a countdown.' },
  ],
  related: [
    { label: 'Study Hours Calculator', href: '/academic-tools/study-hours-calculator' },
    { label: 'Attendance Calculator', href: '/academic-tools/attendance-calculator' },
    { label: 'Assignment Tracker', href: '/productivity/assignment-tracker' },
    { label: 'Exam Countdown', href: '/productivity/exam-countdown' },
  ],
};
