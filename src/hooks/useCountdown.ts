import { useEffect, useMemo, useState } from 'react'
import type { TimeLeft } from '../utils/time'
import { calculateTimeLeft, getYearProgress } from '../utils/time'

export type CountdownState = {
  now: Date
  timeLeft: TimeLeft
  progress: number
  isPremiereWindow: boolean
  isFinalTen: boolean
}

export const useCountdown = (targetDate: Date): CountdownState => {
  const [now, setNow] = useState<Date>(() => new Date())
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calculateTimeLeft(targetDate))

  useEffect(() => {
    const id = window.setInterval(() => {
      const current = new Date()
      setNow(current)
      setTimeLeft(calculateTimeLeft(targetDate, current))
    }, 1000)
    return () => window.clearInterval(id)
  }, [targetDate])

  const startOfYear = useMemo(() => new Date(targetDate.getFullYear() - 1, 0, 1, 0, 0, 0, 0), [targetDate])

  const progress = useMemo(
    () => getYearProgress(now, startOfYear, targetDate),
    [now, startOfYear, targetDate],
  )

  const isPremiereWindow = timeLeft.totalMs > 0 && timeLeft.totalMs <= 300_000 // 5 minutes
  const isFinalTen = timeLeft.totalMs > 0 && timeLeft.totalMs <= 10_000

  return { now, timeLeft, progress, isPremiereWindow, isFinalTen }
}
