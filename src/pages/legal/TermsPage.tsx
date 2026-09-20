import { StaticPageLayout } from '@/components/StaticPageLayout';

export default function TermsPage() {
  return (
    <StaticPageLayout title="Terms of Service" description="Terms governing your use of ALLROUNDER HELPER's calculators, tools, and content." path="/terms">
      <p><em>Last updated: July 2026</em></p>
      <h2 className="text-xl font-semibold text-navy-900 dark:text-ink-100 pt-2">Use of the platform</h2>
      <p>ALLROUNDER HELPER provides free calculators, planning tools, and educational content for personal, non-commercial use. By using this site, you agree not to misuse, scrape, or attempt to disrupt the service.</p>
      <h2 className="text-xl font-semibold text-navy-900 dark:text-ink-100 pt-2">Accuracy of results</h2>
      <p>While we verify our calculation logic against standard academic and financial formulas, results are provided for informational purposes only. See our Disclaimer for details on how to treat calculator output.</p>
      <h2 className="text-xl font-semibold text-navy-900 dark:text-ink-100 pt-2">Intellectual property</h2>
      <p>The design, code, and original written content on ALLROUNDER HELPER are owned by us. You may not reproduce or redistribute substantial portions without permission.</p>
      <h2 className="text-xl font-semibold text-navy-900 dark:text-ink-100 pt-2">Changes to these terms</h2>
      <p>We may update these terms periodically. Continued use of the site after changes constitutes acceptance of the updated terms.</p>
    </StaticPageLayout>
  );
}
