import { motion } from 'framer-motion';

type Tone = 'dark' | 'coral' | 'grape' | 'gold';

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  tone?: Tone;
}

const TRACK: Record<Tone, string> = {
  dark: 'bg-white/5',
  coral: 'bg-[var(--color-line)]',
  grape: 'bg-[var(--color-line)]',
  gold: 'bg-[var(--color-line)]',
};

const FILL: Record<Tone, string> = {
  dark: 'linear-gradient(90deg, #6366F1, #A78BFA)',
  coral: 'linear-gradient(90deg, var(--color-coral), var(--color-coral-2))',
  grape: 'linear-gradient(90deg, var(--color-grape), #9D7BFF)',
  gold: 'linear-gradient(90deg, var(--color-gold), #FFD166)',
};

export default function ProgressBar({ value, max = 100, className = '', tone = 'dark' }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={`${TRACK[tone]} rounded-full h-1.5 overflow-hidden ${className}`}>
      <motion.div
        className="h-full rounded-full"
        style={{ background: FILL[tone] }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
    </div>
  );
}
