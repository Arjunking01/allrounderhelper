// Pure, typed calculation functions ported from the legacy ALL ROUNDER CALCULATOR project.
// No DOM access — safe for unit testing and reuse across the new UI.

export interface SubjectEntry {
  grade: number;
  credit: number;
}

export function calculateCGPA(subjects: SubjectEntry[]): number {
  let totalPoints = 0;
  let totalCredits = 0;
  for (const s of subjects) {
    if (!isNaN(s.grade) && !isNaN(s.credit)) {
      totalPoints += s.grade * s.credit;
      totalCredits += s.credit;
    }
  }
  return totalCredits === 0 ? 0 : totalPoints / totalCredits;
}

export function calculateSGPA(subjects: SubjectEntry[]): number {
  return calculateCGPA(subjects);
}

export interface AttendanceResult {
  currentPercent: number;
  canMiss: number;
  needToAttend: number;
}

export function calculateAttendance(attended: number, total: number, target: number): AttendanceResult {
  let currentPercent = 0;
  let canMiss = 0;
  let needToAttend = 0;

  if (!isNaN(attended) && !isNaN(total) && total > 0) {
    currentPercent = (attended / total) * 100;
  }

  if (!isNaN(attended) && !isNaN(total) && !isNaN(target) && target > 0 && target < 100) {
    const maxTotal = Math.floor(attended / (target / 100));
    canMiss = Math.max(0, maxTotal - total);

    const numerator = (target / 100) * total - attended;
    const denominator = 1 - target / 100;
    const need = numerator / denominator;
    needToAttend = need > 0 ? Math.ceil(need) : 0;
  }

  return { currentPercent, canMiss, needToAttend };
}

export interface PercentageResult {
  percentage: number;
  grade: string;
  gpa: number;
}

export function calculatePercentage(obtained: number, total: number): PercentageResult {
  const percentage = (obtained / total) * 100;
  let grade = 'F';
  if (percentage >= 90) grade = 'A+';
  else if (percentage >= 80) grade = 'A';
  else if (percentage >= 70) grade = 'B+';
  else if (percentage >= 60) grade = 'B';
  else if (percentage >= 50) grade = 'C';
  else if (percentage >= 40) grade = 'D';

  let gpa = percentage / 9.5;
  if (gpa > 10) gpa = 10;

  return { percentage, grade, gpa };
}

export function convertGPAToPercentage(gpa: number): number {
  return gpa * 9.5;
}

export function convertPercentageToGPA(percentage: number): number {
  return Math.min(percentage / 9.5, 10);
}

export interface SemesterResult {
  percentage: number;
  performance: string;
}

export function calculateSemesterPercentage(obtained: number, maximum: number): SemesterResult {
  const percentage = (obtained / maximum) * 100;
  let performance = 'Needs Improvement';
  if (percentage >= 90) performance = 'Excellent';
  else if (percentage >= 75) performance = 'Very Good';
  else if (percentage >= 60) performance = 'Good';
  else if (percentage >= 40) performance = 'Average';
  return { percentage, performance };
}

export interface MarksRequiredResult {
  currentPercentage: number;
  requiredMarks: number | null;
  /** 'Pass'/'Fail' is the generic 40% baseline, only meaningful when no target was set.
   *  Once a target is set, status instead reflects progress toward *that* target — a
   *  generic-baseline "Pass" next to an unmet target would tell the student they're fine
   *  when they're actually still short of the number they asked about. */
  status: 'Pass' | 'Fail' | 'On Target' | 'Below Target';
}

export function calculateMarksRequired(current: number, total: number, target: number | null): MarksRequiredResult {
  const currentPercentage = (current / total) * 100;
  const hasTarget = target !== null && !isNaN(target);
  const requiredMarks = hasTarget ? Math.ceil((target / 100) * total) : null;
  const status: MarksRequiredResult['status'] = hasTarget
    ? current >= requiredMarks!
      ? 'On Target'
      : 'Below Target'
    : currentPercentage >= 40
      ? 'Pass'
      : 'Fail';
  return { currentPercentage, requiredMarks, status };
}

export interface AssignmentResult {
  percentage: number;
  grade: string;
  targetAchieved: boolean | null;
  requiredMarks: number | null;
}

export function calculateAssignmentScore(obtained: number, total: number, target: number | null): AssignmentResult {
  const percentage = (obtained / total) * 100;
  let grade = 'Needs Improvement';
  if (percentage >= 90) grade = 'Excellent (A+)';
  else if (percentage >= 75) grade = 'Very Good (A)';
  else if (percentage >= 60) grade = 'Good (B)';
  else if (percentage >= 40) grade = 'Average (C)';

  let targetAchieved: boolean | null = null;
  let requiredMarks: number | null = null;
  if (target !== null && !isNaN(target)) {
    targetAchieved = percentage >= target;
    if (!targetAchieved) requiredMarks = (total * target) / 100;
  }

  return { percentage, grade, targetAchieved, requiredMarks };
}

export interface ExamScoreResult {
  percentage: number;
  grade: string;
  status: 'PASS' | 'FAIL' | 'Not Evaluated';
}

export function calculateExamScore(obtained: number, total: number, passing: number | null): ExamScoreResult {
  const percentage = (obtained / total) * 100;
  let grade = 'F';
  if (percentage >= 90) grade = 'A+';
  else if (percentage >= 80) grade = 'A';
  else if (percentage >= 70) grade = 'B+';
  else if (percentage >= 60) grade = 'B';
  else if (percentage >= 50) grade = 'C';
  else if (percentage >= 40) grade = 'D';

  let status: 'PASS' | 'FAIL' | 'Not Evaluated' = 'Not Evaluated';
  if (passing !== null && !isNaN(passing)) {
    status = obtained >= passing ? 'PASS' : 'FAIL';
  }

  return { percentage, grade, status };
}

export interface StudyHoursResult {
  weekly: number;
  monthly: number;
  yearly: number;
}

export function calculateStudyHours(hoursPerDay: number, daysPerWeek: number): StudyHoursResult {
  const weekly = hoursPerDay * daysPerWeek;
  return { weekly, monthly: weekly * 4, yearly: weekly * 52 };
}

export interface DeadlineResult {
  days: number;
  hours: number;
  minutes: number;
  passed: boolean;
}

export function calculateDeadline(deadlineIso: string): DeadlineResult {
  const deadlineTime = new Date(deadlineIso).getTime();
  const currentTime = Date.now();
  const difference = deadlineTime - currentTime;

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, passed: true };
  }

  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

  return { days, hours, minutes, passed: false };
}

// --- Unit converter ---

export type UnitCategory = 'length' | 'weight' | 'temperature' | 'area' | 'volume';

export const unitOptionsMap: Record<UnitCategory, Record<string, string>> = {
  length: { meter: 'Meter', kilometer: 'Kilometer', centimeter: 'Centimeter', mile: 'Mile', foot: 'Foot', inch: 'Inch' },
  weight: { kilogram: 'Kilogram', gram: 'Gram', pound: 'Pound', ounce: 'Ounce' },
  temperature: { celsius: 'Celsius', fahrenheit: 'Fahrenheit', kelvin: 'Kelvin' },
  area: { squaremeter: 'Square Meter', squarekilometer: 'Square Kilometer', squarefoot: 'Square Foot', acre: 'Acre' },
  volume: { liter: 'Liter', milliliter: 'Milliliter', cubicmeter: 'Cubic Meter', gallon: 'US Gallon' },
};

const lengthFactors: Record<string, number> = {
  meter: 1, kilometer: 1000, centimeter: 0.01, mile: 1609.344, foot: 0.3048, inch: 0.0254,
};
const weightFactors: Record<string, number> = {
  kilogram: 1, gram: 0.001, pound: 0.453592, ounce: 0.0283495,
};
const areaFactors: Record<string, number> = {
  squaremeter: 1, squarekilometer: 1_000_000, squarefoot: 0.092903, acre: 4046.86,
};
const volumeFactors: Record<string, number> = {
  liter: 1, milliliter: 0.001, cubicmeter: 1000, gallon: 3.78541,
};

function convertViaCelsius(value: number, from: string, to: string): number {
  if (from === to) return value;
  let celsius: number;
  if (from === 'celsius') celsius = value;
  else if (from === 'fahrenheit') celsius = (value - 32) * (5 / 9);
  else celsius = value - 273.15; // kelvin

  if (to === 'celsius') return celsius;
  if (to === 'fahrenheit') return celsius * (9 / 5) + 32;
  return celsius + 273.15; // kelvin
}

export function convertUnit(category: UnitCategory, value: number, from: string, to: string): number {
  if (category === 'temperature') return convertViaCelsius(value, from, to);

  const factorMap: Record<Exclude<UnitCategory, 'temperature'>, Record<string, number>> = {
    length: lengthFactors,
    weight: weightFactors,
    area: areaFactors,
    volume: volumeFactors,
  };
  const factors = factorMap[category as Exclude<UnitCategory, 'temperature'>];
  return (value * factors[from]) / factors[to];
}

// --- Budget planner ---

export interface BudgetInput {
  income: number;
  needs: number;
  wants: number;
  savings: number;
}

export interface BudgetResult {
  totalExpenses: number;
  remaining: number;
  needsPercent: number;
  wantsPercent: number;
  savingsPercent: number;
  recommended: { needs: number; wants: number; savings: number };
}

export function calculateBudget({ income, needs, wants, savings }: BudgetInput): BudgetResult {
  const totalExpenses = needs + wants + savings;
  const remaining = income - totalExpenses;
  const pct = (v: number) => (income > 0 ? (v / income) * 100 : 0);

  return {
    totalExpenses,
    remaining,
    needsPercent: pct(needs),
    wantsPercent: pct(wants),
    savingsPercent: pct(savings),
    recommended: { needs: income * 0.5, wants: income * 0.3, savings: income * 0.2 },
  };
}

// --- Scientific calculator (safe expression evaluation) ---

export function evaluateScientificExpression(expression: string): number {
  const prepared = expression
    .replace(/π/g, Math.PI.toString())
    .replace(/√/g, 'Math.sqrt')
    .replace(/\^/g, '**')
    .replace(/(?<![\w.])e(?![\w])/g, Math.E.toString());

  // Only allow a restricted character set before evaluating. `@sqrt@` is matched as the
  // literal 4-char token it was substituted in as (not a `[...s q r t...]` character class,
  // which would incidentally accept any of those individual letters anywhere in the
  // expression) so validation can't be satisfied by stray "s"/"q"/"r"/"t" characters.
  const sanitized = prepared.replace(/Math\.sqrt/g, '@sqrt@');
  if (!/^[0-9+\-*/().\s%@]*$/.test(sanitized.replace(/\*\*/g, '').replace(/@sqrt@/g, ''))) {
    throw new Error('Invalid expression');
  }
  const finalExpr = sanitized.replace(/@sqrt@/g, 'Math.sqrt');

  // eslint-disable-next-line no-new-func
  const fn = new Function(`"use strict"; return (${finalExpr});`);
  const result = fn();
  if (typeof result !== 'number' || !isFinite(result)) throw new Error('Invalid result');
  return result;
}
