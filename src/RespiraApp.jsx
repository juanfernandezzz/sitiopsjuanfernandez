import React from 'react';
import HeaderUtilitario from './components/layout/HeaderUtilitario';
import Footer from './components/layout/Footer';
import Button from './components/ui/Button';
import RespiraVisor from './components/respira/RespiraVisor';
import { RESPIRA_TEXTO } from './lib/respiraNucleo';

/**
 * Respira conmigo (C24; visor extraído a componente compartido en el fixpack).
 *
 * Ejercicio visual de respiración pausada a ~6 respiraciones por minuto:
 * ciclo de 11 s (5,5 s de inhalación + 5,5 s de exhalación equilibradas).
 * La figura, su aleatoriedad acotada y todas las garantías de seguridad
 * visual viven en src/components/respira/RespiraVisor.jsx, que esta página
 * comparte con la sección Respira del inicio.
 *
 * Encuadre no negociable: herramienta de relajación, sin promesas de
 * resultado; no es un tratamiento ni reemplaza un proceso de psicoterapia.
 */
export default function RespiraApp() {
  return (
    <div className="bg-cream min-h-screen flex flex-col text-ink">
      <HeaderUtilitario />

      <main className="flex-1 w-full">
        <div className="mx-auto max-w-3xl px-5 md:px-8 pt-6 md:pt-10 pb-16 md:pb-20">
          {/* Cabecera */}
          <p className="font-body uppercase tracking-widest text-sage mb-3" style={{ fontSize: 13 }}>
            {RESPIRA_TEXTO.eyebrow}
          </p>
          <h1
            className="font-display text-ink text-balance mb-4"
            style={{
              fontSize: 'clamp(36px, 6vw, 56px)',
              fontVariationSettings: '"opsz" 144, "SOFT" 50',
            }}
          >
            {RESPIRA_TEXTO.titulo}
          </h1>
          <p
            className="font-body text-ink/80"
            style={{ fontSize: 18, lineHeight: 1.6, maxWidth: '58ch' }}
          >
            {RESPIRA_TEXTO.intro}
          </p>

          {/* Visor compartido con la sección del inicio */}
          <div className="mt-10">
            <RespiraVisor />
          </div>

          {/* Encuadre y seguridad */}
          <p
            className="font-body text-ink/75 mt-10"
            style={{ fontSize: 15, lineHeight: 1.65, maxWidth: '58ch' }}
          >
            {RESPIRA_TEXTO.seguridad}
          </p>

          {/* Vía suave hacia agendar */}
          <div className="mt-12 bg-offwhite rounded-2xl px-6 py-8 md:px-10 md:py-10 ring-1 ring-sage/15">
            <p
              className="font-body text-ink/80 mb-5"
              style={{ fontSize: 17, lineHeight: 1.6, maxWidth: '50ch' }}
            >
              {RESPIRA_TEXTO.puenteTexto}
            </p>
            <Button as="a" href="/#agendar" size="lg" variant="primary">
              {RESPIRA_TEXTO.puenteCta}
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
