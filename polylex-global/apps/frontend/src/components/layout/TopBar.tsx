interface TopBarProps {
  title: string;
  rightAction?: React.ReactNode;
}

export default function TopBar({ title, rightAction }: TopBarProps) {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center px-4 w-full max-w-screen-xl mx-auto bg-[rgba(251,246,242,0.96)] border-b border-[var(--color-line)] supports-[backdrop-filter]:bg-[rgba(251,246,242,0.85)]"
      style={{
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      {/* Logo */}
      <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
        <img src="/icons/icon.svg" alt="PolyLex" className="w-full h-full object-cover" />
      </div>

      {/* Title */}
      <span className="flex-1 text-center font-display font-bold text-base ml-[-2rem] text-[var(--color-ink)]">
        {title}
      </span>

      {/* Right action */}
      <div className="flex min-h-11 min-w-11 items-center justify-center">
        {rightAction ?? <div className="w-8" />}
      </div>
    </header>
  );
}
