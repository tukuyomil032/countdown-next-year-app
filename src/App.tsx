import confetti from 'canvas-confetti'
import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import { AudioVisualizer } from './components/AudioVisualizer'
import { PromptOverlay } from './components/PromptOverlay'
import { useCountdown } from './hooks/useCountdown'
import { formatTwo } from './utils/time'

const ICE_BGM = '/audio/Ice Cream.mp3'
const NEWYEAR_BGM = '/audio/Hedgehog.mp3'
const HEDGEHOG_PLAY_DURATION_MS = 15 * 60 * 1000

const AUDIO_CANDIDATES = [ICE_BGM]
type VideoSource = { src: string; type: string }
const HERO_VIDEO_SOURCES_DEFAULT: VideoSource[] = [
  { src: '/visuals/Octagon Abstract Lights.mp4', type: 'video/mp4' },
]
const HERO_VIDEO_SOURCES_NEWYEAR: VideoSource[] = [{ src: '/visuals/happy-year-eve.mp4', type: 'video/mp4' }]
const HERO_POSTER_URL = '/visuals/hero-poster.jpg'

function App() {
  const { now, targetDate, startOfYear, timeLeft, progress, isPremiereWindow, isFinalTen, isNewYearsDay, newYearsDayLeft, yearJustRolled } =
    useCountdown()

  const [soundEnabled, setSoundEnabled] = useState(false)
  const [bgmEnabled, setBgmEnabled] = useState(false)
  const [bgmError, setBgmError] = useState<string | null>(null)
  const [hedgehogActive, setHedgehogActive] = useState(false)

  const audioCtxRef = useRef<AudioContext | null>(null)
  const lastBeepSecondRef = useRef<number | null>(null)
  const bgmRef = useRef<HTMLAudioElement | null>(null)
  const hedgehogRef = useRef<HTMLAudioElement | null>(null)
  const hedgehogStopTimerRef = useRef<number | null>(null)
  const fadeOutStartedRef = useRef(false)
  const hedgehogStartedRef = useRef(false)
  const confettiTriggeredRef = useRef(false)
  const confettiTimersRef = useRef<number[]>([])
  const iceStartedRef = useRef(false)
  const hedgehogVisualActive = hedgehogActive || isNewYearsDay
  const lastClickEffectRef = useRef(0)
  const premiereActive = isPremiereWindow && timeLeft.totalMs > 0
  const finaleActive = yearJustRolled

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
    if (!soundEnabled || !yearJustRolled) return
    triggerBeep('final')
    triggerBeep('final')
  }, [soundEnabled, yearJustRolled])

  const fadeAudio = useCallback(
    (audio: HTMLAudioElement, targetVolume: number, durationMs: number, onComplete?: () => void) => {
      const start = audio.volume
      const target = Math.max(0, Math.min(1, targetVolume))
      if (durationMs <= 0) {
        audio.volume = target
        onComplete?.()
        return
      }
      const startTime = performance.now()
      const step = (nowTime: number) => {
        const progress = Math.min(1, (nowTime - startTime) / durationMs)
        audio.volume = start + (target - start) * progress
        if (progress < 1) requestAnimationFrame(step)
        else onComplete?.()
      }
      requestAnimationFrame(step)
    },
    [],
  )

  const fireConfetti = useCallback(() => {
    confetti({ particleCount: 180, spread: 80, startVelocity: 50, decay: 0.9, scalar: 1 })
  }, [])

  // Visualization is handled by audiomotion-analyzer (see AudioVisualizer)

  const fireClickEffect = useCallback((evt: { clientX: number; clientY: number }) => {
    const nowTs = performance.now()
    if (nowTs - lastClickEffectRef.current < 250) return
    lastClickEffectRef.current = nowTs
    const x = Math.min(0.98, Math.max(0.02, evt.clientX / window.innerWidth))
    const y = Math.min(0.98, Math.max(0.02, evt.clientY / window.innerHeight))
    confetti({
      particleCount: 48,
      spread: 90,
      startVelocity: 42,
      scalar: 1.05,
      origin: { x, y },
      decay: 0.92,
      gravity: 0.3,
      ticks: 120,
      shapes: ['circle'],
      colors: ['#7dd3fc', '#c4b5fd', '#fde68a', '#e0f2fe'],
    })
  }, [])

  const clearConfettiTimers = useCallback(() => {
    confettiTimersRef.current.forEach((id) => window.clearTimeout(id))
    confettiTimersRef.current = []
  }, [])

  const startIce = useCallback(() => {
    if (!bgmEnabled) return
    const candidate = AUDIO_CANDIDATES[0]
    const audio = bgmRef.current ?? new Audio(candidate)
    audio.src = candidate
    audio.loop = true
    audio.volume = 0
    bgmRef.current = audio

    audio
      .play()
      .then(() => {
        setBgmError(null)
        fadeAudio(audio, 0.25, 2_000)
        iceStartedRef.current = true
      })
      .catch((err) => {
        console.error('BGM play failed for', candidate, err)
        setBgmError('BGMを再生できませんでした。ファイルの配置またはブラウザ権限を確認してください。')
        setBgmEnabled(false)
      })
  }, [bgmEnabled, fadeAudio])

  const startHedgehogNow = useCallback(
    (
      options?: {
        durationMs?: number
        withConfetti?: boolean
        forceConfetti?: boolean
        fadeInMs?: number
        fadeOutMs?: number
        resumeIce?: boolean
      },
    ) => {
      const durationMs = options?.durationMs ?? HEDGEHOG_PLAY_DURATION_MS
      const withConfetti = options?.withConfetti ?? true
      const forceConfetti = options?.forceConfetti ?? false
      const fadeInMs = options?.fadeInMs ?? 7_000
      const fadeOutMs = options?.fadeOutMs ?? 10_000
      const resumeIce = options?.resumeIce ?? true

      if (hedgehogStartedRef.current && !forceConfetti) return
      hedgehogStartedRef.current = true

      if (hedgehogStopTimerRef.current) window.clearTimeout(hedgehogStopTimerRef.current)
      if (forceConfetti && hedgehogRef.current) {
        hedgehogRef.current.pause()
        hedgehogRef.current.currentTime = 0
      }

      if (bgmRef.current) {
        bgmRef.current.pause()
        iceStartedRef.current = false
      }

      const audio = hedgehogRef.current ?? new Audio(NEWYEAR_BGM)
      audio.loop = true
      audio.volume = 0
      hedgehogRef.current = audio
      audio
        .play()
        .then(() => {
          setBgmError(null)
          setHedgehogActive(true)
          fadeAudio(audio, 0.7, fadeInMs)
          if (hedgehogStopTimerRef.current) window.clearTimeout(hedgehogStopTimerRef.current)
          hedgehogStopTimerRef.current = window.setTimeout(() => {
            fadeAudio(audio, 0, fadeOutMs, () => {
              audio.pause()
              setHedgehogActive(false)
              hedgehogStartedRef.current = false
              fadeOutStartedRef.current = false
              if (resumeIce) {
                iceStartedRef.current = false
                startIce()
              }
            })
          }, durationMs)
        })
        .catch((err) => {
          console.error('Hedgehog BGM failed', err)
          setBgmError('年明けBGMを再生できませんでした。ファイル配置または権限を確認してください。')
          setHedgehogActive(false)
          hedgehogStartedRef.current = false
        })

      if (withConfetti) {
        if (forceConfetti) {
          clearConfettiTimers()
          confettiTriggeredRef.current = false
        }
        if (!confettiTriggeredRef.current) {
          confettiTriggeredRef.current = true
          fireConfetti()
          const second = window.setTimeout(fireConfetti, 3000)
          confettiTimersRef.current.push(second)
        }
      }
    },
    [clearConfettiTimers, fadeAudio, fireConfetti, startIce],
  )

  useEffect(() => {
    if (!bgmEnabled) {
      fadeOutStartedRef.current = false
      hedgehogStartedRef.current = false
      confettiTriggeredRef.current = false
      iceStartedRef.current = false
      if (bgmRef.current) {
        bgmRef.current.pause()
        bgmRef.current.currentTime = 0
      }
      if (hedgehogRef.current) {
        hedgehogRef.current.pause()
        hedgehogRef.current.currentTime = 0
      }
      if (hedgehogStopTimerRef.current) window.clearTimeout(hedgehogStopTimerRef.current)
      clearConfettiTimers()
      setHedgehogActive(false)
      return
    }

    if (isNewYearsDay) {
      const durationMs = newYearsDayLeft?.totalMs ?? HEDGEHOG_PLAY_DURATION_MS
      startHedgehogNow({
        durationMs,
        withConfetti: yearJustRolled,
        forceConfetti: yearJustRolled,
        fadeInMs: 5_000,
        fadeOutMs: 10_000,
        resumeIce: true,
      })
    } else if (!iceStartedRef.current) {
      startIce()
    }

    return () => {
      if (bgmRef.current) bgmRef.current.pause()
    }
  }, [
    bgmEnabled,
    clearConfettiTimers,
    isNewYearsDay,
    newYearsDayLeft?.totalMs,
    startHedgehogNow,
    startIce,
    yearJustRolled,
  ])

  useEffect(() => {
    if (!bgmEnabled || isNewYearsDay) return

    const secondsRemaining = Math.max(0, Math.ceil(timeLeft.totalMs / 1000))

    if (secondsRemaining <= 10 && timeLeft.totalMs > 0 && !fadeOutStartedRef.current) {
      fadeOutStartedRef.current = true
      if (bgmRef.current) {
        fadeAudio(bgmRef.current, 0, 10_000, () => {
          bgmRef.current?.pause()
          iceStartedRef.current = false
        })
      }
    }
  }, [bgmEnabled, fadeAudio, isNewYearsDay, timeLeft.totalMs])

  useEffect(() => {
    return () => {
      if (bgmRef.current) bgmRef.current.pause()
      if (hedgehogRef.current) hedgehogRef.current.pause()
      if (hedgehogStopTimerRef.current) window.clearTimeout(hedgehogStopTimerRef.current)
      clearConfettiTimers()
    }
  }, [clearConfettiTimers])

  const countdownBlocks = [
    { label: '日', value: timeLeft.days.toString() },
    { label: '時間', value: formatTwo(timeLeft.hours) },
    { label: '分', value: formatTwo(timeLeft.minutes) },
    { label: '秒', value: formatTwo(timeLeft.seconds) },
  ]

  const newYearsDayBlocks = newYearsDayLeft
    ? [
        { label: '時間', value: formatTwo(newYearsDayLeft.hours + newYearsDayLeft.days * 24) },
        { label: '分', value: formatTwo(newYearsDayLeft.minutes) },
        { label: '秒', value: formatTwo(newYearsDayLeft.seconds) },
      ]
    : []

  const displayProgress = timeLeft.totalMs <= 0 ? 1 : Math.min(progress, 0.999)
  const progressPercent = (displayProgress * 100).toFixed(1)
  const visualizerSource =
    hedgehogRef.current && !hedgehogRef.current.paused ? hedgehogRef.current : bgmRef.current

  return (
    <div
      className={`relative min-h-screen overflow-hidden text-slate-100 ${premiereActive ? 'premiere-bg' : ''}`}
      onClick={fireClickEffect}
    >
      <div className="bg-video" aria-hidden>
        <video
          className={`bg-video-media ${hedgehogVisualActive ? 'is-hidden' : 'is-active'}`}
          autoPlay
          loop
          muted
          playsInline
          poster={HERO_POSTER_URL}
        >
          {HERO_VIDEO_SOURCES_DEFAULT.map((item) => (
            <source key={item.src} src={item.src} type={item.type} />
          ))}
        </video>
        <video
          key={hedgehogVisualActive ? 'hedgehog-live' : 'hedgehog-idle'}
          className={`bg-video-media ${hedgehogVisualActive ? 'is-active' : 'is-hidden'}`}
          autoPlay
          loop
          muted
          playsInline
          poster={HERO_POSTER_URL}
        >
          {HERO_VIDEO_SOURCES_NEWYEAR.map((item) => (
            <source key={item.src} src={item.src} type={item.type} />
          ))}
        </video>
      </div>
      <div className="orb cyan" />
      <div className="orb purple" />
      <div className="orb amber" />
      <div className="beam" />
      <div className="scanlines" />
      <div className="grid-overlay" />
      <div className="noise-overlay" />
      <AudioVisualizer source={visualizerSource} />
      {premiereActive && <div className="premiere-rings" />}
      {premiereActive && <div className="energy-lines" />}
      {finaleActive && <div className="finale-flare" />}

      <main className="relative z-10 mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10 md:py-16">
        <header className="flex flex-col items-center gap-3 text-center">
          <span className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.35em] text-glow-cyan shadow-neon">
            Next Year Launch
          </span>
          <h1
            className={`hero-heading font-display text-4xl font-semibold leading-tight md:text-5xl ${
              premiereActive ? 'final-minute-glow text-glow-amber' : ''
            }`}
          >
            <span className={premiereActive ? 'heading-highlight' : ''}>
              {targetDate.getFullYear()}年まであと
            </span>
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

        {isNewYearsDay && newYearsDayLeft && (
          <section className="relative overflow-hidden rounded-3xl border border-cyan-200/30 bg-cyan-200/10 p-6 shadow-lg backdrop-blur-xl md:p-8">
            <div className="absolute inset-0 bg-gradient-to-r from-glow-cyan/10 via-glow-purple/10 to-glow-amber/10 opacity-60" aria-hidden />
            <div className="relative flex flex-col gap-4">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.25em] text-cyan-100">
                <span>元日終了まで</span>
                <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] text-white">Today only</span>
              </div>
              <div className="grid grid-cols-3 gap-3 rounded-2xl border border-white/15 bg-slate-900/60 p-4 md:gap-4 md:p-6">
                {newYearsDayBlocks.map((block) => (
                  <div
                    key={block.label}
                    className="relative overflow-hidden rounded-2xl bg-white/5 px-4 py-4 text-center shadow-lg ring-1 ring-white/10"
                  >
                    <div className="text-[11px] uppercase tracking-[0.3em] text-slate-300">{block.label}</div>
                    <div className="mt-2 font-mono text-4xl font-semibold text-white md:text-5xl">{block.value}</div>
                  </div>
                ))}
              </div>
              <p className="text-sm text-slate-200">
                {targetDate.getFullYear() - 1}年の元日が終わるまでのカウントダウンです。BGMと背景は終日ニューイヤーモードでお楽しみください。
              </p>
            </div>
          </section>
        )}

      </main>

      <PromptOverlay isNewYearsDay={isNewYearsDay} />
    </div>
  )
}

export default App
