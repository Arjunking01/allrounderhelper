import { StaticPageLayout } from '@/components/StaticPageLayout';

export default function DisclaimerPage() {
  return (
    <StaticPageLayout title="Disclaimer" description="ALLROUNDER HELPER's calculators are provided for informational purposes and do not replace official academic or financial records." path="/disclaimer">
      <p>The calculators and tools on ALLROUNDER HELPER are built to closely follow standard academic and financial formulas, but they are provided for informational and planning purposes only.</p>
      <p>Results — including CGPA, SGPA, attendance projections, and financial estimates — should always be cross-checked against your institution's official records, transcripts, or a qualified financial advisor before being used for formal decisions such as applications, appeals, or loan agreements.</p>
      <p>We are not liable for decisions made solely on the basis of results produced by this site.</p>
      <h2>Affiliate disclosure</h2>
      <p>ALLROUNDER HELPER's AI Study Assistant may occasionally show a "Recommended Student &amp; Creator Products" card when you ask about laptops, phones, headphones, cameras, or similar creator/study gear. This card links to an affiliate page, and we may earn a commission on qualifying purchases made through it, at no extra cost to you. Product suggestions are never influenced by payment from any brand, and the assistant's calculators, tool recommendations, and academic guidance elsewhere on the site are entirely unaffected by this — the affiliate card only ever appears as a clearly labeled, optional extra beneath a relevant AI response.</p>
    </StaticPageLayout>
  );
}
