import { useMemo, useState } from 'react';
import { Ruler } from 'lucide-react';
import { CalculatorLayout } from '@/components/CalculatorLayout';
import { Card } from '@/components/ui/Card';
import { NumberField, SelectField } from '@/components/ui/Field';
import { ResultStat } from '@/components/ui/ResultStat';
import { convertUnit, unitOptionsMap, type UnitCategory } from '../logic/calculations';
import { getToolBySlug } from '@/data/toolsRegistry';

const tool = getToolBySlug('unit-converter')!;
const categories = Object.keys(unitOptionsMap) as UnitCategory[];

export default function UnitConverterPage() {
  const [category, setCategory] = useState<UnitCategory>('length');
  const units = Object.keys(unitOptionsMap[category]);
  const [from, setFrom] = useState(units[0]);
  const [to, setTo] = useState(units[1] ?? units[0]);
  const [value, setValue] = useState('1');

  function changeCategory(next: UnitCategory) {
    setCategory(next);
    const nextUnits = Object.keys(unitOptionsMap[next]);
    setFrom(nextUnits[0]);
    setTo(nextUnits[1] ?? nextUnits[0]);
  }

  const result = useMemo(() => {
    const v = parseFloat(value);
    if (isNaN(v)) return null;
    return convertUnit(category, v, from, to);
  }, [category, value, from, to]);

  return (
    <CalculatorLayout
      toolName={tool.name} tagline={tool.tagline} description={tool.description}
      path="/academic-tools/unit-converter" icon={Ruler}
      breadcrumb={{ label: 'Unit Converter' }} article={article}
      resultSummary={result !== null ? `${value} ${unitOptionsMap[category][from]} = ${result.toFixed(4)} ${unitOptionsMap[category][to]}` : ''}
    >
      <Card>
        <SelectField id="category" label="Category" value={category} onChange={(e) => changeCategory(e.target.value as UnitCategory)}>
          {categories.map((c) => (
            <option key={c} value={c}>{c[0].toUpperCase() + c.slice(1)}</option>
          ))}
        </SelectField>

        <div className="grid sm:grid-cols-3 gap-4 mt-4 items-end">
          <NumberField id="value" label="Value" value={value} onChange={(e) => setValue(e.target.value)} />
          <SelectField id="from" label="From" value={from} onChange={(e) => setFrom(e.target.value)}>
            {units.map((u) => (
              <option key={u} value={u}>{unitOptionsMap[category][u]}</option>
            ))}
          </SelectField>
          <SelectField id="to" label="To" value={to} onChange={(e) => setTo(e.target.value)}>
            {units.map((u) => (
              <option key={u} value={u}>{unitOptionsMap[category][u]}</option>
            ))}
          </SelectField>
        </div>

        <div className="mt-8 border-t border-navy-100 dark:border-white/10 pt-6">
          <ResultStat label="Converted value" value={result !== null ? result.toFixed(4) : '—'} />
        </div>
      </Card>
    </CalculatorLayout>
  );
}

const article = {
  intro: 'A fast unit converter covering length, weight, temperature, area, and volume — the categories students run into most often across science, engineering, and everyday coursework.',
  whyItMatters: 'Switching between metric and imperial units, or converting temperature scales for a lab report, is a common source of small errors. A reliable converter removes that friction.',
  howItWorks: [
    'Choose a category: length, weight, temperature, area, or volume.',
    'Enter the value you want to convert.',
    'Choose the unit you\'re converting from and the unit you\'re converting to.',
    'The result updates instantly using precise conversion factors.',
  ],
  examples: [
    { title: 'Length', body: '5 kilometers converts to 3.107 miles.' },
    { title: 'Temperature', body: '100°C converts to 212°F, using the exact linear temperature formula rather than a simple ratio.' },
    { title: 'Area vs. volume mix-up', body: 'A room listed as 15 square meters and a container listed as 15 cubic meters are not comparable at all — one is a flat surface, the other is a space you could fill. Converting a value into the wrong dimension (say, treating cm³ like cm²) gives a nonsensical result even though the arithmetic runs fine.' },
  ],
  mistakes: [
    'Assuming temperature converts with the same multiply-and-divide logic as length or weight — it requires an offset, not just a ratio.',
    'Mixing up area and volume units, which look similar but scale very differently (squared versus cubed).',
    'Rounding too early in multi-step conversions, which compounds small errors.',
  ],
  tips: [
    'For temperature, always double check whether you need Celsius, Fahrenheit, or Kelvin for your specific report or formula.',
    'Keep at least 2–4 decimal places for scientific work; round only in your final written answer.',
    'Use consistent units throughout a calculation rather than converting midway.',
  ],
  faqs: [
    { question: 'How accurate are the conversion factors?', answer: 'The tool uses standard internationally recognised conversion factors (e.g. 1 mile = 1609.344 meters) for precise results.' },
    { question: 'Can I convert between categories, like length to weight?', answer: 'No — unit conversion only makes sense within the same physical quantity, so categories are kept separate.' },
    { question: 'Why does temperature need special handling?', answer: 'Temperature scales have different zero points, so converting requires an offset calculation rather than a simple multiplication factor.' },
  ],
  related: [
    { label: 'Scientific Calculator', href: '/academic-tools/scientific-calculator' },
    { label: 'Percentage Calculator', href: '/academic-tools/percentage-calculator' },
  ],
};
