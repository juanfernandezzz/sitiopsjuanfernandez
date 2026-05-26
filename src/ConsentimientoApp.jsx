import HeaderUtilitario from './components/layout/HeaderUtilitario';
import Footer from './components/layout/Footer';
import ConsentimientoInformado from './components/forms/ConsentimientoInformado';

/**
 * Root del bundle de la página /consentimiento.html.
 *
 * Página utilitaria: NO importa Hero, Cal embed, FloatingWhatsApp ni nada
 * del sitio principal. Solo HeaderUtilitario + form + Footer compartido.
 */
export default function ConsentimientoApp() {
  return (
    <div className="min-h-screen bg-cream text-ink font-sans antialiased flex flex-col">
      <HeaderUtilitario />
      <main className="flex-1">
        <ConsentimientoInformado />
      </main>
      <Footer />
    </div>
  );
}
