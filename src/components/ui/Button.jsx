import React, { forwardRef } from 'react';
import { CAL_NAMESPACE, calFullUrl } from '../../lib/cal';

/**
 * Botón polimórfico con variantes terracota/sage/ghost.
 *
 * Cuando recibe prop `calLink` (formato: 'username/slug'):
 *   - Agrega los atributos que @calcom/embed-react escucha para abrir el modal inline.
 *   - Fallback defensivo: si el script Cal no cargó por network failure,
 *     abre cal.com en pestaña nueva en lugar de quedar inerte.
 */

const variantClasses = {
  primary: [
    // C24: fondo terracotta-deep para que el texto cream cumpla AA (4.62:1).
    // El terracota de marca (#C97B5E) sigue vivo en bordes y acentos decorativos.
    'bg-terracotta-deep text-cream',
    'border-b-2 border-[#7C4129]',
    'shadow-[0_6px_20px_-8px_rgba(164,88,59,0.55)]',
    'hover:bg-[#8E4B33] hover:shadow-[0_10px_28px_-10px_rgba(164,88,59,0.7)]',
  ].join(' '),
  secondary: [
    'bg-transparent text-sage',
    'border-2 border-sage',
    'hover:bg-sage hover:text-cream',
  ].join(' '),
  ghost: [
    'bg-transparent text-ink',
    'hover:bg-ink/5',
  ].join(' '),
};

const sizeClasses = {
  sm: 'text-sm px-4 py-2 min-h-[36px]',
  md: 'text-base px-5 py-2.5 min-h-[44px]',
  lg: 'text-base md:text-[17px] px-7 py-3.5 min-h-[52px] tracking-[0.01em]',
};

const Button = forwardRef(function Button(
  {
    as,
    variant = 'primary',
    size = 'md',
    className = '',
    children,
    href,
    onClick,
    calLink, // 'username/slug': activa Cal.com embed
    ...rest
  },
  ref
) {
  const Tag = as || (href ? 'a' : 'button');

  const handleClick = (e) => {
    // Fallback: el embed-react inyecta `Cal` global tras init.
    // Si por alguna razón no está disponible, abrimos en pestaña nueva.
    if (calLink && typeof window !== 'undefined' && !window.Cal) {
      e.preventDefault();
      const slug = calLink.split('/').slice(1).join('/');
      window.open(calFullUrl(slug), '_blank', 'noopener,noreferrer');
    }
    if (onClick) onClick(e);
  };

  const base = [
    'inline-flex items-center justify-center gap-2',
    'font-body font-medium',
    'rounded-full',
    'transition-all duration-200 ease-out',
    'hover:-translate-y-[1px] active:translate-y-0',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-light focus-visible:ring-offset-2 focus-visible:ring-offset-cream',
    'disabled:opacity-50 disabled:pointer-events-none',
    'select-none',
  ].join(' ');

  // Atributos que @calcom/embed-react escucha en delegated listener.
  const calAttrs = calLink
    ? {
        'data-cal-link': calLink,
        'data-cal-namespace': CAL_NAMESPACE,
        'data-cal-config': JSON.stringify({ layout: 'month_view' }),
      }
    : {};

  return (
    <Tag
      ref={ref}
      href={Tag === 'a' ? href : undefined}
      onClick={handleClick}
      className={`${base} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...calAttrs}
      {...rest}
    >
      {children}
    </Tag>
  );
});

export default Button;
