import { useMemo, useState } from 'react';
import { ListChecks } from 'lucide-react';
import { CalculatorLayout } from '@/components/CalculatorLayout';
import { Card } from '@/components/ui/Card';
import { NumberField } from '@/components/ui/Field';
import { ResultStat } from '@/components/ui/ResultStat';
import { calculateExamScore } from '../logic/calculations';
import { getToolBySlug } from '@/data/toolsRegistry';

const tool = getToolBySlug('exam-score-calculator')!;

export default function ExamScorePage() {
  const [obtained, setObtained] = useState('');
  const [total, setTotal] = useState('');
  const [passing, setPassing] = useState('');
  const valid = obtained !== '' && total !== '' && parseFloat(total) > 0 && parseFloat(obtained) >= 0 && parseFloat(obtained) <= parseFloat(total);
  const result = useMemo(
    () => (valid ? calculateExamScore(parseFloat(obtained), parseFloat(total), passing === '' ? null : parseFloat(passing)) : null),
    [obtained, total, passing, valid]
  );

  return (
    <CalculatorLayout
      toolName={tool.name} tagline={tool.tagline} description={tool.description}
      path="/academic-tools/exam-score-calculator" icon={ListChecks}
      breadcrumb={{ label: 'Exam Score Calculator' }} article={article}
      resultSummary={result ? `${result.percentage.toFixed(2)}% · Grade ${result.grade} · ${result.status}` : ''}
    >
      <Card>
        <div className="grid sm:grid-cols-3 gap-4">
          <NumberField id="obtained" label="Marks obtained" value={obtained} onChange={(e) => setObtained(e.target.value)} />
          <NumberField id="total" label="Total marks" value={total} onChange={(e) => setTotal(e.target.value)} />
          <NumberField id="passing" label="Passing marks (optional)" value={passing} onChange={(e) => setPassing(e.target.value)} />
        </div>
        {obtained !== '' && total !== '' && !valid && (
          <p className="mt-3 text-sm text-red-500" role="alert">
            {parseFloat(total) <= 0
              ? 'Total marks must be greater than 0.'
              : 'Marks obtained can\u2019t exceed total marks — double-check the two numbers.'}
          </p>
        )}
        <div className="mt-8 grid sm:grid-cols-3 gap-6 border-t border-navy-100 dark:border-white/10 pt-6">
          <ResultStat label="Percentage" value={result ? `${result.percentage.toFixed(2)}%` : '—'} />
          <ResultStat label="Grade" value={result ? result.grade : '—'} tone="violet" />
          <ResultStat label="Status" value={result ? result.status : '—'} tone={result?.status === 'PASS' ? 'emerald' : 'brand'} />
        </div>
      </Card>
    </CalculatorLayout>
  );
}

const article = {
  intro: 'This calculator converts exam marks into a percentage and letter grade, and checks pass/fail status against a passing mark you specify.',
  whyItMatters: 'A single exam often carries significant weight toward a final grade. Knowing your percentage, grade, and pass status the moment marks are released helps you plan what comes next — resits, revision focus, or simply peace of mind.',
  howItWorks: [
    'Enter the marks obtained in the exam.',
    'Enter the total marks the exam is out of.',
    'Optionally enter the passing marks threshold set by your institution.',
    'The tool calculates percentage, grade, and pass/fail status.',
  ],
  examples: [
    { title: 'Clear pass', body: 'Obtained 78/100 with a passing mark of 40 — status shows PASS with grade B+.' },
    { title: 'Narrow fail', body: 'Obtained 35/100 with a passing mark of 40 — status shows FAIL, five marks short.' },
    { title: 'Pass overall, fail a component', body: 'Some institutions require a separate minimum in each of theory and practical, not just the combined total — a 78/100 combined score can still fail overall if, say, the practical component alone needed 15/30 and you scored 10. Check whether your course has component-wise minimums before assuming a passing combined percentage is enough.' },
  ],
  mistakes: [
    'Using the overall course pass mark instead of the exam-specific one, when they differ.',
    'Forgetting that "status" only evaluates against the passing marks field — leaving it blank shows "Not Evaluated" instead.',
    'Entering marks as a percentage instead of raw marks in the obtained/total fields.',
    'Assuming a passing combined percentage means an automatic pass, when some institutions also require separate component-wise minimums.',
  ],
  tips: [
    'Check your specific exam\'s official passing mark before relying on the status result.',
    'Use this straight after results are released to quickly triage which exams need appeal or resit action.',
    'Combine with the Marks Required Calculator if you still have components left to complete the course.',
  ],
  faqs: [
    { question: 'What happens if I leave passing marks blank?', answer: 'The status field shows "Not Evaluated" since there is no threshold to compare against — percentage and grade are still calculated.' },
    { question: 'What grade bands are used?', answer: '90%+ A+, 80%+ A, 70%+ B+, 60%+ B, 50%+ C, 40%+ D, below 40% F — a general guide, check your syllabus for your institution\'s exact bands.' },
    { question: 'Is the passing mark always 40%?', answer: 'No — passing marks vary widely by institution and exam. Always enter your specific institution\'s threshold for an accurate status.' },
  ],
  related: [
    { label: 'Assignment Score Calculator', href: '/academic-tools/assignment-score-calculator' },
    { label: 'Marks Required Calculator', href: '/academic-tools/marks-required-calculator' },
    { label: 'Exam Countdown', href: '/productivity/exam-countdown' },
  ],
};
