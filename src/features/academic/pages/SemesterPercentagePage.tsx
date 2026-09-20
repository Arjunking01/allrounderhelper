import { useMemo, useState } from 'react';
import { Sigma } from 'lucide-react';
import { CalculatorLayout } from '@/components/CalculatorLayout';
import { Card } from '@/components/ui/Card';
import { NumberField } from '@/components/ui/Field';
import { ResultStat } from '@/components/ui/ResultStat';
import { calculateSemesterPercentage } from '../logic/calculations';
import { getToolBySlug } from '@/data/toolsRegistry';

const tool = getToolBySlug('semester-percentage-calculator')!;

export default function SemesterPercentagePage() {
  const [obtained, setObtained] = useState('');
  const [maximum, setMaximum] = useState('');
  const valid = obtained !== '' && maximum !== '' && parseFloat(maximum) > 0 && parseFloat(obtained) <= parseFloat(maximum) && parseFloat(obtained) >= 0;
  const result = useMemo(() => (valid ? calculateSemesterPercentage(parseFloat(obtained), parseFloat(maximum)) : null), [obtained, maximum, valid]);

  return (
    <CalculatorLayout
      toolName={tool.name} tagline={tool.tagline} description={tool.description}
      path="/academic-tools/semester-percentage-calculator" icon={Sigma}
      breadcrumb={{ label: 'Semester Percentage Calculator' }} article={article}
      resultSummary={result ? `${result.percentage.toFixed(2)}% · ${result.performance}` : ''}
    >
      <Card>
        <div className="grid sm:grid-cols-2 gap-4">
          <NumberField id="obtained" label="Total marks obtained" value={obtained} onChange={(e) => setObtained(e.target.value)} />
          <NumberField id="maximum" label="Maximum possible marks" value={maximum} onChange={(e) => setMaximum(e.target.value)} />
        </div>
        {(obtained !== '' && maximum !== '' && !valid) && <p role="alert" className="text-xs text-red-500 mt-3">Enter valid marks (obtained cannot exceed maximum).</p>}
        <div className="mt-8 grid sm:grid-cols-2 gap-6 border-t border-navy-100 dark:border-white/10 pt-6">
          <ResultStat label="Semester percentage" value={result ? `${result.percentage.toFixed(2)}%` : '—'} />
          <ResultStat label="Performance" value={result ? result.performance : '—'} tone="violet" />
        </div>
      </Card>
    </CalculatorLayout>
  );
}

const article = {
  intro: 'This tool totals your marks across every subject in a semester and expresses them as a single percentage, along with a qualitative performance rating.',
  whyItMatters: 'A semester percentage gives a quick, holistic view of how a term went — useful for report cards, scholarship renewals, and tracking progress over multiple semesters.',
  howItWorks: [
    'Add up the marks you obtained across every subject in the semester.',
    'Add up the maximum possible marks across the same subjects.',
    'Enter both totals — the calculator divides obtained by maximum and multiplies by 100.',
    'A performance label is applied based on commonly used percentage bands (see FAQ — your institution may use different cutoffs).',
  ],
  examples: [
    { title: 'Strong semester', body: '810 out of 900 across six subjects gives 90% — an "Excellent" rating on this tool\'s bands.' },
    { title: 'Average semester', body: '450 out of 900 gives exactly 50%, landing in the "Average" band.' },
    { title: 'Mixed-scale subjects', body: 'If one subject is graded out of 50 and another out of 100, add the raw obtained marks (say 40+85=125) over the raw maximums (50+100=150) for 83.3% — don\'t average the two percentages (80% and 85%) directly, since that ignores the different weight each subject actually carries.' },
  ],
  mistakes: [
    'Mixing marks from different scales (e.g. one subject out of 50, another out of 100) without converting to a common total first.',
    'Forgetting to include practical or internal assessment marks in the totals.',
    'Entering obtained marks that exceed the maximum, which the calculator flags as invalid.',
    'Averaging each subject\'s percentage instead of summing raw marks — this silently misweights subjects with different maximums.',
  ],
  tips: [
    'Always sum raw marks across subjects rather than averaging percentages — this avoids weighting errors when subjects carry different maximums.',
    'Recalculate as soon as all subject results are published for an accurate semester figure.',
    'Use alongside the CGPA calculator for a grade-point view of the same semester.',
  ],
  faqs: [
    { question: 'How is the performance rating decided?', answer: 'This tool uses commonly seen bands (90%+ Excellent, 75%+ Very Good, 60%+ Good, 40%+ Average, below 40% Needs Improvement) as a general reference — your institution may define its own grading bands or honors thresholds, so treat the label as informal, not official.' },
    { question: 'Should I include lab or practical marks?', answer: 'Yes — include every graded component in both your obtained and maximum totals for an accurate overall percentage.' },
    { question: 'Can this replace my official transcript percentage?', answer: 'No — always treat this as an estimate and confirm your official percentage with your institution\'s examination department.' },
  ],
  related: [
    { label: 'Percentage Calculator', href: '/academic-tools/percentage-calculator' },
    { label: 'CGPA Calculator', href: '/academic-tools/cgpa-calculator' },
    { label: 'GPA to Percentage', href: '/academic-tools/gpa-to-percentage' },
  ],
};
