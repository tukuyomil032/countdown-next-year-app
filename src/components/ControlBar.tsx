type ControlBarProps = {
  premiereActive: boolean
  bgmEnabled: boolean
  soundEnabled: boolean
  onToggleSound: () => void
  onToggleBgm: () => void
  remainingLabel: string
}

export const ControlBar = ({ premiereActive, bgmEnabled, soundEnabled, onToggleSound, onToggleBgm, remainingLabel }: ControlBarProps) => {
  return (
    <section className="grid gap-4 md:grid-cols-2">
      <div className="glass-card relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-400">
          <span>演出デバッグ</span>
          <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] text-amber-100">Preview only</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-3">
          <button
            type="button"
            className="rounded-full border px-4 py-2 text-sm transition-all duration-200 border-white/15 bg-white/5 text-slate-100 hover:border-white/30"
            onClick={onToggleSound}
          >
            {soundEnabled ? 'サウンド ON' : 'サウンド OFF'}
          </button>
          <button
            type="button"
            className="rounded-full border px-4 py-2 text-sm transition-all duration-200 border-white/15 bg-white/5 text-slate-100 hover:border-white/30"
            onClick={onToggleBgm}
          >
            {bgmEnabled ? 'BGM ON' : 'BGM OFF'}
          </button>
        </div>
        <p className="mt-3 text-xs text-slate-300">サウンド/BGMのON/OFFをここで切り替えできます。</p>
      </div>

      <div className="glass-card relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-400">
          <span>ステータス</span>
          <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] text-cyan-100">Live</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div className="flex flex-col gap-1 rounded-xl border border-white/10 bg-white/5 p-3">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-400">モード</span>
            <span className="font-display text-white">{premiereActive ? 'Premiere' : 'Standby'}</span>
          </div>
          <div className="flex flex-col gap-1 rounded-xl border border-white/10 bg-white/5 p-3">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-400">BGM</span>
            <span className={`font-display ${bgmEnabled ? 'text-glow-cyan' : 'text-slate-300'}`}>
              {bgmEnabled ? 'ON' : 'OFF'}
            </span>
          </div>
          <div className="flex flex-col gap-1 rounded-xl border border-white/10 bg-white/5 p-3">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-400">サウンド</span>
            <span className={`font-display ${soundEnabled ? 'text-glow-amber' : 'text-slate-300'}`}>
              {soundEnabled ? 'ON' : 'OFF'}
            </span>
          </div>
          <div className="flex flex-col gap-1 rounded-xl border border-white/10 bg-white/5 p-3">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-400">残り</span>
            <span className="font-mono text-white">{remainingLabel}</span>
          </div>
        </div>
        <div className="mt-4 h-10 w-full overflow-hidden rounded-xl bg-white/5">
          <div className="equalizer">
            {[...Array(18)].map((_, idx) => (
              <span key={idx} className="eq-bar" style={{ ['--i' as string]: idx }} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
