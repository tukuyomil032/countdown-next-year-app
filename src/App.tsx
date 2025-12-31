import confetti from 'canvas-confetti'
import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import { AudioVisualizer } from './components/AudioVisualizer'
import { BackgroundVideo } from './components/BackgroundVideo'
import { CountdownPanel, type CountdownBlock } from './components/CountdownPanel'
import { HeroHeader } from './components/HeroHeader'
import { NewYearsDayPanel } from './components/NewYearsDayPanel'
import { ParticlesOverlay } from './components/ParticlesOverlay'
import { PromptOverlay } from './components/PromptOverlay'
import { useBgmController } from './hooks/useBgmController'
import { useCountdown } from './hooks/useCountdown'
import { formatTwo } from './utils/time'

function App() {
  const { now, targetDate, startOfYear, timeLeft, progress, isPremiereWindow, isFinalTen, isNewYearsDay, newYearsDayLeft, yearJustRolled } =
    useCountdown()

  const [soundEnabled, setSoundEnabled] = useState(false)
  const [bgmError, setBgmError] = useState<string | null>(null)

  const audioCtxRef = useRef<AudioContext | null>(null)
  const lastBeepSecondRef = useRef<number | null>(null)
  const lastClickEffectRef = useRef(0)

  const premiereActive = isPremiereWindow && timeLeft.totalMs > 0
  const finaleActive = yearJustRolled

  const { bgmEnabled, setBgmEnabled, hedgehogVisualActive, visualizerSource } = useBgmController({
    timeLeftMs: timeLeft.totalMs,
    isNewYearsDay,
    newYearsDayLeftMs: newYearsDayLeft?.totalMs,
    yearJustRolled,
    onError: setBgmError,
  })

  const handleToggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev
      if (!next) lastBeepSecondRef.current = null
      return next
    })
    if (audioCtxRef.current?.state === 'suspended') {
      audioCtxRef.current
        .resume()
        .catch((err) => console.warn('AudioContext resume failed', err))
    }
  }

  const handleToggleBgm = () => {
    setBgmEnabled(!bgmEnabled)
  }

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

  const countdownBlocks: CountdownBlock[] = [
    { label: '日', value: timeLeft.days.toString() },
    { label: '時間', value: formatTwo(timeLeft.hours) },
    { label: '分', value: formatTwo(timeLeft.minutes) },
    { label: '秒', value: formatTwo(timeLeft.seconds) },
  ]

  const newYearsDayBlocks: CountdownBlock[] = newYearsDayLeft
    ? [
        { label: '時間', value: formatTwo(newYearsDayLeft.hours + newYearsDayLeft.days * 24) },
        { label: '分', value: formatTwo(newYearsDayLeft.minutes) },
        { label: '秒', value: formatTwo(newYearsDayLeft.seconds) },
      ]
    : []

  const displayProgress = timeLeft.totalMs <= 0 ? 1 : Math.min(progress, 0.999)
  const progressPercent = (displayProgress * 100).toFixed(1)

  return (
    <div
      className={`relative min-h-screen overflow-hidden text-slate-100 ${premiereActive ? 'premiere-bg' : ''}`}
      onClick={fireClickEffect}
    >
      <div className="pointer-events-none absolute right-4 top-4 z-20 md:right-8 md:top-8">
        <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-white/10 bg-slate-900/60 px-3 py-2 shadow-lg backdrop-blur">
          <button
            type="button"
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-200 ${
              soundEnabled ? 'bg-amber-400 text-slate-900 hover:bg-amber-300' : 'bg-white/10 text-white hover:bg-white/20'
            }`}
            onClick={handleToggleSound}
          >
            サウンド {soundEnabled ? 'ON' : 'OFF'}
          </button>
          <button
            type="button"
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-200 ${
              bgmEnabled ? 'bg-cyan-400 text-slate-900 hover:bg-cyan-300' : 'bg-white/10 text-white hover:bg-white/20'
            }`}
            onClick={handleToggleBgm}
          >
            BGM {bgmEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      <BackgroundVideo hedgehogVisualActive={hedgehogVisualActive} />
      <ParticlesOverlay premiereActive={premiereActive} finaleActive={finaleActive} />
      <AudioVisualizer source={visualizerSource} />

      <main className="relative z-10 mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10 md:py-16">
        <HeroHeader premiereActive={premiereActive} targetYear={targetDate.getFullYear()} />

        <CountdownPanel
          premiereActive={premiereActive}
          countdownBlocks={countdownBlocks}
          progressPercent={progressPercent}
          startOfYearLabel={startOfYear.toLocaleDateString('ja-JP')}
          targetDateLabel={targetDate.toLocaleDateString('ja-JP')}
          nowLabel={now.toLocaleString('ja-JP', { timeZoneName: 'short' })}
          bgmError={bgmError}
        />
      </main>

      {isNewYearsDay && newYearsDayLeft && (
        <footer className="relative z-10 mx-auto mt-4 flex max-w-6xl justify-center px-6 pb-12">
          <NewYearsDayPanel visible blocks={newYearsDayBlocks} targetYear={targetDate.getFullYear()} />
        </footer>
      )}

      <PromptOverlay isNewYearsDay={isNewYearsDay} />
    </div>
  )
}

export default App;