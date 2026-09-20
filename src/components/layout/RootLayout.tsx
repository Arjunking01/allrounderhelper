import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { OnboardingTour } from '@/components/OnboardingTour';
import { FloatingAiButton } from '@/components/FloatingAiButton';
import { InstallBanner } from '@/components/InstallBanner';

export function RootLayout() {
  const location = useLocation();
  const mainRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    // Move focus to the new page's content on navigation so screen reader and
    // keyboard users land somewhere sensible, without stealing focus on first load.
    if (isFirstRender.current) {
      isFirstRender.current = false;
    } else {
      mainRef.current?.focus();
    }
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[300] focus:rounded-xl focus:bg-electric-500 focus:text-white focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:shadow-lg"
      >
        Skip to main content
      </a>
      <Header />
      <div id="main-content" ref={mainRef} tabIndex={-1} className="flex-1 outline-none">
        <Outlet />
      </div>
      <Footer />
      <OnboardingTour />
      <FloatingAiButton />
      <InstallBanner />
    </div>
  );
}
