import { useEffect, useState } from 'react'
import { FloatingWhatsApp } from 'react-floating-whatsapp'
import Nav from './components/Nav'
import Hero from './components/Hero'

export default function App() {
  const [showWhatsApp, setShowWhatsApp] = useState(false)

  useEffect(() => {
    const onScroll = () => setShowWhatsApp(window.scrollY > 200)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="min-h-screen bg-cream text-ink font-sans antialiased selection:bg-terracotta/20 selection:text-ink">
      <Nav />
      <main>
        <Hero />
      </main>

      {showWhatsApp && (
        <FloatingWhatsApp
          phoneNumber="56973394530"
          accountName="Juan Fernández"
          statusMessage="Psicólogo clínico · Responde habitualmente en pocas horas"
          chatMessage="Hola, gracias por escribir. ¿En qué puedo acompañarte?"
          placeholder="Escribe tu mensaje..."
          avatar="/juan.jpg"
          notification={false}
          allowClickAway
          allowEsc
        />
      )}
    </div>
  )
}
