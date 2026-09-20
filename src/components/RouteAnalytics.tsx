import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '@/lib/analytics';

export function RouteAnalytics() {
  const location = useLocation();
  const lastTracked = useRef<string | null>(null);

  useEffect(() => {
    const fullPath = location.pathname + location.search;
    if (lastTracked.current === fullPath) return; // avoids double page_view from StrictMode's double effect invoke
    lastTracked.current = fullPath;
    trackPageView(fullPath);
  }, [location.pathname, location.search]);

  return null;
}
