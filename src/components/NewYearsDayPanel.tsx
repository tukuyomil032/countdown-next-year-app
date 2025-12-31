import type { CountdownBlock } from './CountdownPanel'

type NewYearsDayPanelProps = {
  visible: boolean
  blocks: CountdownBlock[]
  targetYear: number
}

export const NewYearsDayPanel = ({ visible, blocks, targetYear }: NewYearsDayPanelProps) => {
  if (!visible || !blocks.length) return null

  return (
    <section className="relative w-full overflow-hidden rounded-3xl border border-cyan-200/30 bg-cyan-200/10 p-6 shadow-lg backdrop-blur-xl md:p-8">
      <div className="absolute inset-0 bg-gradient-to-r from-glow-cyan/10 via-glow-purple/10 to-glow-amber/10 opacity-60" aria-hidden />
      <div className="relative flex flex-col gap-4">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.25em] text-cyan-100">
          <span>元日終了まで</span>
          <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] text-white">Today only</span>
        </div>
        <div className="grid grid-cols-3 gap-3 rounded-2xl border border-white/15 bg-slate-900/60 p-4 md:gap-4 md:p-6">
          {blocks.map((block) => (
            <div
              key={block.label}
              className="relative overflow-hidden rounded-2xl bg-white/5 px-4 py-4 text-center shadow-lg ring-1 ring-white/10"
            >
              <div className="text-[11px] uppercase tracking-[0.3em] text-slate-300">{block.label}</div>
              <div className="mt-2 font-mono text-4xl font-semibold text-white md:text-5xl">
                <span key={block.value} className="digit-animate">
                  {block.value}
                </span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-sm text-slate-200">
          {targetYear - 1}年の元日が終わるまでのカウントダウンです。BGMと背景は終日ニューイヤーモードでお楽しみください。
        </p>
      </div>
    </section>
  )
}
