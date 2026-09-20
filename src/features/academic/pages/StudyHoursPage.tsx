import { useMemo, useState } from 'react';
import { Timer } from 'lucide-react';
import { CalculatorLayout } from '@/components/CalculatorLayout';
import { Card } from '@/components/ui/Card';
import { NumberField } from '@/components/ui/Field';
import { ResultStat } from '@/components/ui/ResultStat';
import { calculateStudyHours } from '../logic/calculations';
import { getToolBySlug } from '@/data/toolsRegistry';

const tool = getToolBySlug('study-hours-calculator')!;

export default function StudyHoursPage() {
  const [hoursPerDay, setHoursPerDay] = useState('');
  const [daysPerWeek, setDaysPerWeek] = useState('');
  const valid = hoursPerDay !== '' && daysPerWeek !== '' && parseFloat(hoursPerDay) > 0 && parseFloat(hoursPerDay) <= 24 && parseFloat(daysPerWeek) > 0 && parseFloat(daysPerWeek) <= 7;
  const result = useMemo(() => (valid ? calculateStudyHours(parseFloat(hoursPerDay), parseFloat(daysPerWeek)) : null), [hoursPerDay, daysPerWeek, valid]);

  return (
    <CalculatorLayout
      toolName={tool.name} tagline={tool.tagline} description={tool.description}
      path="/academic-tools/study-hours-calculator" icon={Timer}
      breadcrumb={{ label: 'Study Hours Calculator' }} article={article}
      resultSummary={result ? `Weekly ${result.weekly.toFixed(1)}h · Monthly ${result.monthly.toFixed(1)}h · Yearly ${result.yearly.toFixed(1)}h` : ''}
    >
      <Card>
        <div className="grid sm:grid-cols-2 gap-4">
          <NumberField id="hoursPerDay" label="Hours studied per day" suffix="hrs" value={hoursPerDay} onChange={(e) => setHoursPerDay(e.target.value)} />
          <NumberField id="daysPerWeek" label="Study days per week" max={7} value={daysPerWeek} onChange={(e) => setDaysPerWeek(e.target.value)} />
        </div>
        {hoursPerDay !== '' && daysPerWeek !== '' && !valid && (
          <p role="alert" className="text-xs text-red-500 mt-3">Enter hours per day between 0 and 24, and days per week between 0 and 7.</p>
        )}
        <div className="mt-8 grid sm:grid-cols-3 gap-6 border-t border-navy-100 dark:border-white/10 pt-6">
          <ResultStat label="Weekly hours" value={result ? result.weekly.toFixed(1) : '—'} />
          <ResultStat label="Monthly hours" value={result ? result.monthly.toFixed(1) : '—'} tone="violet" />
          <ResultStat label="Yearly hours" value={result ? result.yearly.toFixed(1) : '—'} tone="emerald" />
        </div>
      </Card>
    </CalculatorLayout>
  );
}

const article = {
  intro: 'This calculator projects your total study time across a week, month, and year based on a simple daily study routine you enter.',
  whyItMatters: 'Seeing daily habits scaled up to a yearly total makes small, consistent study sessions feel more concrete — two hours a day adds up to over 700 hours a year, a number that\'s easy to underestimate.',
  howItWorks: [
    'Enter how many hours you typically study per day.',
    'Enter how many days per week you study.',
    'The tool multiplies these to get weekly hours, then scales to monthly (×4) and yearly (×52) totals.',
  ],
  examples: [
    { title: 'Moderate routine', body: '2 hours a day, 5 days a week = 10 weekly hours, 40 monthly hours, 520 yearly hours.' },
    { title: 'Intensive routine', body: '4 hours a day, 6 days a week = 24 weekly hours, 96 monthly hours, 1,248 yearly hours.' },
    { title: 'Same total, different shape', body: '2 hours × 7 days and 3.5 hours × 4 days both land close to 14 weekly hours — the yearly total looks similar, but daily consistency versus fewer longer sessions can feel very different to sustain. Use this to sanity-check a routine against your actual attention span, not just the total number.' },
  ],
  mistakes: [
    'Counting time spent in class as "study time" rather than independent revision or practice.',
    'Overestimating daily hours — track actual focused time for a week before entering a figure here.',
    'Ignoring exam periods where study hours spike well above a typical week.',
    'Treating the yearly total as a target rather than a projection — it\'s meant to show you where a routine leads, not to become pressure on its own.',
  ],
  tips: [
    'Use the Pomodoro Timer or Focus Mode in Productivity Tools to track real focused study time in sessions rather than estimating a daily figure from memory.',
    'Recalculate at the start of each semester as your course load changes.',
    'Compare your yearly total against course credit hours to sanity-check whether you\'re investing enough time per credit.',
  ],
  faqs: [
    { question: 'Why is monthly calculated as weekly × 4?', answer: 'It is a simple approximation using four weeks per month; actual months vary between about 4.0 and 4.4 weeks.' },
    { question: 'Does this include class or lecture time?', answer: 'No — this tool is meant for independent study time. Add class hours separately if you want a combined total.' },
    { question: 'What is a realistic daily study target?', answer: 'This varies by course and individual, but many students find 2–4 focused hours per day, broken into sessions, sustainable long-term.' },
  ],
  related: [
    { label: 'Deadline Calculator', href: '/academic-tools/deadline-calculator' },
    { label: 'Budget Planner', href: '/academic-tools/budget-planner' },
    { label: 'Pomodoro Timer', href: '/productivity/pomodoro-timer' },
    { label: 'Focus Mode', href: '/productivity/focus-mode' },
  ],
};
