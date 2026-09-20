import { StaticPageLayout } from '@/components/StaticPageLayout';

export default function CookiePolicyPage() {
  return (
    <StaticPageLayout title="Cookie Policy" description="How ALLROUNDER HELPER uses cookies for analytics, preferences, and advertising." path="/cookie-policy">
      <p>Cookies are small text files stored on your device. We use them for three purposes:</p>
      <h2 className="text-xl font-semibold text-navy-900 dark:text-ink-100 pt-2">Essential cookies</h2>
      <p>Used to remember your theme preference (light or dark mode) and basic site functionality.</p>
      <h2 className="text-xl font-semibold text-navy-900 dark:text-ink-100 pt-2">Analytics cookies</h2>
      <p>Help us understand which tools are most used so we can prioritize improvements.</p>
      <h2 className="text-xl font-semibold text-navy-900 dark:text-ink-100 pt-2">Advertising cookies</h2>
      <p>Used by Google AdSense to serve relevant ads. You can manage ad personalization through Google's Ads Settings at any time.</p>
      <p>You can disable cookies through your browser settings, though some site features — like theme preference — may not work as expected.</p>
    </StaticPageLayout>
  );
}
