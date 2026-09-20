import { useMemo, useState } from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { CalculatorLayout } from '@/components/CalculatorLayout';
import { Card } from '@/components/ui/Card';
import { NumberField } from '@/components/ui/Field';
import { ResultStat } from '@/components/ui/ResultStat';
import { calculateAssignmentScore } from '../logic/calculations';
import { getToolBySlug } from '@/data/toolsRegistry';

const tool = getToolBySlug('assignment-score-calculator')!;

export default function AssignmentScorePage() {
  const [obtained, setObtained] = useState('');
  const [total, setTotal] = useState('');
  const [target, setTarget] = useState('');
  const valid = obtained !== '' && total !== '' && parseFloat(total) > 0 && parseFloat(obtained) >= 0 && parseFloat(obtained) <= parseFloat(total);
  const result = useMemo(
    () => (valid ? calculateAssignmentScore(parseFloat(obtained), parseFloat(total), target === '' ? null : parseFloat(target)) : null),
    [obtained, total, target, valid]
  );

  return (
    <CalculatorLayout
      toolName={tool.name} tagline={tool.tagline} description={tool.description}
      path="/academic-tools/assignment-score-calculator" icon={FileSpreadsheet}
      breadcrumb={{ label: 'Assignment Score Calculator' }} article={article}
      resultSummary={result ? `${result.percentage.toFixed(2)}% · Grade: ${result.grade}` : ''}
    >
      <Card>
        <div className="grid sm:grid-cols-3 gap-4">
          <NumberField id="obtained" label="Marks obtained" value={obtained} onChange={(e) => setObtained(e.target.value)} />
          <NumberField id="total" label="Total marks" value={total} onChange={(e) => setTotal(e.target.value)} />
          <NumberField id="target" label="Target percentage (optional)" suffix="%" value={target} onChange={(e) => setTarget(e.target.value)} />
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
          <ResultStat
            label="Target status"
            value={result?.targetAchieved === null || result === null ? '—' : result.targetAchieved ? 'Achieved' : `Need ${result.requiredMarks!.toFixed(2)}`}
            tone={result?.targetAchieved ? 'emerald' : 'brand'}
          />
        </div>
      </Card>
    </CalculatorLayout>
  );
}

const article = {
  intro: 'This tool scores a single assignment as a percentage and letter grade, and checks whether it meets an optional target percentage you set for yourself.',
  whyItMatters: 'Assignments often carry course-weighted credit toward a final grade. Seeing the percentage and grade immediately after marking helps you judge how much a strong or weak assignment will move your overall standing.',
  howItWorks: [
    'Enter the marks you obtained on the assignment.',
    'Enter the total marks the assignment is out of.',
    'Optionally, set a target percentage.',
    'The tool computes percentage, grade, and target status instantly.',
  ],
  examples: [
    { title: 'Target achieved', body: 'Obtained 45/50 = 90%, comfortably above an 80% target — shown as "Achieved".' },
    { title: 'Target missed', body: 'Obtained 28/50 = 56%, below a 70% target — the tool shows the exact total marks (35) needed to hit 70%.' },
    { title: 'Tracking across assignments', body: 'Assignment 1: 90%. Assignment 2: 56%. Rather than treating these as unrelated numbers, use them to see whether your workflow (e.g. time started, resources used) differed between the two — a single low score is normal, a pattern is worth acting on with a study plan.' },
  ],
  mistakes: [
    'Entering obtained marks greater than total marks by mistake.',
    'Setting a target percentage without knowing your course\'s actual grading scale.',
    'Forgetting that "required marks" is a total figure, not extra marks beyond your current score.',
    'Reacting to one weak assignment score as if it were the final grade, when it\'s usually only one component of a larger continuous-assessment total.',
  ],
  tips: [
    'Use this immediately after each assignment is graded to track a running sense of your standing.',
    'If a target is missed, use the required-marks figure to gauge how much harder the next assignment needs to be to compensate.',
    'Cross-check the grade bands against your specific course syllabus, which may differ from the general default used here.',
  ],
  faqs: [
    { question: 'What grade bands does this use?', answer: '90%+ Excellent (A+), 75%+ Very Good (A), 60%+ Good (B), 40%+ Average (C), below 40% Needs Improvement — check your course syllabus, since actual bands vary by institution.' },
    { question: 'Can I leave the target percentage blank?', answer: 'Yes — the tool will still show your percentage and grade without evaluating target status.' },
    { question: 'Does this affect my CGPA directly?', answer: 'Not directly — assignments typically feed into an internal or continuous assessment score, which your institution combines with exams for the final grade.' },
  ],
  related: [
    { label: 'Exam Score Calculator', href: '/academic-tools/exam-score-calculator' },
    { label: 'Marks Required Calculator', href: '/academic-tools/marks-required-calculator' },
    { label: 'Study Planner', href: '/productivity/study-planner' },
  ],
};
