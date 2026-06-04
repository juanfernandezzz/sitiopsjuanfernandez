/**
 * Context global de UI.
 *
 * Único punto de acceso: hook useUI().
 * NO exportar UIContext crudo (forzamos el hook).
 *
 * Estado expuesto:
 *  - isFonasaModalOpen: bool
 *  - openFonasaModal(options?): abre el modal. options.targetTab opcional, options.onCloseScrollTo opcional.
 *  - closeFonasaModal(): cierra y devuelve focus al elemento que abrió.
 *  - pendingAgendarTab: string | null. Lo lee Agendar.jsx al montarse / cambiar.
 *  - clearPendingAgendarTab(): el consumidor lo limpia tras aplicar.
 *  - navigateToAgendarFonasa(): atajo combinado (setea tab Fonasa, cierra modal, scroll a #agendar).
 */

import { createContext, useCallback, useContext, useRef, useState } from 'react';

const UIContext = createContext(null);

export function UIProvider({ children }) {
  const [isFonasaModalOpen, setIsFonasaModalOpen] = useState(false);
  const [isTipoSesionOpen, setIsTipoSesionOpen] = useState(false);
  const [pendingAgendarTab, setPendingAgendarTab] = useState(null);

  // Guarda el elemento que tenía foco al abrir el modal (para devolverlo al cerrar).
  const previousFocusRef = useRef(null);

  // Modal selector de tipo de sesión: abierto desde todos los CTA genéricos de
  // "Agendar" (hero, header, menú mobile, cierre de ComoTrabajo). Centraliza el
  // estado para que cualquier sección pueda abrirlo vía useUI().
  const openTipoSesionModal = useCallback(() => {
    if (typeof document !== 'undefined') {
      previousFocusRef.current = document.activeElement;
    }
    setIsTipoSesionOpen(true);
  }, []);

  const closeTipoSesionModal = useCallback(() => {
    setIsTipoSesionOpen(false);
    if (typeof window !== 'undefined') {
      requestAnimationFrame(() => {
        const el = previousFocusRef.current;
        if (el && typeof el.focus === 'function') {
          el.focus();
        }
      });
    }
  }, []);

  const openFonasaModal = useCallback((options = {}) => {
    if (typeof document !== 'undefined') {
      previousFocusRef.current = document.activeElement;
    }
    if (options.targetTab) {
      setPendingAgendarTab(options.targetTab);
    }
    setIsFonasaModalOpen(true);
  }, []);

  const closeFonasaModal = useCallback(() => {
    setIsFonasaModalOpen(false);
    // Devuelve focus al elemento que abrió el modal en el siguiente frame
    // (para no pelear con AnimatePresence durante el unmount).
    if (typeof window !== 'undefined') {
      requestAnimationFrame(() => {
        const el = previousFocusRef.current;
        if (el && typeof el.focus === 'function') {
          el.focus();
        }
      });
    }
  }, []);

  const clearPendingAgendarTab = useCallback(() => {
    setPendingAgendarTab(null);
  }, []);

  // Combo: setea tab Fonasa, cierra modal, scroll a #agendar.
  // Se ejecuta cuando el usuario aprieta "Agendar mi sesión ahora" dentro del modal.
  const navigateToAgendarFonasa = useCallback(() => {
    setPendingAgendarTab('primeraSesionFonasa');
    setIsFonasaModalOpen(false);
    if (typeof window !== 'undefined') {
      // Esperamos a que el body recupere overflow y el modal se desmonte.
      requestAnimationFrame(() => {
        const section = document.getElementById('agendar');
        if (section) {
          section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }
  }, []);

  const value = {
    isFonasaModalOpen,
    openFonasaModal,
    closeFonasaModal,
    isTipoSesionOpen,
    openTipoSesionModal,
    closeTipoSesionModal,
    pendingAgendarTab,
    clearPendingAgendarTab,
    navigateToAgendarFonasa,
  };

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (ctx === null) {
    throw new Error('useUI debe usarse dentro de un <UIProvider>');
  }
  return ctx;
}
