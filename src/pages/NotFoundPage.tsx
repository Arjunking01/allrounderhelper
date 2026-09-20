import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Seo } from '@/components/Seo';

export default function NotFoundPage() {
  return (
    <div className="noise-bg min-h-[70vh] flex items-center justify-center px-4">
      <Seo title="Page Not Found" description="The page you're looking for doesn't exist." path="/404" noindex />
      <div className="text-center max-w-md">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl gradient-brand text-white mx-auto mb-6">
          <Compass size={24} />
        </div>
        <h1 className="text-4xl font-semibold">404</h1>
        <p className="mt-3 text-navy-500 dark:text-ink-400">This page doesn't exist, or may have moved.</p>
        <Link to="/" className="mt-6 inline-flex items-center gap-2 rounded-2xl gradient-brand text-white font-semibold px-6 py-3 shadow-lg shadow-electric-500/20">
          Back to home
        </Link>
      </div>
    </div>
  );
}
