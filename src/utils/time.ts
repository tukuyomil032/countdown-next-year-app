export type TimeLeft = {
  totalMs: number
  days: number
  hours: number
  minutes: number
  seconds: number
}

export const getNextYearTarget = () => {
  const now = new Date()
  return getNextYearTargetFrom(now)
}

export const getNextYearTargetFrom = (base: Date) => new Date(base.getFullYear() + 1, 0, 1, 0, 0, 0, 0)

export const calculateTimeLeft = (target: Date, now: Date = new Date()): TimeLeft => {
  const diff = target.getTime() - now.getTime()
  const clamped = Math.max(0, diff)
  const day = 1000 * 60 * 60 * 24
  const hour = 1000 * 60 * 60
  const minute = 1000 * 60

  const days = Math.floor(clamped / day)
  const hours = Math.floor((clamped % day) / hour)
  const minutes = Math.floor((clamped % hour) / minute)
  const seconds = Math.floor((clamped % minute) / 1000)

  return { totalMs: clamped, days, hours, minutes, seconds }
}

export const formatTwo = (value: number) => value.toString().padStart(2, '0')

export const getYearProgress = (now: Date, startOfYear: Date, target: Date) => {
  const total = target.getTime() - startOfYear.getTime()
  const elapsed = now.getTime() - startOfYear.getTime()
  if (now.getTime() >= target.getTime()) return 1
  if (elapsed <= 0 || total <= 0) return 0
  const ratio = elapsed / total
  // Keep below 100% until完全到達
  return Math.min(0.9999, Math.max(0, ratio))
}
