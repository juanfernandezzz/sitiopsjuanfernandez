import HeaderUtilitario from './components/layout/HeaderUtilitario';
import Footer from './components/layout/Footer';
import PoliticaPrivacidad from './pages/PoliticaPrivacidad';

/**
 * Root del bundle de /politica-privacidad.html.
 *
 * Pagina legal indexable. Sin Cal embed, sin Hero, sin FloatingWhatsApp.
 */
export default function PoliticaPrivacidadApp() {
  return (
    <div className="min-h-screen bg-cream text-ink font-sans antialiased flex flex-col">
      <HeaderUtilitario />
      <main className="flex-1">
        <PoliticaPrivacidad />
      </main>
      <Footer />
    </div>
  );
}
