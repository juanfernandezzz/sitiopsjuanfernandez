import { motion } from 'framer-motion'
import { ShieldCheck, GraduationCap, BadgeCheck, Sparkles } from 'lucide-react'

// Easing "expo-out": más natural que default, refinado para movimientos largos
const ease = [0.16, 1, 0.3, 1]

const stagger = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12, delayChildren: 0.25 },
  },
}

const item = {
  hidden: { y: 24, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { duration: 0.9, ease } },
}

const trustChips = [
  { icon: ShieldCheck, label: 'Registro MINSAL', value: 'N° 876085' },
  { icon: GraduationCap, label: 'Licenciado', value: 'U. Viña del Mar' },
  { icon: BadgeCheck, label: 'Fonasa MLE', value: 'Certificado' },
  { icon: Sparkles, label: 'Ley 21.541', value: 'Telemedicina' },
]

export default function Hero() {
  return (
    <section
      id="inicio"
      className="relative overflow-hidden pt-28 pb-20 lg:pt-36 lg:pb-32 grain-overlay"
    >
      {/* Decoración editorial: curva sage casi-imperceptible */}
      <svg
        className="absolute top-[55%] -left-20 w-[70%] opacity-[0.07] pointer-events-none"
        viewBox="0 0 600 200"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M0,100 Q150,20 300,100 T600,100"
          stroke="#3F5B4A"
          strokeWidth="1.5"
          fill="none"
        />
      </svg>

      {/* Punto terracotta superior derecho: accent visual */}
      <div className="hidden lg:block absolute top-32 right-24 w-1.5 h-1.5 rounded-full bg-terracotta/50" />
      <div className="hidden lg:block absolute top-40 right-32 w-1 h-1 rounded-full bg-sage/30" />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-12">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="grid lg:grid-cols-12 gap-14 lg:gap-16 items-center"
        >
          {/* Columna izquierda: contenido */}
          <div className="lg:col-span-7 relative z-10">
            {/* Eyebrow editorial con línea horizontal */}
            <motion.div variants={item} className="flex items-center gap-3 mb-8">
              <div className="h-px w-12 bg-sage/40" />
              <span className="text-xs lg:text-sm tracking-[0.18em] uppercase text-sage font-medium">
                Psicología Clínica · Atención Online
              </span>
            </motion.div>

            {/* Headline: serif display con italic emphasis en frase emocional */}
            <motion.h1
              variants={item}
              className="font-display text-[2.75rem] leading-[1.02] sm:text-5xl lg:text-[5.5rem] lg:leading-[0.98] tracking-tightest text-sage text-balance"
              style={{
                fontVariationSettings: "'SOFT' 60, 'opsz' 144, 'wght' 400",
              }}
            >
              Un espacio para detenerte
              <br />
              <span
                className="italic text-ink"
                style={{
                  fontVariationSettings: "'SOFT' 100, 'opsz' 144, 'wght' 400",
                }}
              >
                y volver a ti
              </span>
              <span className="text-terracotta">.</span>
            </motion.h1>

            {/* Subhead: clarifica modalidad + duración + enfoque (CRO clarity) */}
            <motion.p
              variants={item}
              className="mt-8 lg:mt-10 max-w-xl text-lg lg:text-xl leading-relaxed text-ink/75 font-light"
            >
              Psicoterapia clínica online para adultos en todo Chile. Sesiones
              de <span className="text-ink font-medium">45 minutos</span>,
              desde la comodidad de tu hogar, con enfoque integrativo
              cognitivo-conductual y narrativo.
            </motion.p>

            {/* CTA primario + microcopy que elimina objeciones de precio/formato */}
            <motion.div variants={item} className="mt-10 lg:mt-12">
              <a
                href="#agendar"
                className="group inline-flex items-center gap-3 bg-terracotta hover:bg-terracotta-dark text-offwhite px-8 py-4 lg:px-10 lg:py-5 rounded-full text-base lg:text-lg tracking-wide transition-all duration-300 shadow-[0_8px_24px_-8px_rgba(201,123,94,0.5)] hover:shadow-[0_14px_32px_-8px_rgba(201,123,94,0.6)] hover:-translate-y-0.5"
              >
                Agendar mi videoconsulta
                <svg
                  className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M1 8h14m0 0L9 2m6 6l-6 6"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>

              <p className="mt-5 text-sm text-ink/60 max-w-md leading-relaxed">
                Sesión de 45 min ·{' '}
                <span className="text-ink/85">$15.000 particular</span> o copago
                Fonasa MLE desde{' '}
                <span className="text-ink/85">$5.570</span>
              </p>
            </motion.div>

            {/* Trust signals: 4 chips, 4ª colapsa en mobile para preservar legibilidad */}
            <motion.ul
              variants={item}
              className="mt-12 lg:mt-16 flex flex-wrap gap-x-6 gap-y-4 lg:gap-x-8"
            >
              {trustChips.map(({ icon: Icon, label, value }, i) => (
                <li
                  key={label}
                  className={`flex items-center gap-2.5 ${
                    i === 3 ? 'hidden sm:flex' : ''
                  }`}
                >
                  <Icon
                    className="w-4 h-4 text-sage/70 shrink-0"
                    strokeWidth={1.5}
                  />
                  <div className="text-xs lg:text-[0.8rem] leading-tight">
                    <div className="text-ink/50 tracking-wide">{label}</div>
                    <div className="text-ink/85 font-medium">{value}</div>
                  </div>
                </li>
              ))}
            </motion.ul>
          </div>

          {/* Columna derecha: foto profesional con tratamiento orgánico (blob clip) */}
          <motion.div variants={item} className="lg:col-span-5 relative">
            <div className="relative max-w-sm mx-auto lg:max-w-none">
              {/* Marco offset sage: sombra orgánica detrás de la foto */}
              <div
                className="absolute -inset-4 lg:-inset-6 bg-sage/10 -z-10"
                style={{
                  borderRadius: '62% 38% 54% 46% / 48% 56% 44% 52%',
                  transform: 'rotate(-3deg)',
                }}
                aria-hidden="true"
              />

              {/* Foto con border-radius asimétrico (no rectángulo genérico) */}
              <div
                className="relative overflow-hidden bg-sage-light/20"
                style={{
                  borderRadius: '58% 42% 50% 50% / 45% 55% 45% 55%',
                  aspectRatio: '4 / 5',
                }}
              >
                <img
                  src="/juan.jpg"
                  alt="Juan Fernández, psicólogo clínico"
                  className="w-full h-full object-cover"
                  loading="eager"
                  fetchPriority="high"
                />
                {/* Overlay sutil sage para cohesión cromática */}
                <div
                  className="absolute inset-0 bg-gradient-to-tr from-sage/10 via-transparent to-transparent pointer-events-none"
                  aria-hidden="true"
                />
              </div>

              {/* Tag flotante: presencia + título, trust signal en tiempo real */}
              <div className="absolute -bottom-4 left-4 lg:-bottom-6 lg:left-8 bg-offwhite shadow-[0_12px_32px_-12px_rgba(42,59,76,0.18)] rounded-full px-5 py-3 lg:px-6 lg:py-3.5 flex items-center gap-3">
                <span className="relative flex w-2 h-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-terracotta opacity-60 animate-ping" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-terracotta" />
                </span>
                <div className="text-[0.7rem] lg:text-xs leading-tight">
                  <div
                    className="font-display italic text-sage"
                    style={{
                      fontVariationSettings: "'SOFT' 80, 'opsz' 144, 'wght' 500",
                    }}
                  >
                    Juan Fernández
                  </div>
                  <div className="text-ink/55 tracking-wide">
                    Psicólogo clínico · Recibiendo pacientes
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
