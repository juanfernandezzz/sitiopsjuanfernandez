import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

const links = [
  { href: '#sobre-mi', label: 'Sobre mí' },
  { href: '#metodologia', label: 'Enfoque' },
  { href: '#preguntas', label: 'Preguntas' },
]

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.header
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${
        scrolled
          ? 'bg-cream/85 backdrop-blur-md border-b border-sage/10'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12 h-16 lg:h-20 flex items-center justify-between">
        <a
          href="#inicio"
          className="font-display text-lg lg:text-xl text-sage tracking-tight"
          style={{ fontVariationSettings: "'SOFT' 80, 'opsz' 144, 'wght' 500" }}
        >
          Juan Fernández<span className="text-terracotta">.</span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-10">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-ink/70 hover:text-sage transition-colors duration-300 tracking-wide"
            >
              {l.label}
            </a>
          ))}
          <a
            href="#agendar"
            className="px-5 py-2.5 bg-terracotta hover:bg-terracotta-dark text-offwhite text-sm tracking-wide rounded-full transition-all duration-300 hover:-translate-y-0.5 shadow-[0_4px_14px_-4px_rgba(201,123,94,0.4)]"
          >
            Agendar hora
          </a>
        </nav>

        {/* Mobile: solo CTA, máxima reducción de fricción */}
        <a
          href="#agendar"
          className="lg:hidden px-4 py-2 bg-terracotta text-offwhite text-sm rounded-full shadow-[0_4px_14px_-4px_rgba(201,123,94,0.4)]"
        >
          Agendar
        </a>
      </div>
    </motion.header>
  )
}
