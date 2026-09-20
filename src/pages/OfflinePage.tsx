import { Link } from 'react-router-dom';
import { WifiOff } from 'lucide-react';
import { Seo } from '@/components/Seo';

export default function OfflinePage() {
  return (
    <div className="noise-bg min-h-[70vh] flex items-center justify-center px-4">
      <Seo title="You're offline" description="ALLROUNDER HELPER works offline for previously visited tools." path="/offline" />
      <div className="text-center max-w-md">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-500 mx-auto mb-6">
          <WifiOff size={24} />
        </div>
        <h1 className="text-3xl font-semibold">You're offline</h1>
        <p className="mt-3 text-navy-500 dark:text-ink-400">
          No connection right now — but any tool you've already opened is cached and still works, including your saved local data.
        </p>
        <Link to="/dashboard" className="mt-6 inline-flex items-center gap-2 rounded-2xl gradient-brand text-white font-semibold px-6 py-3 shadow-lg shadow-electric-500/20">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
