import confetti from 'canvas-confetti'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  HEDGEHOG_PLAY_DURATION_MS,
  ICE_BGM,
  NEWYEAR_BGM,
} from '../constants/media'

const DEFAULT_FADE_IN_MS = 7_000
const DEFAULT_FADE_OUT_MS = 10_000

export type BgmControllerParams = {
  timeLeftMs: number
  isNewYearsDay: boolean
  newYearsDayLeftMs: number | null | undefined
  yearJustRolled: boolean
  onError?: (message: string | null) => void
}

export type BgmControllerState = {
  bgmEnabled: boolean
  setBgmEnabled: (value: boolean) => void
  hedgehogActive: boolean
  hedgehogVisualActive: boolean
  visualizerSource: HTMLAudioElement | null
}

export const useBgmController = ({
  timeLeftMs,
  isNewYearsDay,
  newYearsDayLeftMs,
  yearJustRolled,
  onError,
}: BgmControllerParams): BgmControllerState => {
  const [bgmEnabled, setBgmEnabled] = useState(false)
  const [hedgehogActive, setHedgehogActive] = useState(false)

  const bgmRef = useRef<HTMLAudioElement | null>(null)
  const hedgehogRef = useRef<HTMLAudioElement | null>(null)
  const hedgehogStopTimerRef = useRef<number | null>(null)
  const fadeOutStartedRef = useRef(false)
  const hedgehogStartedRef = useRef(false)
  const confettiTriggeredRef = useRef(false)
  const confettiTimersRef = useRef<number[]>([])
  const iceStartedRef = useRef(false)

  const hedgehogVisualActive = hedgehogActive || isNewYearsDay
  const visualizerSource = useMemo(() => {
    if (hedgehogRef.current && !hedgehogRef.current.paused) {
      return hedgehogRef.current
    }
    return bgmRef.current ?? null
  }, [hedgehogActive])

  const setError = useCallback(
    (message: string | null) => {
      onError?.(message)
    },
    [onError],
  )

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
        if (progress < 1) {
          requestAnimationFrame(step)
        } else {
          onComplete?.()
        }
      }
      requestAnimationFrame(step)
    },
    [],
  )

  const fireConfetti = useCallback(() => {
    confetti({ particleCount: 180, spread: 80, startVelocity: 50, decay: 0.9, scalar: 1 })
  }, [])

  const clearConfettiTimers = useCallback(() => {
    confettiTimersRef.current.forEach((id) => window.clearTimeout(id))
    confettiTimersRef.current = []
  }, [])

  const startIce = useCallback(() => {
    if (!bgmEnabled) {
      return
    }
    if (bgmRef.current) {
      bgmRef.current.pause()
      bgmRef.current.currentTime = 0
    }

    iceStartedRef.current = false

    const audio = new Audio(ICE_BGM)
    audio.loop = true
    audio.volume = 0
    audio.preload = 'auto'
    audio.load()
    bgmRef.current = audio

    audio
      .play()
      .then(() => {
        setError(null)
        fadeAudio(audio, 0.25, 2_000)
        iceStartedRef.current = true
      })
      .catch((err) => {
        console.error('BGM play failed for Ice Cream', err)
        setError('BGMを再生できませんでした。ブラウザーの権限を確認してください。')
        setBgmEnabled(false)
      })
  }, [bgmEnabled, fadeAudio, setError])

  const startHedgehog = useCallback(
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
      const fadeInMs = options?.fadeInMs ?? DEFAULT_FADE_IN_MS
      const fadeOutMs = options?.fadeOutMs ?? DEFAULT_FADE_OUT_MS
      const resumeIce = options?.resumeIce ?? true

      if (hedgehogStartedRef.current && !forceConfetti) {
        return
      }
      hedgehogStartedRef.current = true

      if (hedgehogStopTimerRef.current) {
        window.clearTimeout(hedgehogStopTimerRef.current)
      }
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
          setError(null)
          setHedgehogActive(true)
          fadeAudio(audio, 0.7, fadeInMs)
          if (hedgehogStopTimerRef.current) {
            window.clearTimeout(hedgehogStopTimerRef.current)
          }
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
          setError('年明けBGMを再生できませんでした。ファイル配置または権限を確認してください。')
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
    [clearConfettiTimers, fadeAudio, fireConfetti, setError, startIce],
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
      if (hedgehogStopTimerRef.current) {
        window.clearTimeout(hedgehogStopTimerRef.current)
      }
      clearConfettiTimers()
      setHedgehogActive(false)
      bgmRef.current = null
      hedgehogRef.current = null
      return
    }

    if (isNewYearsDay) {
      const durationMs = newYearsDayLeftMs ?? HEDGEHOG_PLAY_DURATION_MS
      startHedgehog({
        durationMs,
        withConfetti: yearJustRolled,
        forceConfetti: yearJustRolled,
        fadeInMs: 5_000,
        fadeOutMs: DEFAULT_FADE_OUT_MS,
        resumeIce: true,
      })
    } else if (!iceStartedRef.current) {
      startIce()
    }

    return () => {
      if (bgmRef.current) {
        bgmRef.current.pause()
      }
    }
  }, [
    bgmEnabled,
    clearConfettiTimers,
    isNewYearsDay,
    newYearsDayLeftMs,
    startHedgehog,
    startIce,
    yearJustRolled,
  ])

  useEffect(() => {
    if (!bgmEnabled || isNewYearsDay) {
      return
    }

    const secondsRemaining = Math.max(0, Math.ceil(timeLeftMs / 1000))

    if (secondsRemaining <= 10 && timeLeftMs > 0 && !fadeOutStartedRef.current) {
      fadeOutStartedRef.current = true
      if (bgmRef.current) {
        fadeAudio(bgmRef.current, 0, DEFAULT_FADE_OUT_MS, () => {
          bgmRef.current?.pause()
          iceStartedRef.current = false
        })
      }
    }

    if (timeLeftMs <= 0) {
      startHedgehog()
    }
  }, [bgmEnabled, fadeAudio, isNewYearsDay, startHedgehog, timeLeftMs])

  useEffect(() => {
    return () => {
      if (bgmRef.current) {
        bgmRef.current.pause()
      }
      if (hedgehogRef.current) {
        hedgehogRef.current.pause()
      }
      if (hedgehogStopTimerRef.current) {
        window.clearTimeout(hedgehogStopTimerRef.current)
      }
      clearConfettiTimers()
    }
  }, [clearConfettiTimers])

  return {
    bgmEnabled,
    setBgmEnabled,
    hedgehogActive,
    hedgehogVisualActive,
    visualizerSource,
  }
}
