type HeroHeaderProps = {
  premiereActive: boolean
  targetYear: number
}

export const HeroHeader = ({ premiereActive, targetYear }: HeroHeaderProps) => {
  return (
    <header className="flex flex-col items-center gap-3 text-center">
      <span className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.35em] text-glow-cyan shadow-neon">
        Next Year Launch
      </span>
      <h1
        className={`hero-heading font-display text-4xl font-semibold leading-tight md:text-5xl ${
          premiereActive ? 'final-minute-glow text-glow-amber' : ''
        }`}
      >
        <span className={premiereActive ? 'heading-highlight' : ''}>{targetYear}年まであと</span>
      </h1>
    </header>
  )
}
