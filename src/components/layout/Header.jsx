import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Button from '../ui/Button';
import { useUI } from '../../lib/uiContext';

const NAV_ITEMS = [
  { label: 'Cómo trabajo', href: '#como-trabajo' },
  { label: 'Precios', href: '#precios' },
  { label: 'Agendar', href: '#agendar' },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { openTipoSesionModal } = useUI();
  const firstMobileLinkRef = useRef(null);

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
      {/* Header fijo, visible desde el inicio. Fondo sage, texto cream. */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-sage text-cream shadow-[0_2px_12px_-6px_rgba(42,59,76,0.5)]">
        <div className="mx-auto max-w-6xl px-5 lg:px-8 h-[52px] md:h-[60px] flex items-center justify-between">
          <Brand />

          <nav className="hidden md:flex items-center gap-8">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="font-body text-[16px] text-cream/80 hover:text-cream transition-colors duration-150"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="primary"
              onClick={openTipoSesionModal}
              className="text-sm font-semibold !px-5 !py-3"
            >
              Agendar
            </Button>
            <button
              aria-label="Abrir menú"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-1.5 -mr-1.5 text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream/60 rounded"
            >
              <BurgerIcon />
            </button>
          </div>
        </div>
      </header>

      {/* Spacer: empuja el contenido para que no quede bajo el header fijo. */}
      <div aria-hidden="true" className="h-[52px] md:h-[60px]" />

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
                <Brand small dark />
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
                  onClick={() => {
                    setMobileOpen(false);
                    // Pequeño delay: deja que el panel mobile cierre su animación
                    // antes de abrir el modal, evitando dos overlays encimados.
                    setTimeout(() => openTipoSesionModal(), 280);
                  }}
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

function Brand({ small = false, dark = false }) {
  const nameColor = dark ? 'text-ink' : 'text-cream';
  const subColor = dark ? 'text-sage' : 'text-cream/70';
  return (
    <a
      href="#top"
      className="flex flex-col leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream/60 rounded"
    >
      <span className={`font-wordmark ${small ? 'text-[19px]' : 'text-[21px] md:text-[23px]'} ${nameColor}`}>
        Juan Fernández
      </span>
      <span className={`font-body text-[11px] uppercase tracking-[0.16em] ${subColor} mt-0.5`}>
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
