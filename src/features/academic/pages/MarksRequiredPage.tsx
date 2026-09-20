import { useMemo, useState } from 'react';
import { ClipboardCheck } from 'lucide-react';
import { CalculatorLayout } from '@/components/CalculatorLayout';
import { Card } from '@/components/ui/Card';
import { NumberField } from '@/components/ui/Field';
import { ResultStat } from '@/components/ui/ResultStat';
import { calculateMarksRequired } from '../logic/calculations';
import { getToolBySlug } from '@/data/toolsRegistry';

const tool = getToolBySlug('marks-required-calculator')!;

export default function MarksRequiredPage() {
  const [current, setCurrent] = useState('');
  const [total, setTotal] = useState('');
  const [target, setTarget] = useState('');
  const targetValid = target === '' || (parseFloat(target) >= 0 && parseFloat(target) <= 100);
  const valid = current !== '' && total !== '' && parseFloat(total) > 0 && parseFloat(current) >= 0 && parseFloat(current) <= parseFloat(total) && targetValid;
  const result = useMemo(
    () => (valid ? calculateMarksRequired(parseFloat(current), parseFloat(total), target === '' ? null : parseFloat(target)) : null),
    [current, total, target, valid]
  );

  return (
    <CalculatorLayout
      toolName={tool.name} tagline={tool.tagline} description={tool.description}
      path="/academic-tools/marks-required-calculator" icon={ClipboardCheck}
      breadcrumb={{ label: 'Marks Required Calculator' }} article={article}
      resultSummary={result ? `Current: ${result.currentPercentage.toFixed(2)}% · Status: ${result.status}${result.requiredMarks !== null ? ` · Need ${result.requiredMarks} marks` : ''}` : ''}
    >
      <Card>
        <div className="grid sm:grid-cols-3 gap-4">
          <NumberField id="current" label="Current marks" value={current} onChange={(e) => setCurrent(e.target.value)} />
          <NumberField id="total" label="Total marks" value={total} onChange={(e) => setTotal(e.target.value)} />
          <NumberField id="target" label="Target percentage (optional)" suffix="%" value={target} onChange={(e) => setTarget(e.target.value)} />
        </div>
        {current !== '' && total !== '' && (parseFloat(total) <= 0 || parseFloat(current) > parseFloat(total)) && (
          <p role="alert" className="text-xs text-red-500 mt-3">
            {parseFloat(total) <= 0 ? 'Total marks must be greater than 0.' : 'Current marks can\u2019t exceed total marks.'}
          </p>
        )}
        {target !== '' && !targetValid && (
          <p role="alert" className="text-xs text-red-500 mt-3">Target percentage must be between 0 and 100.</p>
        )}
        <div className="mt-8 grid sm:grid-cols-3 gap-6 border-t border-navy-100 dark:border-white/10 pt-6">
          <ResultStat label="Current percentage" value={result ? `${result.currentPercentage.toFixed(2)}%` : '—'} />
          <ResultStat label="Marks needed for target" value={result?.requiredMarks !== null && result ? String(result.requiredMarks) : '—'} tone="violet" />
          <ResultStat label="Status" value={result ? result.status : '—'} tone={result?.status === 'Pass' || result?.status === 'On Target' ? 'emerald' : 'brand'} />
        </div>
      </Card>
    </CalculatorLayout>
  );
}

const article = {
  intro: 'This calculator shows your current percentage from marks obtained so far, and — if you set a target percentage — exactly how many total marks you need to reach it.',
  whyItMatters: 'Knowing the precise mark threshold for a target grade turns a vague goal like "do better" into a concrete number you can plan revision and remaining assessments around.',
  howItWorks: [
    'Enter the marks you have obtained so far.',
    'Enter the total marks the assessment (or course) is out of.',
    'Optionally set a target percentage you want to reach.',
    'The tool calculates your current percentage and the total marks needed to hit your target.',
  ],
  examples: [
    { title: 'On track', body: 'Current 320/400 = 80%. Target 75% needs only 300 marks — already achieved.' },
    { title: 'Needs more', body: 'Current 150/400 = 37.5%. Target 60% needs 240 marks — 90 more than currently earned.' },
    { title: 'Working backward from remaining assessments', body: 'If your total is 400 and only 100 of those marks are still up for grabs (say, a final exam), a target of 60% (240 marks) with 150 already earned means you need 90 of the remaining 100 marks — a 90% score on what\'s left. Use this to judge quickly whether a target is still realistic given what\'s actually left to complete.' },
  ],
  mistakes: [
    'Using marks from a single test as "current" when the target percentage refers to the full course total.',
    'Forgetting that required marks are a total figure, not additional marks needed beyond what you already have.',
    'Setting a target below 40%, which may not reflect your institution\'s actual pass threshold.',
    'Not checking whether the required marks are still mathematically possible given how many marks are actually left in the course.',
  ],
  tips: [
    'Recalculate after every assessment to keep your target on track.',
    'Use the Status field as a quick sanity check — it tracks your specific target once one is set, and only falls back to the generic 40% pass mark when the target field is empty.',
    'Combine with the Exam Score Calculator to plan for a single upcoming exam specifically.',
  ],
  faqs: [
    { question: 'Is 40% always the pass mark?', answer: 'The calculator only falls back to a 40% default when no target percentage is set. Pass marks vary by institution and course — check your specific requirement.' },
    { question: 'What does "marks needed for target" mean exactly?', answer: 'It is the total marks (out of your total marks field) required to reach the target percentage — not additional marks on top of your current score.' },
    { question: 'What does the Status field mean once I set a target?', answer: 'It switches from the generic 40% pass/fail baseline to "On Target" or "Below Target" — whether your current marks already meet the specific target you set, not the institution\u2019s general pass mark.' },
    { question: 'Can target percentage be left blank?', answer: 'Yes — leaving it blank shows your current percentage and the generic 40% pass/fail status instead.' },
  ],
  related: [
    { label: 'Percentage Calculator', href: '/academic-tools/percentage-calculator' },
    { label: 'Exam Score Calculator', href: '/academic-tools/exam-score-calculator' },
    { label: 'Assignment Score Calculator', href: '/academic-tools/assignment-score-calculator' },
    { label: 'Study Planner', href: '/productivity/study-planner' },
  ],
};
