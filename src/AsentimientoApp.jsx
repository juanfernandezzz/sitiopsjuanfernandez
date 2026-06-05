import HeaderUtilitario from './components/layout/HeaderUtilitario';
import Footer from './components/layout/Footer';
import AsentimientoInformado from './components/forms/AsentimientoInformado';

/**
 * Root del bundle de la pagina /asentimientoinformado.html.
 *
 * Pagina utilitaria de acceso directo por URL (no enlazada desde el sitio
 * principal, noindex). Solo HeaderUtilitario + form + Footer compartido.
 */
export default function AsentimientoApp() {
  return (
    <div className="min-h-screen bg-cream text-ink font-sans antialiased flex flex-col">
      <HeaderUtilitario />
      <main className="flex-1">
        <AsentimientoInformado />
      </main>
      <Footer />
    </div>
  );
}
