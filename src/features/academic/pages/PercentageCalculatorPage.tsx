import { useMemo, useState } from 'react';
import { Percent } from 'lucide-react';
import { CalculatorLayout } from '@/components/CalculatorLayout';
import { Card } from '@/components/ui/Card';
import { NumberField } from '@/components/ui/Field';
import { ResultStat } from '@/components/ui/ResultStat';
import { calculatePercentage } from '../logic/calculations';
import { getToolBySlug } from '@/data/toolsRegistry';

const tool = getToolBySlug('percentage-calculator')!;

export default function PercentageCalculatorPage() {
  const [obtained, setObtained] = useState('');
  const [total, setTotal] = useState('');
  const valid = obtained !== '' && total !== '' && parseFloat(total) > 0;
  const result = useMemo(() => (valid ? calculatePercentage(parseFloat(obtained), parseFloat(total)) : null), [obtained, total, valid]);

  return (
    <CalculatorLayout
      toolName={tool.name} tagline={tool.tagline} description={tool.description}
      path="/academic-tools/percentage-calculator" icon={Percent}
      breadcrumb={{ label: 'Percentage Calculator' }} article={article}
      resultSummary={result ? `${result.percentage.toFixed(2)}% · Grade ${result.grade} · GPA ${result.gpa.toFixed(2)}` : ''}
    >
      <Card>
        <div className="grid sm:grid-cols-2 gap-4">
          <NumberField id="obtained" label="Marks obtained" placeholder="e.g. 432" value={obtained} onChange={(e) => setObtained(e.target.value)} />
          <NumberField id="total" label="Total marks" placeholder="e.g. 500" value={total} onChange={(e) => setTotal(e.target.value)} />
        </div>
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6 border-t border-navy-100 dark:border-white/10 pt-6">
          <ResultStat label="Percentage" value={result ? `${result.percentage.toFixed(2)}%` : '—'} />
          <ResultStat label="Predicted grade" value={result ? result.grade : '—'} tone="violet" />
          <ResultStat label="Equivalent GPA" value={result ? result.gpa.toFixed(2) : '—'} tone="emerald" />
        </div>
      </Card>
    </CalculatorLayout>
  );
}

const article = {
  intro: 'This tool converts obtained marks and total marks into a percentage, then predicts a letter grade and an equivalent GPA using commonly seen grading bands.',
  whyItMatters: 'Percentage is the most universal way results get compared across subjects, exam boards, and countries, so a fast, accurate conversion saves manual arithmetic and reduces mistakes on report cards or applications.',
  howItWorks: [
    'Enter the marks you obtained.',
    'Enter the total marks the assessment was out of.',
    'The calculator divides obtained by total and multiplies by 100 for the percentage.',
    'A grade and GPA equivalent are derived automatically from common grading bands — check your institution\'s exact bands for anything official.',
  ],
  examples: [
    { title: 'High score', body: '432 out of 500 = 86.4%, which falls in the A grade band with an estimated GPA of 9.09.' },
    { title: 'Borderline score', body: '199 out of 500 = 39.8%, just under the 40% pass band typically used for a D grade.' },
    { title: 'Averaging across subjects', body: 'Three subjects at 82%, 74%, and 91% average to (82+74+91)/3 = 82.3% — this is a simple average, so it only gives an accurate overall figure if every subject carries equal weight; if credits or maximum marks differ, use the Semester Percentage tool instead, which sums raw marks rather than averaging percentages.' },
  ],
  mistakes: [
    'Entering obtained marks greater than total marks, which produces a percentage above 100%.',
    'Using a subject-specific total when you meant the overall exam total, or vice versa.',
    'Assuming the same grade bands apply everywhere — always check your institution\'s exact cutoffs.',
    'Simple-averaging several subject percentages when the subjects don\'t carry equal weight or equal maximum marks.',
  ],
  tips: [
    'Use this tool per-subject and then average results for an overall percentage across subjects — but only when subjects carry roughly equal weight (see the example above).',
    'Cross-check the GPA estimate against your institution\'s official conversion formula before submitting anywhere official.',
    'Round only at the final step to avoid compounding rounding errors.',
  ],
  faqs: [
    { question: 'How is the grade determined?', answer: 'The tool uses common percentage bands (90+ = A+, 80+ = A, 70+ = B+, and so on) as a general guide — your institution may use different cutoffs.' },
    { question: 'How is GPA estimated from percentage?', answer: 'It divides the percentage by 9.5 as an estimate — a conversion used by some institutions on a 10-point scale, capped at a maximum GPA of 10. This is not universal; check your institution\'s official formula for anything that needs to be exact.' },
    { question: 'Can I use this for CGPA subjects?', answer: 'This tool is for marks-based percentage. For grade-point-based averages, use the CGPA or SGPA calculator instead.' },
  ],
  related: [
    { label: 'GPA to Percentage', href: '/academic-tools/gpa-to-percentage' },
    { label: 'Semester Percentage Calculator', href: '/academic-tools/semester-percentage-calculator' },
    { label: 'Marks Required Calculator', href: '/academic-tools/marks-required-calculator' },
  ],
};
