import { useState, useRef } from 'react';
import { motion, AnimatePresence, useInView, useReducedMotion } from 'framer-motion';
import { useUI } from '../../lib/uiContext';
import Button from '../ui/Button';

const WA_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '56973394530';
const WA_MESSAGE = encodeURIComponent('Hola Juan, tengo una pregunta sobre las sesiones.');
const WA_HREF = `https://wa.me/${WA_NUMBER}?text=${WA_MESSAGE}`;

const ITEMS = [
  {
    q: '¿Cómo saber si la terapia es para mí?',
    a: 'Si llevas más de un par de semanas con algo que te incomoda: ansiedad, tristeza, una decisión difícil, una sensación que no logras nombrar. Vale la pena conversarlo. La primera sesión es para conocernos y entender juntos qué te trae. Si después no quieres continuar, no hay compromiso.',
  },
  {
    q: '¿La terapia online funciona igual que la presencial?',
    a: 'Para la mayoría de los procesos personales que llegan a consulta, la evidencia disponible (estudios desde 2015 en adelante) muestra resultados equivalentes a la modalidad presencial. Lo importante es tener un lugar privado donde puedas hablar tranquilo y una conexión estable. Hay situaciones específicas en las que recomiendo terapia presencial. Si fuera tu caso, te lo diría con honestidad.',
  },
  {
    q: '¿Cuánto cuesta una sesión?',
    a: 'Hay dos modalidades: sesión particular por $15.000, o sesión con bono Fonasa por $5.570 (este último disponible para afiliados Fonasa de tramos B, C y D, bajo los códigos 0908101, 0908102 y 0908103). Misma duración y dedicación en ambos casos. La forma de pago no cambia lo que pasa en la sesión.',
  },
  {
    q: '¿Cómo compro un bono Fonasa?',
    a: 'Puedes comprarlo online desde Mi Fonasa con tu ClaveÚnica, o presencial en sucursales Fonasa, Caja Los Andes, Caja Los Héroes, ChileAtiende y Servipag. Lo importante: compra el bono ANTES de la sesión y envíame el folio por WhatsApp para validarlo.',
    cta: { label: 'Ver guía paso a paso →', action: 'openFonasaModal' },
  },
  {
    q: '¿Qué pasa en la primera sesión?',
    a: 'Nos conocemos. Me cuentas qué te trae, con el detalle que tú quieras dar, sin presión. Te explico cómo trabajo. Exploramos qué necesitas. Si al final de los 45 minutos sentimos que tiene sentido seguir, definimos un plan. Si no, también está bien.',
  },
  {
    q: '¿Necesito instalar algo para la videollamada?',
    a: 'No. Las sesiones son a través de Doxy.me, plataforma de telerehabilitación certificada por Fonasa. Se abre desde cualquier navegador moderno (Chrome, Safari, Firefox, Edge). Recibes un link, le das clic, das permiso a cámara y micrófono, y entras a la sala de espera. Yo te admito cuando estoy listo.',
  },
  {
    q: '¿Mis datos están protegidos?',
    a: 'Sí. La plataforma de videollamadas está certificada por Fonasa y la conexión va cifrada. No grabo las sesiones. La ficha clínica se mantiene bajo los mismos estándares que una atención presencial, conforme a la Ley 21.541 de telemedicina y a la normativa de protección de datos vigente en Chile.',
  },
  {
    q: '¿Con qué frecuencia se hacen las sesiones?',
    a: 'Lo habitual es semanal o quincenal, según el momento del proceso. Lo conversamos en la segunda sesión y lo ajustamos a tu ritmo y posibilidades.',
  },
  {
    q: '¿Puedo cancelar o reagendar?',
    a: 'Sí. Puedes reagendar desde el mismo email de confirmación hasta 6 horas antes de la sesión sin costo. Cancelaciones con menos de 6 horas se reagendan caso a caso.',
  },
  {
    q: '¿Qué pasa si tengo una crisis fuera del horario de sesión?',
    a: 'Las sesiones son agendadas y no funciono como servicio de urgencia. Si estás en riesgo o tienes una crisis fuera de horario, por favor contacta Salud Responde 600 360 7777 (gratuito, 24/7) o acude a la urgencia más cercana. En la siguiente sesión podemos trabajar lo que ocurrió.',
  },
];

function ChevronIcon({ isOpen }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="flex-shrink-0 text-sage"
      style={{
        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
        transition: 'transform 250ms ease-out',
      }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function AccordionItem({ item, index, isOpen, onToggle, reduce, onCtaAction }) {
  const buttonId = `faq-btn-${index}`;
  const panelId = `faq-panel-${index}`;

  return (
    <li className="border-b border-sage/15 first:border-t first:border-t-sage/15">
      <button
        id={buttonId}
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => onToggle(index)}
        className="w-full flex items-center justify-between gap-4 text-left px-6 py-5 hover:text-sage transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-light focus-visible:ring-offset-2 focus-visible:ring-offset-cream group"
      >
        <span
          className="font-display font-medium text-ink group-hover:text-sage transition-colors duration-200"
          style={{ fontSize: 'clamp(17px, 2vw, 20px)' }}
        >
          {item.q}
        </span>
        <ChevronIcon isOpen={isOpen} />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            role="region"
            aria-labelledby={buttonId}
            id={panelId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              duration: reduce ? 0 : 0.25,
              ease: [0.22, 1, 0.36, 1],
            }}
            style={{ overflow: 'hidden' }}
          >
            <p
              className="font-body text-ink/75 px-6 pb-4"
              style={{ fontSize: 16, lineHeight: 1.65, maxWidth: '65ch' }}
            >
              {item.a}
            </p>
            {item.cta && (
              <button
                type="button"
                onClick={() => onCtaAction && onCtaAction(item.cta.action)}
                className="ml-6 mb-6 font-body text-[14px] text-sage hover:text-[#2F4538] underline decoration-sage/30 hover:decoration-sage underline-offset-4 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-light focus-visible:ring-offset-2 focus-visible:ring-offset-cream rounded-sm"
              >
                {item.cta.label}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const reduce = useReducedMotion();
  const { openFonasaModal } = useUI();

  const handleToggle = (index) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  const handleCtaAction = (action) => {
    if (action === 'openFonasaModal') openFonasaModal();
  };

  const container = {
    hidden: {},
    show: {
      transition: { staggerChildren: reduce ? 0 : 0.06, delayChildren: 0.05 },
    },
  };

  const itemVariant = {
    hidden: { opacity: 0, y: reduce ? 0 : 14 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="bg-cream py-20 md:py-28 px-5 md:px-8"
      style={{ scrollMarginTop: '80px' }}
    >
      <div
        ref={ref}
        className="mx-auto w-full"
        style={{ maxWidth: 880 }}
      >
        <motion.div
          variants={container}
          initial="hidden"
          animate={inView ? 'show' : 'hidden'}
        >
          {/* Cabecera */}
          <motion.div variants={itemVariant} className="mb-12">
            <p
              className="font-body uppercase tracking-widest text-sage mb-3"
              style={{ fontSize: 13 }}
            >
              Preguntas frecuentes
            </p>
            <h2
              id="faq-heading"
              className="font-display text-ink text-balance mb-4"
              style={{
                fontSize: 'clamp(36px, 5vw, 56px)',
                fontVariationSettings: '"opsz" 144, "SOFT" 50',
              }}
            >
              Preguntas frecuentes
            </h2>
            <p
              className="font-body text-ink/70"
              style={{ fontSize: 18, maxWidth: 620 }}
            >
              Lo que más me preguntan antes de la primera sesión.
            </p>
          </motion.div>

          {/* Accordion */}
          <motion.ul variants={itemVariant}>
            {ITEMS.map((item, i) => (
              <AccordionItem
                key={i}
                item={item}
                index={i}
                isOpen={openIndex === i}
                onToggle={handleToggle}
                reduce={reduce}
                onCtaAction={handleCtaAction}
              />
            ))}
          </motion.ul>

          {/* CTA WhatsApp */}
          <motion.div
            variants={itemVariant}
            className="mt-12 flex flex-col items-center gap-4 text-center"
          >
            <p className="font-body text-ink/70" style={{ fontSize: 16 }}>
              ¿Tienes otra pregunta? Escríbeme por WhatsApp y te respondo.
            </p>
            <Button
              as="a"
              variant="secondary"
              size="lg"
              href={WA_HREF}
              target="_blank"
              rel="noopener noreferrer"
            >
              Escribirme por WhatsApp
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
