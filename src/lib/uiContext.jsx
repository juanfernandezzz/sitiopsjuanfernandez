/**
 * Context global de UI.
 *
 * Único punto de acceso: hook useUI().
 * NO exportar UIContext crudo (forzamos el hook).
 *
 * Estado expuesto:
 *  - isTipoSesionOpen: bool
 *  - openTipoSesionModal(): abre el selector de tipo de sesión.
 *  - closeTipoSesionModal(): cierra y devuelve focus al elemento que abrió.
 *
 * C54: aquí vivía además todo el estado del modal de la guía Fonasa
 * (isFonasaModalOpen, openFonasaModal, closeFonasaModal, navigateToAgendarFonasa
 * y el pendingAgendarTab que ese modal seteaba para preseleccionar una pestaña
 * de Agendar). La guía dejó de ser un modal y pasó a página propia
 * (/guia-bono-fonasa.html), así que ese estado se fue completo: sin el modal,
 * nadie escribía pendingAgendarTab y Agendar quedaba leyendo un valor que
 * siempre era null.
 */

import { createContext, useCallback, useContext, useRef, useState } from 'react';

const UIContext = createContext(null);

export function UIProvider({ children }) {
  const [isTipoSesionOpen, setIsTipoSesionOpen] = useState(false);

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

  const value = {
    isTipoSesionOpen,
    openTipoSesionModal,
    closeTipoSesionModal,
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
