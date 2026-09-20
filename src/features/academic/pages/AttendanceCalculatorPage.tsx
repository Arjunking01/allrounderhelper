import { useMemo, useState } from 'react';
import { CalendarCheck } from 'lucide-react';
import { CalculatorLayout } from '@/components/CalculatorLayout';
import { Card } from '@/components/ui/Card';
import { NumberField } from '@/components/ui/Field';
import { ResultStat } from '@/components/ui/ResultStat';
import { calculateAttendance } from '../logic/calculations';
import { getToolBySlug } from '@/data/toolsRegistry';

const tool = getToolBySlug('attendance-calculator')!;

export default function AttendanceCalculatorPage() {
  const [attended, setAttended] = useState('');
  const [total, setTotal] = useState('');
  const [target, setTarget] = useState('75');

  const valid =
    attended !== '' && total !== '' &&
    parseFloat(total) > 0 &&
    parseFloat(attended) >= 0 &&
    parseFloat(attended) <= parseFloat(total);

  const result = useMemo(
    () => (valid ? calculateAttendance(parseFloat(attended), parseFloat(total), parseFloat(target)) : null),
    [attended, total, target, valid]
  );

  return (
    <CalculatorLayout
      toolName={tool.name} tagline={tool.tagline} description={tool.description}
      path="/academic-tools/attendance-calculator" icon={CalendarCheck}
      breadcrumb={{ label: 'Attendance Calculator' }} article={article}
      resultSummary={result ? `Attendance: ${result.currentPercent.toFixed(2)}% · Can miss ${result.canMiss} · Need to attend ${result.needToAttend}` : ''}
    >
      <Card>
        <div className="grid sm:grid-cols-3 gap-4">
          <NumberField id="attended" label="Classes attended" placeholder="e.g. 42" value={attended} onChange={(e) => setAttended(e.target.value)} />
          <NumberField id="total" label="Total classes held" placeholder="e.g. 50" value={total} onChange={(e) => setTotal(e.target.value)} />
          <NumberField id="target" label="Target attendance" suffix="%" value={target} onChange={(e) => setTarget(e.target.value)} />
        </div>
        {attended !== '' && total !== '' && !valid && (
          <p className="mt-3 text-sm text-red-500" role="alert">
            {parseFloat(total) <= 0
              ? 'Total classes held must be greater than 0.'
              : 'Classes attended can\u2019t exceed total classes held — double-check the two numbers.'}
          </p>
        )}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6 border-t border-navy-100 dark:border-white/10 pt-6">
          <ResultStat label="Current attendance" value={result ? `${result.currentPercent.toFixed(2)}%` : '—'} />
          <ResultStat label="Classes you can miss" value={result ? String(result.canMiss) : '—'} tone="emerald" />
          <ResultStat label="Classes you must attend" value={result ? String(result.needToAttend) : '—'} tone="violet" />
        </div>
      </Card>
    </CalculatorLayout>
  );
}

const article = {
  intro: 'This calculator turns your attended and total class counts into a live attendance percentage, then works out how much slack you have — or how much ground you need to make up — against a target percentage.',
  whyItMatters: 'Most institutions set a minimum attendance requirement to sit exams. Knowing your safe margin in advance means you can plan absences deliberately instead of finding out too late that you fell short. A 75% requirement is common but not universal — some programs use 65%, others 80% or higher for specific subjects, and some allow condonation for medical or documented leave. Check your institution\u2019s actual policy rather than assuming 75% applies to you.',
  howItWorks: [
    'Enter how many classes you have attended so far.',
    'Enter the total number of classes held so far.',
    'Set your target attendance percentage (commonly 75%, but check your institution\u2019s actual rule).',
    'The tool calculates your current percentage plus how many classes you can miss or must attend to stay on target.',
  ],
  examples: [
    { title: 'Safely below target', body: 'Attended 45 of 50 classes (90%) with a 75% target — you can miss several upcoming classes and still clear the bar.' },
    { title: 'Below target', body: 'Attended 30 of 50 classes (60%) with a 75% target — the calculator shows exactly how many consecutive classes you must attend to recover.' },
    { title: 'Right at the edge', body: 'Attended 38 of 50 classes (76%) with a 75% target — you\u2019re technically clear, but missing even one more upcoming class without any further attendance could drop you back under, so recheck after each class if you\u2019re this close.' },
  ],
  mistakes: [
    'Forgetting to update the total class count as the term progresses, which understates how many you can still miss.',
    'Setting an unrealistic target percentage that doesn\'t match your institution\'s actual policy.',
    'Assuming missed classes can be "made up" without checking your institution\'s specific rules on condonation or medical leave.',
    'Treating the "classes you can miss" number as fixed for the rest of the term — it shrinks every time the total class count grows, so it needs rechecking regularly, not just once.',
  ],
  tips: [
    'Recalculate weekly so your safe-miss count always reflects the latest data.',
    'If you are below target, prioritise attending every class until the required-attendance count reaches zero.',
    'Check whether your institution counts attendance per subject or as an overall average — enter figures accordingly.',
  ],
  faqs: [
    { question: 'How is the "classes you can miss" number calculated?', answer: 'It finds the maximum total class count at which your current attended count still meets the target percentage, then subtracts classes held so far.' },
    { question: 'What if my attendance is already below target?', answer: 'The calculator shows 0 for classes you can miss and instead reports how many consecutive classes you need to attend to reach your target.' },
    { question: 'Does this account for future classes?', answer: 'It projects forward assuming you attend every future class in the "need to attend" scenario, so recalculate as new classes are held.' },
    { question: 'Is 75% the standard attendance requirement everywhere?', answer: 'No — it\u2019s common at many institutions but far from universal. Some set the bar lower, some higher, and rules can differ by subject or allow exceptions for documented medical leave. Always use your own institution\u2019s published requirement as the target, not an assumed default.' },
  ],
  related: [
    { label: 'Deadline Calculator', href: '/academic-tools/deadline-calculator' },
    { label: 'Study Hours Calculator', href: '/academic-tools/study-hours-calculator' },
    { label: 'Study Planner', href: '/productivity/study-planner' },
    { label: 'Exam Countdown', href: '/productivity/exam-countdown' },
  ],
};
