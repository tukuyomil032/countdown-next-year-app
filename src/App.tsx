import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { useCountdown } from './hooks/useCountdown'
import { formatTwo, getNextYearTarget } from './utils/time'

const AUDIO_LOOP_URL = '/audio/premiere-loop.mp3'
const HERO_VIDEO_URL = '/visuals/hero.webm'
const HERO_VIDEO_FALLBACK = '/visuals/hero.mp4'
const HERO_POSTER_URL = '/visuals/hero-poster.jpg'

function App() {
  const [targetDate] = useState<Date>(() => getNextYearTarget())
  const startOfYear = useMemo(
    () => new Date(targetDate.getFullYear() - 1, 0, 1, 0, 0, 0, 0),
    [targetDate],
  )

  const { now, timeLeft, progress, isPremiereWindow, isFinalTen } = useCountdown(targetDate)

  const [soundEnabled, setSoundEnabled] = useState(false)
  const [bgmEnabled, setBgmEnabled] = useState(false)
  const [bgmError, setBgmError] = useState<string | null>(null)
  const [manualPremiere, setManualPremiere] = useState(false)
  const [manualFinale, setManualFinale] = useState(false)

  const premiereTimerRef = useRef<number | null>(null)
  const finaleTimerRef = useRef<number | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const lastBeepSecondRef = useRef<number | null>(null)
  const bgmRef = useRef<HTMLAudioElement | null>(null)

  const premiereActive = (isPremiereWindow && timeLeft.totalMs > 0) || manualPremiere
  const finaleActive = timeLeft.totalMs <= 0 || manualFinale

  const triggerBeep = (intensity: 'normal' | 'final' = 'normal') => {
    if (!soundEnabled) return
    audioCtxRef.current = audioCtxRef.current ?? new AudioContext()
    const ctx = audioCtxRef.current
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const nowTime = ctx.currentTime
    const duration = intensity === 'final' ? 0.24 : 0.14

    osc.type = 'triangle'
    osc.frequency.value = intensity === 'final' ? 880 : 560

    gain.gain.setValueAtTime(0.0001, nowTime)
    gain.gain.exponentialRampToValueAtTime(0.32, nowTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, nowTime + duration)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(nowTime)
    osc.stop(nowTime + duration)
  }

  useEffect(() => {
    if (!soundEnabled) return
    const secondsRemaining = Math.max(0, Math.ceil(timeLeft.totalMs / 1000))

    if (timeLeft.totalMs <= 0 && lastBeepSecondRef.current !== -1) {
      lastBeepSecondRef.current = -1
      triggerBeep('final')
      triggerBeep('final')
      return
    }

    if (isFinalTen && timeLeft.totalMs > 0) {
      if (lastBeepSecondRef.current !== secondsRemaining) {
        lastBeepSecondRef.current = secondsRemaining
        triggerBeep(secondsRemaining <= 3 ? 'final' : 'normal')
      }
    }
  }, [isFinalTen, soundEnabled, timeLeft.totalMs])

  useEffect(() => {
    if (!soundEnabled || !manualFinale) return
    triggerBeep('final')
    triggerBeep('final')
  }, [manualFinale, soundEnabled])

  useEffect(() => {
    if (!bgmEnabled) {
      if (bgmRef.current) {
        bgmRef.current.pause()
        bgmRef.current.currentTime = 0
      }
      return
    }

    const audio = bgmRef.current ?? new Audio(AUDIO_LOOP_URL)
    audio.loop = true
    audio.volume = 0.25
    bgmRef.current = audio

    audio
      .play()
      .then(() => setBgmError(null))
      .catch((err) => {
        setBgmError('BGMを再生できませんでした。ファイルの配置またはブラウザ権限を確認してください。')
        console.error(err)
        setBgmEnabled(false)
      })

    return () => {
      audio.pause()
    }
  }, [bgmEnabled])

  useEffect(() => {
    return () => {
      if (premiereTimerRef.current) window.clearTimeout(premiereTimerRef.current)
      if (finaleTimerRef.current) window.clearTimeout(finaleTimerRef.current)
      if (bgmRef.current) bgmRef.current.pause()
    }
  }, [])

  const countdownBlocks = [
    { label: '日', value: timeLeft.days.toString() },
    { label: '時間', value: formatTwo(timeLeft.hours) },
    { label: '分', value: formatTwo(timeLeft.minutes) },
    { label: '秒', value: formatTwo(timeLeft.seconds) },
  ]

  const displayProgress = timeLeft.totalMs <= 0 ? 1 : Math.min(progress, 0.999)
  const progressPercent = (displayProgress * 100).toFixed(1)

  const triggerPremierePreview = () => {
    setManualPremiere(true)
    if (premiereTimerRef.current) window.clearTimeout(premiereTimerRef.current)
    premiereTimerRef.current = window.setTimeout(() => setManualPremiere(false), 15000)
  }

  const triggerFinalePreview = () => {
    setManualFinale(true)
    if (finaleTimerRef.current) window.clearTimeout(finaleTimerRef.current)
    finaleTimerRef.current = window.setTimeout(() => setManualFinale(false), 6000)
  }

  return (
    <div className={`relative min-h-screen overflow-hidden text-slate-100 ${premiereActive ? 'premiere-bg' : ''}`}>
      <div className="bg-video" aria-hidden>
        <video
          className="bg-video-media"
          autoPlay
          loop
          muted
          playsInline
          poster={HERO_POSTER_URL}
        >
          <source src={HERO_VIDEO_URL} type="video/webm" />
          <source src={HERO_VIDEO_FALLBACK} type="video/mp4" />
        </video>
      </div>
      <div className="orb cyan" />
      <div className="orb purple" />
      <div className="orb amber" />
      <div className="beam" />
      <div className="scanlines" />
      <div className="grid-overlay" />
      <div className="noise-overlay" />
      {premiereActive && <div className="premiere-rings" />}
      {premiereActive && <div className="energy-lines" />}
      {finaleActive && <div className="finale-flare" />}

      <main className="relative z-10 mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10 md:py-16">
        <header className="flex flex-col items-center gap-3 text-center">
          <span className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.35em] text-glow-cyan shadow-neon">
            Next Year Launch
          </span>
          <h1
            className={`font-display text-4xl font-semibold leading-tight md:text-5xl ${
              premiereActive ? 'final-minute-glow text-glow-amber' : ''
            }`}
          >
            {targetDate.getFullYear()}年まであと
          </h1>
          <p className="text-sm text-slate-400">
            現在: {now.toLocaleString('ja-JP', { timeZoneName: 'short' })}
          </p>
        </header>

        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-xl md:p-10">
          {premiereActive && <div className="premiere-overlay" />}
          {finaleActive && <div className="burst" />}

          <div className="relative flex flex-col gap-6">
            <div className="flex flex-col items-center gap-2 md:flex-row md:justify-between">
              <div className="flex items-center gap-3 text-sm uppercase tracking-[0.2em] text-slate-300">
                <div
                  className={`h-2 w-2 rounded-full ${
                    premiereActive ? 'bg-amber-300 animate-ping' : 'bg-glow-cyan'
                  }`}
                />
                {premiereActive ? 'Premiere mode · 残り5分演出' : 'Live countdown'}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className={`rounded-full border px-4 py-2 text-sm transition-all duration-200 ${
                    soundEnabled
                      ? 'border-amber-300 bg-amber-300/10 text-amber-100 shadow-neon'
                      : 'border-white/15 bg-white/5 text-slate-100 hover:border-white/30'
                  }`}
                  onClick={() => {
                    setSoundEnabled((prev) => !prev)
                    lastBeepSecondRef.current = null
                  }}
                >
                  {soundEnabled ? 'サウンド ON' : 'サウンド OFF'}
                </button>
                <button
                  type="button"
                  className={`rounded-full border px-4 py-2 text-sm transition-all duration-200 ${
                    bgmEnabled
                      ? 'border-cyan-300 bg-cyan-300/10 text-cyan-100 shadow-neon'
                      : 'border-white/15 bg-white/5 text-slate-100 hover:border-white/30'
                  }`}
                  onClick={() => setBgmEnabled((prev) => !prev)}
                >
                  {bgmEnabled ? 'BGM ON' : 'BGM OFF'}
                </button>
              </div>
            </div>

            <div
              className={`grid grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-slate-900/60 p-4 md:grid-cols-4 md:gap-4 md:p-6 ${
                premiereActive ? 'countdown-flash pulse-border' : ''
              }`}
            >
              {countdownBlocks.map((block) => (
                <div
                  key={block.label}
                  className="relative overflow-hidden rounded-2xl bg-white/5 px-4 py-4 shadow-lg ring-1 ring-white/10"
                >
                  {premiereActive && <span className="absolute inset-0 shimmer opacity-30" aria-hidden />}
                  <div className="text-xs uppercase tracking-[0.3em] text-slate-400">{block.label}</div>
                  <div className="mt-2 flex items-baseline gap-1 font-mono text-4xl font-semibold md:text-5xl">
                    <span className="leading-none text-white">{block.value}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="ticker-row relative overflow-hidden rounded-2xl px-4 py-3 md:px-6">
              {premiereActive && <div className="absolute inset-0 shimmer opacity-40" aria-hidden />}
              <div className="relative flex flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-[0.2em] text-slate-200 md:text-sm">
                <span className="font-mono text-glow-cyan">{formatTwo(timeLeft.seconds)}s</span>
                <span className="font-display text-glow-amber">
                  {premiereActive ? 'プレミア演出：残り5分' : '静かな待機モード'}
                </span>
                <span className="font-mono text-purple-200">
                  進捗 {Math.round(displayProgress * 1000) / 10}% / {targetDate.getFullYear()}年
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-900/60 p-4 md:p-5">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-400">
                <span>Year progress</span>
                <span className="font-mono text-glow-cyan">{progressPercent}%</span>
              </div>
              <div className="relative h-3 overflow-hidden rounded-full bg-white/5">
                <div className="absolute inset-0 shimmer opacity-30" aria-hidden />
                <div
                  className="relative h-full rounded-full bg-gradient-to-r from-glow-cyan via-glow-purple to-glow-amber shadow-neon"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 md:text-sm">
                <span>開始: {startOfYear.toLocaleDateString('ja-JP')}</span>
                <span className="text-right">目標: {targetDate.toLocaleDateString('ja-JP')}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400 md:text-sm">
                <span className="rounded-full bg-white/5 px-3 py-1 font-mono text-glow-amber">
                  {premiereActive ? 'PREMIERE LIGHTS ACTIVE' : 'STANDBY'}
                </span>
                {bgmError && <span className="text-amber-200">{bgmError}</span>}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Premiere</div>
            <h3 className="mt-2 text-lg font-semibold text-white">5分前に演出開始</h3>
            <p className="mt-1 text-sm text-slate-300">
              5分前から背景リングとラインが点灯し、ラスト10秒はビープ。BGMをONにするとプレショー風の雰囲気を追加できます。
            </p>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">デバッグ</div>
            <h3 className="mt-2 text-lg font-semibold text-white">演出テスト</h3>
            <p className="mt-1 text-sm text-slate-300">
              「5分前演出再生」「フィナーレ再生」ボタンで演出を即座に確認できます。音も同様にプレビュー。
            </p>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">アセット</div>
            <h3 className="mt-2 text-lg font-semibold text-white">メディア配置</h3>
            <p className="mt-1 text-sm text-slate-300">
              /public/audio にBGM、/public/visuals に画像や動画を置くと自動配信されます。差し替えや差分テストが容易です。
            </p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="glass-card relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-400">
              <span>演出デバッグ</span>
              <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] text-amber-100">Preview only</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-3">
              <button
                type="button"
                className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:border-amber-200 hover:bg-amber-200/10"
                onClick={triggerPremierePreview}
              >
                5分前演出を再生
              </button>
              <button
                type="button"
                className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:border-amber-200 hover:bg-amber-200/10"
                onClick={triggerFinalePreview}
              >
                フィナーレ(0秒)再生
              </button>
            </div>
            <p className="mt-3 text-xs text-slate-300">
              どちらも数秒で自動解除されます。プレショーBGMと組み合わせて演出確認が可能です。
            </p>
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
                <span className="font-mono text-white">
                  {timeLeft.days}日 {formatTwo(timeLeft.hours)}:{formatTwo(timeLeft.minutes)}:{formatTwo(timeLeft.seconds)}
                </span>
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
      </main>
    </div>
  )
}

export default App
