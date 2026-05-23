import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Button from '../ui/Button';
import { CAL_USERNAME, HERO_PRIMARY_CTA } from '../../lib/cal';

const NAV_ITEMS = [
  { label: 'Cómo trabajo', href: '#como-trabajo' },
  { label: 'Precios', href: '#precios' },
  { label: 'Agendar', href: '#agendar' },
];

const PRIMARY_CAL_LINK = `${CAL_USERNAME}/${HERO_PRIMARY_CTA}`;

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const firstMobileLinkRef = useRef(null);

  // El header aparece cuando el sentinel del Hero sale de viewport hacia arriba.
  useEffect(() => {
    const sentinel = document.getElementById('hero-end-sentinel');
    if (!sentinel) {
      const onScroll = () => setScrolled(window.scrollY > 600);
      window.addEventListener('scroll', onScroll, { passive: true });
      return () => window.removeEventListener('scroll', onScroll);
    }
    const io = new IntersectionObserver(
      ([entry]) => setScrolled(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { threshold: 0 }
    );
    io.observe(sentinel);
    return () => io.disconnect();
  }, []);

  // Lock body scroll mientras el menú móvil está abierto.
  useEffect(() => {
    if (mobileOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      const t = setTimeout(() => firstMobileLinkRef.current?.focus(), 150);
      const onKey = (e) => e.key === 'Escape' && setMobileOpen(false);
      document.addEventListener('keydown', onKey);
      return () => {
        document.body.style.overflow = prev;
        document.body.style.touchAction = '';
        document.removeEventListener('keydown', onKey);
        clearTimeout(t);
      };
    }
  }, [mobileOpen]);

  return (
    <>
      <AnimatePresence>
        {scrolled && (
          <motion.header
            key="sticky-header"
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-0 left-0 right-0 z-40 bg-cream/85 backdrop-blur-md border-b border-ink/5"
          >
            <div className="mx-auto max-w-6xl px-5 lg:px-8 h-16 flex items-center justify-between">
              <Brand />
              <nav className="hidden md:flex items-center gap-8">
                {NAV_ITEMS.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="font-body text-[15px] text-ink/80 hover:text-ink transition-colors duration-150"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
              <div className="hidden md:block">
                <Button size="sm" variant="primary" calLink={PRIMARY_CAL_LINK}>
                  Agendar sesión
                </Button>
              </div>
              <button
                aria-label="Abrir menú"
                aria-expanded={mobileOpen}
                onClick={() => setMobileOpen(true)}
                className="md:hidden p-2 -mr-2 text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-light rounded"
              >
                <BurgerIcon />
              </button>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="mobile-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-ink/40 z-50"
            />
            <motion.aside
              key="mobile-panel"
              role="dialog"
              aria-modal="true"
              aria-label="Menú de navegación"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="fixed top-0 right-0 bottom-0 z-50 w-[82%] max-w-sm bg-cream shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-ink/5">
                <Brand small />
                <button
                  aria-label="Cerrar menú"
                  onClick={() => setMobileOpen(false)}
                  className="p-2 -mr-2 text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-light rounded"
                >
                  <CloseIcon />
                </button>
              </div>
              <nav className="flex flex-col px-6 py-6 gap-1">
                {NAV_ITEMS.map((item, i) => (
                  <a
                    key={item.href}
                    href={item.href}
                    ref={i === 0 ? firstMobileLinkRef : null}
                    onClick={() => setMobileOpen(false)}
                    className="font-display text-[22px] text-ink py-3 min-h-[48px] border-b border-ink/5 hover:text-terracota transition-colors"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
              <div className="mt-auto px-6 pb-8">
                <Button
                  size="lg"
                  variant="primary"
                  calLink={PRIMARY_CAL_LINK}
                  onClick={() => setMobileOpen(false)}
                  className="w-full"
                >
                  Agendar sesión
                </Button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function Brand({ small = false }) {
  return (
    <a
      href="#top"
      className="flex flex-col leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-light rounded"
    >
      <span
        className={`font-display ${small ? 'text-[18px]' : 'text-[20px]'} text-ink`}
        style={{ fontVariationSettings: '"opsz" 36, "SOFT" 50' }}
      >
        Juan Fernández
      </span>
      <span className="font-body text-[10px] uppercase tracking-[0.18em] text-sage mt-0.5">
        Psicólogo Clínico
      </span>
    </a>
  );
}

function BurgerIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
