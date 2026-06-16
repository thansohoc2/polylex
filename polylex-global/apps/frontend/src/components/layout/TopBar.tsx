interface TopBarProps {
  title: string;
  rightAction?: React.ReactNode;
  theme?: 'dark' | 'light';
}

export default function TopBar({ title, rightAction, theme = 'dark' }: TopBarProps) {
  const light = theme === 'light';
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center px-4 max-w-md mx-auto"
      style={{
        background: light ? 'rgba(251, 246, 242, 0.85)' : 'rgba(15, 15, 26, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: light ? '1px solid var(--color-line)' : '1px solid rgba(255,255,255,0.05)',
        paddingTop: 'env(safe-area-inset-top)',
      }}
    >
      {/* Logo */}
      <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
        <img src="/icons/icon.svg" alt="PolyLex" className="w-full h-full object-cover" />
      </div>

      {/* Title */}
      <span
        className="flex-1 text-center font-display font-bold text-base ml-[-2rem]"
        style={{ color: light ? 'var(--color-ink)' : '#F1F5F9' }}
      >
        {title}
      </span>

      {/* Right action */}
      <div className="flex items-center">{rightAction ?? <div className="w-8" />}</div>
    </header>
  );
}
