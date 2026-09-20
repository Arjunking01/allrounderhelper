import { useMemo, useState } from 'react';
import { Plus, Trash2, GraduationCap } from 'lucide-react';
import { CalculatorLayout } from '@/components/CalculatorLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ResultStat } from '@/components/ui/ResultStat';
import { calculateCGPA, type SubjectEntry } from '../logic/calculations';
import { getToolBySlug } from '@/data/toolsRegistry';

const tool = getToolBySlug('cgpa-calculator')!;

interface Row extends SubjectEntry {
  id: string;
}

const makeRow = (): Row => ({ id: crypto.randomUUID(), grade: NaN, credit: NaN });

export default function CgpaCalculatorPage() {
  const [rows, setRows] = useState<Row[]>([makeRow(), makeRow(), makeRow()]);

  const cgpa = useMemo(() => calculateCGPA(rows), [rows]);
  const totalCredits = useMemo(
    () => rows.reduce((sum, r) => (isNaN(r.credit) ? sum : sum + r.credit), 0),
    [rows]
  );

  function updateRow(id: string, field: 'grade' | 'credit', value: string) {
    let parsed = parseFloat(value);
    if (!isNaN(parsed)) {
      if (field === 'grade') parsed = Math.min(10, Math.max(0, parsed));
      else parsed = Math.max(0, parsed);
    }
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: parsed } : r)));
  }

  return (
    <CalculatorLayout
      toolName={tool.name}
      tagline={tool.tagline}
      description={tool.description}
      path="/academic-tools/cgpa-calculator"
      icon={GraduationCap}
      breadcrumb={{ label: 'CGPA Calculator' }}
      article={article}
      resultSummary={totalCredits > 0 ? `CGPA: ${cgpa.toFixed(2)} (across ${totalCredits.toFixed(1)} credits)` : ''}
    >
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
          <h2 className="font-semibold text-lg">Your subjects</h2>
          <Button
            variant="outline"
            size="sm"
            icon={<Plus size={14} />}
            onClick={() => setRows((prev) => [...prev, makeRow()])}
          >
            Add subject
          </Button>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_40px] gap-3 text-[11px] leading-tight font-medium text-navy-500 dark:text-ink-500 px-1">
            <span>Grade Point (0–10)</span>
            <span>Credits</span>
            <span />
          </div>
          {rows.map((row, idx) => (
            <div key={row.id} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_40px] gap-3 items-center">
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min={0}
                max={10}
                placeholder="Grade Point"
                aria-label={`Subject ${idx + 1} grade point (0 to 10)`}
                value={isNaN(row.grade) ? '' : row.grade}
                onChange={(e) => updateRow(row.id, 'grade', e.target.value)}
                className="w-full rounded-xl border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-4 py-2.5 outline-none focus:border-electric-500 focus:ring-2 focus:ring-electric-500/20"
              />
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min={0}
                placeholder="Credits"
                aria-label={`Subject ${idx + 1} credits`}
                value={isNaN(row.credit) ? '' : row.credit}
                onChange={(e) => updateRow(row.id, 'credit', e.target.value)}
                className="w-full rounded-xl border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-4 py-2.5 outline-none focus:border-electric-500 focus:ring-2 focus:ring-electric-500/20"
              />
              <button
                aria-label="Remove subject"
                onClick={() => setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== row.id) : prev))}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-navy-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-2 gap-6 border-t border-navy-100 dark:border-white/10 pt-6">
          <ResultStat label="CGPA" value={cgpa.toFixed(2)} />
          <ResultStat label="Total credits" value={totalCredits.toFixed(1)} tone="emerald" />
        </div>
      </Card>
    </CalculatorLayout>
  );
}

const article = {
  intro:
    'The CGPA calculator adds up the grade points you earned in every subject, weights each one by its credit value, and divides by your total credits to give a single cumulative grade point average across semesters. It\u2019s the same arithmetic your university\u2019s exam cell runs on your official transcript — this tool just lets you check it, or project it forward, before results are officially published.',
  whyItMatters:
    'CGPA is the number most universities, employers, and scholarship committees look at first — often before they read anything else on your transcript. Knowing it precisely, and knowing how one more subject or one more semester will move it, helps you set realistic targets each semester instead of guessing after results come out, when it\u2019s too late to act on the number.',
  howItWorks: [
    'Enter the grade point you earned for each completed subject, on your institution\'s scale (commonly 0–10).',
    'Enter the credit value assigned to that subject — this is usually printed on your syllabus or marksheet, not the same as the number of hours in class.',
    'Add a row for every subject across the semesters you want included.',
    'The calculator multiplies each grade point by its credits, sums the results, and divides by total credits.',
  ],
  examples: [
    {
      title: 'Two subjects',
      body: 'Subject A: grade 8, 4 credits. Subject B: grade 9, 3 credits. CGPA = (8×4 + 9×3) / (4+3) = 59/7 = 8.43.',
    },
    {
      title: 'Weighting effect',
      body: 'A high grade in a low-credit subject moves your CGPA less than the same grade in a high-credit subject — credits act as weights, not just a count.',
    },
    {
      title: 'Projecting a target CGPA',
      body: 'If you\u2019ve completed 60 credits at a 7.5 average and have 20 credits left this semester, hitting an 8.0 average this semester only moves your CGPA to about (60×7.5 + 20×8.0)/80 = 7.63 — later semesters carry less weight simply because more total credits exist by then.',
    },
  ],
  mistakes: [
    'Mixing up grade points and raw marks — CGPA uses grade points, not percentages.',
    'Forgetting to include a subject\'s credit value, which silently skews the average.',
    'Averaging semester GPAs directly instead of weighting by each semester\'s total credits.',
    'Assuming a low grade in an early semester is impossible to recover from — it can still be diluted by enough later credits, just not erased.',
  ],
  tips: [
    'Double-check your institution\'s grade point scale before entering values — most use 0–10, some use 0–4.',
    'Keep a running subject list each semester so your CGPA updates automatically as results are published.',
    'Use the SGPA calculator first if you only need one semester\'s figure.',
    'If you\u2019re projecting a future CGPA, use your officially completed credits as the fixed part and treat the upcoming semester\'s grades as the variable — don\u2019t guess both.',
  ],
  faqs: [
    {
      question: 'What is the difference between CGPA and SGPA?',
      answer: 'SGPA is your grade point average for a single semester. CGPA is the cumulative average across all completed semesters, weighted by credits.',
    },
    {
      question: 'How do I convert CGPA to a percentage?',
      answer: 'There is no single universal formula — conversion rules vary by university. A ×9.5 multiplier is common at some Indian institutions on a 10-point scale, but not all use it. Use the GPA to Percentage tool for a quick estimate, and check your institution\u2019s official conversion policy for anything formal like a job application or transcript request.',
    },
    {
      question: 'Does a failed subject affect my CGPA?',
      answer: 'Yes — a failing grade point still carries its credit weight and lowers the overall average until it is repeated and replaced, if your institution allows that.',
    },
    {
      question: 'Why did my CGPA barely move even though I did much better this semester?',
      answer: 'CGPA is weighted by total credits across all completed semesters, so a strong single semester has a smaller effect on the cumulative figure the more semesters (and credits) you\u2019ve already completed. This is expected, not a calculation error.',
    },
  ],
  related: [
    { label: 'SGPA Calculator', href: '/academic-tools/sgpa-calculator' },
    { label: 'GPA to Percentage', href: '/academic-tools/gpa-to-percentage' },
    { label: 'Semester Percentage', href: '/academic-tools/semester-percentage-calculator' },
    { label: 'Semester Planner', href: '/productivity/semester-planner' },
    { label: 'Study Planner', href: '/productivity/study-planner' },
  ],
};
