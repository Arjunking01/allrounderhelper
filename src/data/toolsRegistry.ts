import {
  GraduationCap, CalendarCheck, Percent, ArrowLeftRight, Sigma,
  ClipboardCheck, Calculator, FileSpreadsheet, BookOpenCheck, Timer,
  CalendarClock, Ruler, PiggyBank, ListChecks,
  type LucideIcon,
} from 'lucide-react';

export interface ToolMeta {
  slug: string;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  icon: LucideIcon;
  category: 'academic';
}

export const academicTools: ToolMeta[] = [
  {
    slug: 'cgpa-calculator',
    name: 'CGPA Calculator',
    shortName: 'CGPA',
    tagline: 'Find your cumulative grade point average across semesters.',
    description: 'Free CGPA calculator for students. Add subjects with grade points and credits to instantly calculate your cumulative GPA.',
    icon: GraduationCap,
    category: 'academic',
  },
  {
    slug: 'sgpa-calculator',
    name: 'SGPA Calculator',
    shortName: 'SGPA',
    tagline: 'Calculate your semester grade point average in seconds.',
    description: 'Free SGPA calculator for students. Enter subject credits and grade points to calculate your semester GPA instantly.',
    icon: BookOpenCheck,
    category: 'academic',
  },
  {
    slug: 'attendance-calculator',
    name: 'Attendance Calculator',
    shortName: 'Attendance',
    tagline: 'Track your attendance percentage and safe skip count.',
    description: 'Calculate your current attendance percentage, how many classes you can safely miss, and how many you need to attend to hit your target.',
    icon: CalendarCheck,
    category: 'academic',
  },
  {
    slug: 'percentage-calculator',
    name: 'Percentage Calculator',
    shortName: 'Percentage',
    tagline: 'Convert marks into percentage, grade, and GPA instantly.',
    description: 'Calculate percentage from obtained and total marks, with automatic grade and GPA prediction.',
    icon: Percent,
    category: 'academic',
  },
  {
    slug: 'gpa-to-percentage',
    name: 'GPA to Percentage Converter',
    shortName: 'GPA → %',
    tagline: 'Convert your GPA into an equivalent percentage.',
    description: 'Convert GPA (0-10 scale) into an equivalent percentage using the standard multiplication formula.',
    icon: ArrowLeftRight,
    category: 'academic',
  },
  {
    slug: 'semester-percentage-calculator',
    name: 'Semester Percentage Calculator',
    shortName: 'Semester %',
    tagline: 'Work out your semester percentage and performance band.',
    description: 'Calculate your semester percentage from obtained and maximum marks, with an instant performance rating.',
    icon: Sigma,
    category: 'academic',
  },
  {
    slug: 'marks-required-calculator',
    name: 'Marks Required Calculator',
    shortName: 'Marks Required',
    tagline: 'Find the marks you need to hit a target percentage.',
    description: 'Calculate how many marks you need in total to reach a target percentage, plus your current pass/fail status.',
    icon: ClipboardCheck,
    category: 'academic',
  },
  {
    slug: 'budget-planner',
    name: 'Student Budget Planner',
    shortName: 'Budget Planner',
    tagline: 'Plan monthly income against needs, wants, and savings.',
    description: 'Plan your student budget using the 50/30/20 rule — see how your needs, wants, and savings compare to recommended targets.',
    icon: PiggyBank,
    category: 'academic',
  },
  {
    slug: 'scientific-calculator',
    name: 'Scientific Calculator',
    shortName: 'Scientific',
    tagline: 'A full scientific calculator for everyday coursework.',
    description: 'A free online scientific calculator supporting standard arithmetic, powers, roots, and constants.',
    icon: Calculator,
    category: 'academic',
  },
  {
    slug: 'assignment-score-calculator',
    name: 'Assignment Score Calculator',
    shortName: 'Assignment Score',
    tagline: 'Grade your assignment and check target achievement.',
    description: 'Calculate your assignment percentage and grade, and see exactly how many marks you need to reach a target score.',
    icon: FileSpreadsheet,
    category: 'academic',
  },
  {
    slug: 'exam-score-calculator',
    name: 'Exam Score Calculator',
    shortName: 'Exam Score',
    tagline: 'Check your exam percentage, grade, and pass status.',
    description: 'Calculate exam percentage and letter grade, and instantly check pass/fail status against a passing mark.',
    icon: ListChecks,
    category: 'academic',
  },
  {
    slug: 'study-hours-calculator',
    name: 'Study Hours Calculator',
    shortName: 'Study Hours',
    tagline: 'Project your weekly, monthly, and yearly study time.',
    description: 'Calculate total study hours per week, month, and year based on your daily study routine.',
    icon: Timer,
    category: 'academic',
  },
  {
    slug: 'deadline-calculator',
    name: 'Deadline Calculator',
    shortName: 'Deadline',
    tagline: 'Count down the days, hours, and minutes to any deadline.',
    description: 'Track the exact time remaining until an assignment or exam deadline, down to the minute.',
    icon: CalendarClock,
    category: 'academic',
  },
  {
    slug: 'unit-converter',
    name: 'Unit Converter',
    shortName: 'Unit Converter',
    tagline: 'Convert length, weight, temperature, area, and volume.',
    description: 'A fast, accurate unit converter covering length, weight, temperature, area, and volume conversions.',
    icon: Ruler,
    category: 'academic',
  },
];

export function getToolBySlug(slug: string): ToolMeta | undefined {
  return academicTools.find((t) => t.slug === slug);
}
