import { HTMLAttributes, forwardRef } from 'react';

type Tone = 'plain' | 'tinted' | 'coral' | 'grape';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: Tone;
  interactive?: boolean;
}

const TONES: Record<Tone, string> = {
  plain: 'bg-[var(--color-card)] shadow-soft',
  tinted: 'bg-[var(--color-card-2)] border border-[var(--color-line)]',
  coral:
    'text-white bg-[linear-gradient(135deg,var(--color-coral),var(--color-coral-2))] shadow-coral',
  grape:
    'text-white bg-[linear-gradient(135deg,var(--color-grape),#9D7BFF)] shadow-grape',
};

/**
 * Playful Light surface (TICKET-035). Light card with soft colored elevation.
 */
const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { tone = 'plain', interactive = false, className = '', children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={[
        'rounded-[var(--radius-card)] p-4',
        TONES[tone],
        interactive ? 'press cursor-pointer' : '',
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </div>
  );
});

export default Card;
