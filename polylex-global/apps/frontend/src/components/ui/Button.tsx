import { ButtonHTMLAttributes, forwardRef } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-4 text-sm rounded-xl',
  md: 'h-11 px-5 text-sm rounded-2xl',
  lg: 'h-14 px-6 text-base rounded-2xl',
};

const VARIANTS: Record<Variant, string> = {
  primary:
    'text-white font-semibold bg-[linear-gradient(135deg,var(--color-coral),var(--color-coral-2))] shadow-coral',
  secondary:
    'text-[var(--color-ink)] font-semibold bg-[var(--color-card)] border border-[var(--color-line)] shadow-soft',
  ghost:
    'text-[var(--color-ink-2)] font-medium bg-transparent hover:bg-[var(--color-card-2)]',
  danger:
    'text-[var(--color-bad)] font-semibold bg-[color-mix(in_srgb,var(--color-bad)_10%,transparent)] border border-[color-mix(in_srgb,var(--color-bad)_25%,transparent)]',
};

/**
 * Playful Light button (TICKET-035). Rounded, bold, warm gradient for primary.
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', fullWidth = false, className = '', children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={[
        'press inline-flex items-center justify-center gap-2 font-display',
        'disabled:opacity-50 disabled:pointer-events-none select-none',
        SIZES[size],
        VARIANTS[variant],
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </button>
  );
});

export default Button;
