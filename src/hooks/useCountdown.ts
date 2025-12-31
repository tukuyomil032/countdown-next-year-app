import { useEffect, useMemo, useRef, useState } from 'react'
import type { TimeLeft } from '../utils/time'
import { calculateTimeLeft, getNextYearTargetFrom, getYearProgress } from '../utils/time'

export type CountdownState = {
  now: Date
  targetDate: Date
  startOfYear: Date
  timeLeft: TimeLeft
  progress: number
  isPremiereWindow: boolean
  isFinalTen: boolean
  isNewYearsDay: boolean
  newYearsDayLeft: TimeLeft | null
  yearJustRolled: boolean
}

export const useCountdown = (): CountdownState => {
  const [now, setNow] = useState<Date>(() => new Date())
  const [yearJustRolled, setYearJustRolled] = useState(false)

  useEffect(() => {
    const id = window.setInterval(() => {
      setNow(new Date())
    }, 1000)
    return () => window.clearInterval(id)
  }, [])

  const targetDate = useMemo(() => getNextYearTargetFrom(now), [now])
  const startOfYear = useMemo(
    () => new Date(targetDate.getFullYear() - 1, 0, 1, 0, 0, 0, 0),
    [targetDate],
  )

  const timeLeft = useMemo(() => calculateTimeLeft(targetDate, now), [targetDate, now])
  const progress = useMemo(
    () => getYearProgress(now, startOfYear, targetDate),
    [now, startOfYear, targetDate],
  )

  const isPremiereWindow = timeLeft.totalMs > 0 && timeLeft.totalMs <= 300_000 // 5 minutes
  const isFinalTen = timeLeft.totalMs > 0 && timeLeft.totalMs <= 10_000

  const isNewYearsDay = now.getMonth() === 0 && now.getDate() === 1
  const newYearsDayEnd = useMemo(
    () => (isNewYearsDay ? new Date(now.getFullYear(), 0, 1, 23, 59, 59, 999) : null),
    [isNewYearsDay, now],
  )
  const newYearsDayLeft = useMemo(
    () => (isNewYearsDay && newYearsDayEnd ? calculateTimeLeft(newYearsDayEnd, now) : null),
    [isNewYearsDay, newYearsDayEnd, now],
  )

  const previousTargetYearRef = useRef<number>(targetDate.getFullYear())
  useEffect(() => {
    const nextYear = targetDate.getFullYear()
    if (nextYear !== previousTargetYearRef.current) {
      setYearJustRolled(true)
      previousTargetYearRef.current = nextYear
      const timeoutId = window.setTimeout(() => setYearJustRolled(false), 12_000)
      return () => window.clearTimeout(timeoutId)
    }
    return undefined
  }, [targetDate])

  return {
    now,
    targetDate,
    startOfYear,
    timeLeft,
    progress,
    isPremiereWindow,
    isFinalTen,
    isNewYearsDay,
    newYearsDayLeft,
    yearJustRolled,
  }
}
