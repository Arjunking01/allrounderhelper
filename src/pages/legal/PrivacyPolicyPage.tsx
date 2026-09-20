import { StaticPageLayout } from '@/components/StaticPageLayout';

export default function PrivacyPolicyPage() {
  return (
    <StaticPageLayout title="Privacy Policy" description="Read the ALLROUNDER HELPER privacy policy covering data collection, cookies, and third-party services." path="/privacy-policy">
      <p><em>Last updated: July 2026</em></p>
      <h2 className="text-xl font-semibold text-navy-900 dark:text-ink-100 pt-2">Information we collect</h2>
      <p>Most calculators on ALLROUNDER HELPER run entirely in your browser — the numbers you enter into a CGPA or attendance calculator are never sent to our servers. Productivity tools that save data (planners, trackers, notes) store it in your browser's local storage on your own device, not on our servers, unless a future account feature explicitly states otherwise.</p>
      <p>The AI Assistant works differently: messages you send it, and any text extracted from documents you upload to it, are relayed through our server to the third-party AI provider currently powering your conversation (for example Google Gemini, OpenAI, Mistral, Cerebras, xAI, Z.ai, OpenRouter, or Cloudflare Workers AI, depending on what's configured) so it can generate a response. Image-generation requests are similarly relayed to Pollinations AI. We do not store your conversation content on our servers beyond what's needed to process that request; the resulting conversation history is then saved in your browser's local storage, the same as other productivity tools. Each provider processes that content under its own privacy policy.</p>
      <p>We do collect standard analytics data (pages visited, approximate location, device type) to understand how the site is used and to improve it.</p>
      <h2 className="text-xl font-semibold text-navy-900 dark:text-ink-100 pt-2">Cookies and advertising</h2>
      <p>We use cookies for analytics and, where applicable, to serve relevant advertising through Google AdSense. Google may use cookies to serve ads based on your prior visits to this or other websites. You can opt out of personalized advertising through Google's Ads Settings.</p>
      <h2 className="text-xl font-semibold text-navy-900 dark:text-ink-100 pt-2">Third-party services</h2>
      <p>We use third-party services including Google Analytics and Google AdSense, the AI providers listed above, and Resend (to deliver messages sent through our Contact page), each governed by their own privacy policies.</p>
      <h2 className="text-xl font-semibold text-navy-900 dark:text-ink-100 pt-2">Your rights</h2>
      <p>You may clear locally stored data at any time through your browser settings. For questions about this policy, contact us via the Contact page.</p>
    </StaticPageLayout>
  );
}
