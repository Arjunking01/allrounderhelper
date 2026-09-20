import { useMemo, useState } from 'react';
import { PiggyBank } from 'lucide-react';
import { CalculatorLayout } from '@/components/CalculatorLayout';
import { Card, SoftCard } from '@/components/ui/Card';
import { NumberField } from '@/components/ui/Field';
import { ResultStat } from '@/components/ui/ResultStat';
import { calculateBudget } from '../logic/calculations';
import { getToolBySlug } from '@/data/toolsRegistry';

const tool = getToolBySlug('budget-planner')!;

export default function BudgetPlannerPage() {
  const [income, setIncome] = useState('');
  const [needs, setNeeds] = useState('');
  const [wants, setWants] = useState('');
  const [savings, setSavings] = useState('');

  const result = useMemo(
    () => calculateBudget({
      income: parseFloat(income) || 0,
      needs: parseFloat(needs) || 0,
      wants: parseFloat(wants) || 0,
      savings: parseFloat(savings) || 0,
    }),
    [income, needs, wants, savings]
  );

  return (
    <CalculatorLayout
      toolName={tool.name} tagline={tool.tagline} description={tool.description}
      path="/academic-tools/budget-planner" icon={PiggyBank}
      breadcrumb={{ label: 'Student Budget Planner' }} article={article}
      resultSummary={income !== '' ? `Remaining: ${result.remaining.toFixed(2)} · Needs ${result.needsPercent.toFixed(0)}% · Wants ${result.wantsPercent.toFixed(0)}% · Savings ${result.savingsPercent.toFixed(0)}%` : ''}
    >
      <Card>
        <div className="grid sm:grid-cols-2 gap-4">
          <NumberField id="income" label="Monthly income" value={income} onChange={(e) => setIncome(e.target.value)} />
          <NumberField id="needs" label="Needs (rent, food, transport)" value={needs} onChange={(e) => setNeeds(e.target.value)} />
          <NumberField id="wants" label="Wants (entertainment, dining out)" value={wants} onChange={(e) => setWants(e.target.value)} />
          <NumberField id="savings" label="Savings / investments" value={savings} onChange={(e) => setSavings(e.target.value)} />
        </div>

        <div className="mt-8 grid sm:grid-cols-2 gap-6 border-t border-navy-100 dark:border-white/10 pt-6">
          <ResultStat label="Remaining balance" value={result.remaining.toFixed(2)} tone={result.remaining >= 0 ? 'emerald' : 'brand'} />
          <ResultStat label="Total allocated" value={result.totalExpenses.toFixed(2)} />
        </div>

        <div className="mt-6 grid sm:grid-cols-3 gap-4">
          <SoftCard>
            <p className="text-xs text-navy-500 dark:text-ink-500 mb-1">Needs</p>
            <p className="font-semibold">{result.needsPercent.toFixed(0)}% <span className="text-xs font-normal text-navy-400">(target 50%)</span></p>
          </SoftCard>
          <SoftCard>
            <p className="text-xs text-navy-500 dark:text-ink-500 mb-1">Wants</p>
            <p className="font-semibold">{result.wantsPercent.toFixed(0)}% <span className="text-xs font-normal text-navy-400">(target 30%)</span></p>
          </SoftCard>
          <SoftCard>
            <p className="text-xs text-navy-500 dark:text-ink-500 mb-1">Savings</p>
            <p className="font-semibold">{result.savingsPercent.toFixed(0)}% <span className="text-xs font-normal text-navy-400">(target 20%)</span></p>
          </SoftCard>
        </div>
      </Card>
    </CalculatorLayout>
  );
}

const article = {
  intro: 'This planner splits your monthly income across needs, wants, and savings, then compares your actual allocation against the widely used 50/30/20 budgeting rule.',
  whyItMatters: 'Most students juggle irregular income from allowances, part-time work, or scholarships. A simple visual split helps you see overspending before it becomes a problem, rather than after.',
  howItWorks: [
    'Enter your total monthly income from all sources.',
    'Enter your planned or actual spending on needs, wants, and savings.',
    'The tool totals your expenses and shows your remaining balance.',
    'Each category is compared against the recommended 50/30/20 split.',
  ],
  examples: [
    { title: 'Balanced month', body: 'Income ₹20,000 with needs ₹10,000, wants ₹6,000, savings ₹4,000 — a near-perfect 50/30/20 split.' },
    { title: 'Overspending', body: 'Income ₹15,000 with needs ₹8,000, wants ₹6,000, savings ₹3,000 totals ₹17,000 — a negative remaining balance flags the overspend immediately.' },
    { title: 'Irregular income month', body: 'A month with a one-time scholarship deposit on top of a usual allowance can make the 50/30/20 split misleading — a large one-off inflow isn\'t really "needs money," so it\'s often more useful to route it mostly to savings for the leaner months rather than scaling up regular spending to match it.' },
  ],
  mistakes: [
    'Forgetting irregular costs like textbooks or exam fees, which then show up as unplanned "wants" spending later.',
    'Treating debt repayment as a "want" rather than a "need", which understates essential obligations.',
    'Not revisiting the budget monthly as income or costs change.',
    'Scaling up regular spending after a one-time income boost (like a scholarship deposit) instead of treating it as a separate savings opportunity.',
  ],
  tips: [
    'Track actual spending for one month before setting targets, so your categories reflect reality.',
    'Treat savings as a fixed "need" you pay first, not whatever is left over.',
    'Revisit this planner at the start of every month or semester.',
  ],
  faqs: [
    { question: 'What is the 50/30/20 rule?', answer: 'A budgeting guideline that allocates 50% of income to needs, 30% to wants, and 20% to savings or debt repayment.' },
    { question: 'What counts as a "need" versus a "want"?', answer: 'Needs are essential costs like rent, groceries, and transport. Wants are discretionary spending like entertainment, subscriptions, and dining out.' },
    { question: 'What if my remaining balance is negative?', answer: 'It means your planned needs, wants, and savings exceed your income — reduce discretionary "wants" spending first.' },
  ],
  related: [
    { label: 'Study Hours Calculator', href: '/academic-tools/study-hours-calculator' },
    { label: 'Deadline Calculator', href: '/academic-tools/deadline-calculator' },
  ],
};
