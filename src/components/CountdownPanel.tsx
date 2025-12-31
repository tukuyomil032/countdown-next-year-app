export type CountdownBlock = { label: string; value: string }

type CountdownPanelProps = {
  premiereActive: boolean
  countdownBlocks: CountdownBlock[]
  progressPercent: string
  startOfYearLabel: string
  targetDateLabel: string
  nowLabel: string
  bgmError?: string | null
}

export const CountdownPanel = ({
  premiereActive,
  countdownBlocks,
  progressPercent,
  startOfYearLabel,
  targetDateLabel,
  nowLabel,
  bgmError,
}: CountdownPanelProps) => {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/10 p-5 shadow-xl backdrop-blur-xl md:p-7">
      {premiereActive && <div className="premiere-overlay" />}

      <div className="relative flex flex-col gap-3">
        <div className="relative flex flex-col items-center gap-2 text-center md:flex-row md:items-center md:justify-center md:gap-3 md:w-full min-h-[44px]">
          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-slate-300 md:absolute md:left-0 md:text-sm md:text-left">
            <div className={`h-2 w-2 rounded-full ${premiereActive ? 'bg-amber-300 animate-ping' : 'bg-glow-cyan'}`} />
            {premiereActive ? 'Premiere mode · 残り5分演出' : 'Live countdown'}
          </div>
          <div className="rounded-full border border-white/15 bg-slate-900/70 px-3 py-1 text-sm font-semibold text-white shadow-lg md:px-4 md:py-1.5">
            現在: {nowLabel}
          </div>
        </div>

        <div
          className={`grid grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-slate-900/60 p-3 md:grid-cols-4 md:gap-4 md:p-5 ${
            premiereActive ? 'countdown-flash pulse-border' : ''
          }`}
        >
          {countdownBlocks.map((block) => (
            <div
              key={block.label}
              className="relative overflow-hidden rounded-2xl bg-white/5 px-4 py-4 text-center shadow-lg ring-1 ring-white/10"
            >
              {premiereActive && <span className="absolute inset-0 shimmer opacity-30" aria-hidden />}
              <div className="text-xs uppercase tracking-[0.3em] text-slate-400">{block.label}</div>
              <div className="mt-1.5 flex items-center justify-center gap-1 font-mono text-4xl font-semibold md:text-5xl">
                <span key={block.value} className="leading-none text-white digit-animate">
                  {block.value}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-900/70 p-6 shadow-lg md:p-7">
          <div className="flex items-center justify-between text-sm uppercase tracking-[0.2em] text-slate-200">
            <span className="font-semibold text-white">Year progress</span>
            <span className="font-mono text-lg text-glow-cyan">{progressPercent}%</span>
          </div>
          <div className="relative h-5 overflow-hidden rounded-full bg-white/10">
            <div className="absolute inset-0 shimmer opacity-30" aria-hidden />
            <div
              className="relative h-full rounded-full bg-gradient-to-r from-glow-cyan via-glow-purple to-glow-amber shadow-neon"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm text-slate-200 md:text-base">
            <span>開始: {startOfYearLabel}</span>
            <span className="text-right">目標: {targetDateLabel}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-300 md:text-sm">
            <span className="rounded-full bg-white/10 px-3 py-1 font-mono text-glow-amber">
              {premiereActive ? 'PREMIERE LIGHTS ACTIVE' : 'STANDBY'}
            </span>
            {bgmError && <span className="text-amber-200">{bgmError}</span>}
          </div>
        </div>
      </div>
    </section>
  )
}
