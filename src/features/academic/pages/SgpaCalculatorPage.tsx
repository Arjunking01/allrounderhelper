import { useMemo, useState } from 'react';
import { Plus, Trash2, BookOpenCheck } from 'lucide-react';
import { CalculatorLayout } from '@/components/CalculatorLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ResultStat } from '@/components/ui/ResultStat';
import { calculateSGPA, type SubjectEntry } from '../logic/calculations';
import { getToolBySlug } from '@/data/toolsRegistry';

const tool = getToolBySlug('sgpa-calculator')!;

interface Row extends SubjectEntry {
  id: string;
  name: string;
}

const makeRow = (): Row => ({ id: crypto.randomUUID(), name: '', grade: NaN, credit: NaN });

export default function SgpaCalculatorPage() {
  const [rows, setRows] = useState<Row[]>([makeRow(), makeRow(), makeRow()]);
  const sgpa = useMemo(() => calculateSGPA(rows), [rows]);
  const totalCredits = useMemo(() => rows.reduce((s, r) => (isNaN(r.credit) ? s : s + r.credit), 0), [rows]);

  function updateRow(id: string, field: 'grade' | 'credit' | 'name', value: string) {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        if (field === 'name') return { ...r, name: value };
        let parsed = parseFloat(value);
        if (!isNaN(parsed)) parsed = field === 'grade' ? Math.min(10, Math.max(0, parsed)) : Math.max(0, parsed);
        return { ...r, [field]: parsed };
      })
    );
  }

  return (
    <CalculatorLayout
      toolName={tool.name}
      tagline={tool.tagline}
      description={tool.description}
      path="/academic-tools/sgpa-calculator"
      icon={BookOpenCheck}
      breadcrumb={{ label: 'SGPA Calculator' }}
      article={article}
      resultSummary={totalCredits > 0 ? `SGPA: ${sgpa.toFixed(2)} (across ${totalCredits.toFixed(1)} credits)` : ''}
    >
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
          <h2 className="font-semibold text-lg">This semester's subjects</h2>
          <Button variant="outline" size="sm" icon={<Plus size={14} />} onClick={() => setRows((p) => [...p, makeRow()])}>
            Add subject
          </Button>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_40px] gap-3 text-[11px] leading-tight font-medium text-navy-500 dark:text-ink-500 px-1">
            <span>Subject name</span>
            <span>Credits</span>
            <span>Grade Point</span>
            <span />
          </div>
          {rows.map((row, idx) => (
            <div key={row.id} className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_40px] gap-3 items-center">
              <input
                type="text"
                placeholder="Subject name"
                aria-label={`Subject ${idx + 1} name`}
                value={row.name}
                onChange={(e) => updateRow(row.id, 'name', e.target.value)}
                className="w-full rounded-xl border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-4 py-2.5 outline-none focus:border-electric-500 focus:ring-2 focus:ring-electric-500/20"
              />
              <input
                type="number" inputMode="decimal" step="0.01" placeholder="Credits"
                aria-label={`Subject ${idx + 1} credits`}
                value={isNaN(row.credit) ? '' : row.credit}
                onChange={(e) => updateRow(row.id, 'credit', e.target.value)}
                className="w-full rounded-xl border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-4 py-2.5 outline-none focus:border-electric-500 focus:ring-2 focus:ring-electric-500/20"
              />
              <input
                type="number" inputMode="decimal" step="0.01" placeholder="Grade"
                aria-label={`Subject ${idx + 1} grade point`}
                value={isNaN(row.grade) ? '' : row.grade}
                onChange={(e) => updateRow(row.id, 'grade', e.target.value)}
                className="w-full rounded-xl border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-4 py-2.5 outline-none focus:border-electric-500 focus:ring-2 focus:ring-electric-500/20"
              />
              <button
                aria-label="Remove subject"
                onClick={() => setRows((p) => (p.length > 1 ? p.filter((r) => r.id !== row.id) : p))}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-navy-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-2 gap-6 border-t border-navy-100 dark:border-white/10 pt-6">
          <ResultStat label="SGPA" value={sgpa.toFixed(2)} />
          <ResultStat label="Total credits" value={totalCredits.toFixed(1)} tone="emerald" />
        </div>
      </Card>
    </CalculatorLayout>
  );
}

const article = {
  intro:
    'The SGPA calculator computes your Semester Grade Point Average by weighting each subject\'s grade point by its credit value, then dividing by the total credits for that semester alone.',
  whyItMatters:
    'SGPA tells you how one specific semester went, independent of past results — useful for spotting trends, comparing terms, or estimating the effect a semester will have on your overall CGPA before it\'s officially calculated.',
  howItWorks: [
    'List every subject you took this semester.',
    'Enter the credits assigned to each subject.',
    'Enter the grade point earned in each subject.',
    'The tool multiplies grade × credit per subject, sums the totals, and divides by total credits.',
  ],
  examples: [
    { title: 'Three-subject semester', body: 'Credits 4, 3, 3 with grades 9, 7, 8 gives SGPA = (36+21+24)/10 = 8.1.' },
    { title: 'Comparing semesters', body: 'An 8.1 SGPA this term versus a 7.4 SGPA last term shows clear improvement even before your CGPA updates.' },
  ],
  mistakes: [
    'Including subjects from a previous semester by mistake, which turns SGPA into a CGPA-like figure.',
    'Leaving a credit field blank rather than 0, which the calculator excludes rather than treats as zero.',
    'Confusing grade point with raw marks out of 100.',
    'Assuming a strong SGPA this term will move your CGPA by the same amount — it won\'t, since CGPA is weighted across every semester\'s credits, not just this one.',
  ],
  tips: [
    'Calculate SGPA right after results are published to catch data-entry errors early.',
    'Use consistent credit values that match your official transcript.',
    'Pair this with the CGPA calculator to see how the new semester shifts your overall average.',
  ],
  faqs: [
    { question: 'Is SGPA the same as GPA?', answer: 'Yes — SGPA is simply the term some universities use for GPA calculated over a single semester, as opposed to CGPA which spans multiple semesters.' },
    { question: 'Can SGPA be higher than CGPA?', answer: 'Yes. If a semester performs better than your historical average, that semester\'s SGPA can be higher than your cumulative CGPA, and will pull it upward.' },
    { question: 'What credit scale should I use?', answer: 'Always use the credit values published in your official curriculum or transcript — they vary by course and institution.' },
    { question: 'How much will this semester actually change my CGPA?', answer: 'It depends on how many credits you\'ve already completed versus how many are in this semester — the more credits you\'ve already banked, the smaller the effect any single semester has. Use the CGPA calculator with your updated numbers to see the exact shift.' },
  ],
  related: [
    { label: 'CGPA Calculator', href: '/academic-tools/cgpa-calculator' },
    { label: 'GPA to Percentage', href: '/academic-tools/gpa-to-percentage' },
    { label: 'Marks Required Calculator', href: '/academic-tools/marks-required-calculator' },
    { label: 'Semester Planner', href: '/productivity/semester-planner' },
    { label: 'Study Planner', href: '/productivity/study-planner' },
  ],
};
