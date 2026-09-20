import { useMemo, useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { CalculatorLayout } from '@/components/CalculatorLayout';
import { Card } from '@/components/ui/Card';
import { NumberField } from '@/components/ui/Field';
import { ResultStat } from '@/components/ui/ResultStat';
import { convertGPAToPercentage } from '../logic/calculations';
import { getToolBySlug } from '@/data/toolsRegistry';

const tool = getToolBySlug('gpa-to-percentage')!;

export default function GpaToPercentagePage() {
  const [gpa, setGpa] = useState('');
  const parsed = parseFloat(gpa);
  const valid = gpa !== '' && !isNaN(parsed) && parsed >= 0 && parsed <= 10;
  const percentage = useMemo(() => (valid ? convertGPAToPercentage(parsed) : null), [valid, parsed]);

  return (
    <CalculatorLayout
      toolName={tool.name} tagline={tool.tagline} description={tool.description}
      path="/academic-tools/gpa-to-percentage" icon={ArrowLeftRight}
      breadcrumb={{ label: 'GPA to Percentage' }} article={article}
      resultSummary={percentage !== null ? `GPA ${gpa} → ${percentage.toFixed(2)}%` : ''}
    >
      <Card>
        <div className="max-w-sm">
          <NumberField id="gpa" label="Your GPA (0–10 scale)" placeholder="e.g. 8.4" step="0.01" value={gpa} onChange={(e) => setGpa(e.target.value)} />
          {gpa !== '' && !valid && <p role="alert" className="text-xs text-red-500 mt-2">Enter a GPA between 0 and 10.</p>}
        </div>
        <div className="mt-8 border-t border-navy-100 dark:border-white/10 pt-6">
          <ResultStat label="Equivalent percentage" value={percentage !== null ? `${percentage.toFixed(2)}%` : '—'} />
        </div>
      </Card>
    </CalculatorLayout>
  );
}

const article = {
  intro: 'This converter multiplies your GPA by 9.5 — a conversion formula commonly used by some universities on a 10-point scale — to give you an equivalent percentage figure for applications and transcripts. It\u2019s an estimate, not an official value; treat it as a quick reference, not a substitute for your registrar\u2019s conversion.',
  whyItMatters: 'Some scholarships, employers, and foreign universities ask for a percentage rather than a GPA. A quick, consistent estimate avoids manual arithmetic errors when you need a figure for forms and applications — though for anything official, your institution\u2019s registrar is still the authority.',
  howItWorks: [
    'Enter your GPA on a 0–10 scale.',
    'The tool multiplies your GPA by 9.5.',
    'The result is displayed as your equivalent percentage, capped sensibly at real-world bounds.',
  ],
  examples: [
    { title: 'Typical conversion', body: 'A GPA of 8.4 converts to 8.4 × 9.5 = 79.8%.' },
    { title: 'High GPA', body: 'A GPA of 9.8 converts to 93.1%, near the top of most grading scales.' },
    { title: 'When it matters most', body: 'A foreign university asking for "minimum 75% or equivalent" on an application — converting your 8.1 GPA (77%) tells you whether you clear that bar before you submit, without waiting on a formal transcript conversion.' },
  ],
  mistakes: [
    'Applying the ×9.5 formula to a 4.0-scale GPA — this converter assumes a 10-point scale.',
    'Treating the result as an official transcript value rather than an estimate; always confirm with your institution\'s registrar.',
    'Rounding the GPA before converting, which introduces small errors into the final percentage.',
    'Submitting the converted percentage on an official document without a registrar-issued equivalence certificate, if the receiving institution requires one.',
  ],
  tips: [
    'Confirm which conversion formula your specific university uses — some use different multipliers, and some don\u2019t use a linear multiplier at all.',
    'Use full-precision GPA (e.g. 8.43, not 8.4) for the most accurate percentage.',
    'Pair with the Percentage Calculator if you need to go the other direction, from marks to percentage.',
  ],
  faqs: [
    { question: 'Is the ×9.5 formula universal?', answer: 'No — it is used by some universities on a 10-point scale, but far from all institutions use it. Check your official conversion policy for anything formal.' },
    { question: 'Can I convert a 4.0-scale GPA here?', answer: 'This tool is built for 0–10 scale GPAs. A 4.0-scale GPA needs a different conversion formula.' },
    { question: 'Why is my converted percentage capped?', answer: 'GPA-to-percentage formulas can occasionally exceed 100% for GPAs near the top of the scale; results are capped to stay realistic.' },
    { question: 'Will a foreign university or employer accept this number?', answer: 'Treat it as a planning estimate. For anything submitted officially (visa applications, transcript equivalence, job offers), use an equivalence certificate from your institution\u2019s registrar rather than a self-calculated figure.' },
  ],
  related: [
    { label: 'Percentage Calculator', href: '/academic-tools/percentage-calculator' },
    { label: 'CGPA Calculator', href: '/academic-tools/cgpa-calculator' },
    { label: 'Semester Percentage', href: '/academic-tools/semester-percentage-calculator' },
  ],
};
