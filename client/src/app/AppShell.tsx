import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Sidebar } from '../components/layout/Sidebar';
import { TopBar } from '../components/layout/TopBar';
import { MobileNav } from '../components/layout/MobileNav';
import { AlertToast } from '../components/alerts/AlertToast';
import { OrbitMedDrawer } from '../components/assistant/OrbitMed';

export function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [menuOpen]);

  return (
    <div className="min-h-screen">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <Sidebar />

      <div className="lg:pl-[236px]">
        <TopBar onOpenMenu={() => setMenuOpen(true)} />
        <main
          id="main-content"
          tabIndex={-1}
          className="app-main mx-auto w-full max-w-[1560px] px-3 pb-28 pt-4 outline-none md:px-5 lg:pb-10"
        >
          <Outlet />
        </main>
      </div>

      <MobileNav />
      <AlertToast />
      <OrbitMedDrawer />

      <AnimatePresence>
        {menuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              aria-label="Close navigation overlay"
              className="absolute inset-0 bg-bg/75"
            />
            <motion.div
              initial={{ x: -24, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -18, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="absolute inset-y-0 left-0 w-[268px]"
            >
              <Sidebar
                variant="drawer"
                onNavigate={() => setMenuOpen(false)}
                onClose={() => setMenuOpen(false)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
