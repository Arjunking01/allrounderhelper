import { StaticPageLayout } from '@/components/StaticPageLayout';

export default function AboutPage() {
  return (
    <StaticPageLayout title="About ALLROUNDER HELPER" description="Learn about ALLROUNDER HELPER, the student productivity platform built for accurate calculators, planning tools, and study resources." path="/about" showLogo>
      <p>ALLROUNDER HELPER started as a single question: why do students need a dozen different, ad-choked websites just to check a CGPA or plan a study week? We set out to build one dependable place instead.</p>
      <p>The platform brings together academic calculators, productivity planners, document utilities, and finance tools that students actually reach for during a semester — designed to load fast, work offline where possible, and never get in the way of the task at hand.</p>
      <h2 className="text-xl font-semibold text-navy-900 dark:text-ink-100 pt-4">Our approach</h2>
      <p>Every calculator on this site is built from formulas we've verified against standard academic conventions, and every tool page includes a full explanation of how the calculation works — not just a black-box result. We believe understanding the math behind your CGPA is as valuable as the number itself.</p>
      <h2 className="text-xl font-semibold text-navy-900 dark:text-ink-100 pt-4">What's next</h2>
      <p>Academic Tools, Productivity, Document Tools, and Creator Tools are all live today, alongside the AI Study Assistant. Finance Tools (EMI, SIP, GST, and everyday budgeting calculators) is the next category in active development.</p>
    </StaticPageLayout>
  );
}
