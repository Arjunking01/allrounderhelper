import { useState } from 'react';
import { Calculator, Delete } from 'lucide-react';
import { CalculatorLayout } from '@/components/CalculatorLayout';
import { Card } from '@/components/ui/Card';
import { evaluateScientificExpression } from '../logic/calculations';
import { getToolBySlug } from '@/data/toolsRegistry';

const tool = getToolBySlug('scientific-calculator')!;

const KEYS: string[] = [
  '(', ')', '√', '^',
  '7', '8', '9', '/',
  '4', '5', '6', '*',
  '1', '2', '3', '-',
  '0', '.', 'π', '+',
];

export default function ScientificCalculatorPage() {
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState(false);

  function press(key: string) {
    setExpression((prev) => prev + key);
  }

  function evaluate() {
    try {
      const value = evaluateScientificExpression(expression);
      setResult(String(Math.round(value * 1e10) / 1e10));
      setError(false);
    } catch {
      setResult('Error');
      setError(true);
    }
  }

  function clearAll() {
    setExpression('');
    setResult('');
    setError(false);
  }

  function backspace() {
    setExpression((prev) => prev.slice(0, -1));
  }

  return (
    <CalculatorLayout
      toolName={tool.name} tagline={tool.tagline} description={tool.description}
      path="/academic-tools/scientific-calculator" icon={Calculator}
      breadcrumb={{ label: 'Scientific Calculator' }} article={article}
      resultSummary={result && !error ? `${expression} = ${result}` : ''}
    >
      <Card className="max-w-md">
        <div className="rounded-2xl bg-navy-900 dark:bg-black/40 p-5 mb-5 text-right">
          <p className="text-navy-400 text-sm font-mono min-h-[1.25rem] break-all">{expression || '0'}</p>
          <p role="status" aria-live="polite" className={`text-3xl font-mono font-semibold mt-1 break-all ${error ? 'text-red-400' : 'text-white'}`}>
            {result || '\u00A0'}
          </p>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-2">
          <button onClick={clearAll} className="col-span-2 rounded-xl bg-red-500/10 text-red-500 font-semibold py-3 hover:bg-red-500/20 transition-colors">AC</button>
          <button onClick={backspace} aria-label="Backspace" className="flex items-center justify-center rounded-xl bg-navy-100 dark:bg-white/10 py-3 hover:bg-navy-200 dark:hover:bg-white/20 transition-colors">
            <Delete size={16} />
          </button>
          <button onClick={evaluate} className="rounded-xl gradient-brand text-white font-semibold py-3">=</button>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {KEYS.map((key) => (
            <button
              key={key}
              onClick={() => press(key)}
              className="rounded-xl border border-navy-200 dark:border-white/10 py-3 font-medium hover:border-electric-500 hover:text-electric-500 transition-colors"
            >
              {key}
            </button>
          ))}
        </div>
      </Card>
    </CalculatorLayout>
  );
}

const article = {
  intro: 'A browser-based scientific calculator that supports standard arithmetic, parentheses, square roots, powers, and the constant π — enough for everyday coursework without installing anything or switching apps.',
  whyItMatters: 'A quick, always-available calculator saves time during homework, lab reports, or exam revision, especially on a phone where a physical calculator isn\'t always at hand. Because it runs entirely in the browser, there\'s nothing to install and no account needed — open the page and start calculating.',
  howItWorks: [
    'Tap number and operator keys to build an expression, shown in the display above the keypad.',
    'Use √ for square root and ^ for powers — both take the following parenthesised or single-digit value.',
    'Use π to insert the value of pi directly into an expression.',
    'Press = to evaluate the expression and show the result underneath it.',
    'Use the delete key to remove the last character you entered, or AC to clear the whole expression and start over.',
  ],
  examples: [
    { title: 'Powers', body: '2^10 evaluates to 1024.' },
    { title: 'Roots and parentheses', body: '√(64) evaluates to 8, and (3+2)*4 evaluates to 20.' },
    { title: 'Using pi', body: '2*π evaluates to roughly 6.2832 — useful for quick circumference or radian conversions.' },
  ],
  mistakes: [
    'Leaving a parenthesis unclosed, which the calculator will flag as an error rather than guessing what you meant.',
    'Chaining operators without a number between them, e.g. "5*+2".',
    'Dividing by zero — this returns an error rather than infinity.',
    'Expecting memory keys (M+, MR) or graphing functions — this tool covers standard scientific arithmetic only, not a graphing or programmable calculator.',
  ],
  tips: [
    'Use π directly in expressions, e.g. "2*π" for circumference-style calculations, instead of typing out 3.14159.',
    'Build a full expression in one go rather than evaluating after every step and re-typing the result, so you don\'t lose precision to intermediate rounding.',
    'Use the backspace key to correct a single mistyped character instead of clearing the whole expression with AC.',
    'If you need to save a result for later, copy it into the Notes tool rather than relying on the calculator to remember it.',
  ],
  faqs: [
    { question: 'Does this calculator support trigonometric functions?', answer: 'The current version covers arithmetic, powers, roots, and π. Trigonometric functions aren\'t available yet.' },
    { question: 'Is my calculation history saved?', answer: 'No — each session starts fresh and previous expressions aren\'t kept once you clear or leave the page. If you want to keep a result, copy it into the Notes tool, which does save automatically.' },
    { question: 'Why do I see "Error"?', answer: 'This means the expression is incomplete or invalid — commonly an unmatched parenthesis, an operator with no number after it, or a division by zero.' },
    { question: 'Can I type the expression with a keyboard instead of tapping the on-screen keys?', answer: 'The calculator is built around the on-screen keypad, so expressions are entered by tapping keys rather than typing free text.' },
  ],
  related: [
    { label: 'Unit Converter', href: '/academic-tools/unit-converter' },
    { label: 'Percentage Calculator', href: '/academic-tools/percentage-calculator' },
  ],
};
