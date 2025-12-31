import { useEffect, useMemo, useRef, useState } from 'react'
import { getPromptsForDate } from '../prompts/messages'

type PromptOverlayProps = {
  isNewYearsDay: boolean
}

const PROMPT_INTERVAL_MS = 30_000
const PROMPT_VISIBLE_MS = 10_000

export const PromptOverlay = ({ isNewYearsDay }: PromptOverlayProps) => {
  const prompts = useMemo(() => getPromptsForDate(isNewYearsDay), [isNewYearsDay])
  const [promptIndex, setPromptIndex] = useState(0)
  const [promptVisible, setPromptVisible] = useState(false)
  const promptIntervalRef = useRef<number | null>(null)
  const promptHideTimerRef = useRef<number | null>(null)

  useEffect(() => {
    setPromptIndex(0)
  }, [prompts])

  useEffect(() => {
    if (!prompts.length) {
      return undefined
    }

    const showPrompt = () => {
      setPromptVisible(true)
      if (promptHideTimerRef.current) {
        window.clearTimeout(promptHideTimerRef.current)
      }
      promptHideTimerRef.current = window.setTimeout(() => setPromptVisible(false), PROMPT_VISIBLE_MS)
    }

    showPrompt()

    promptIntervalRef.current = window.setInterval(() => {
      setPromptIndex((prev) => (prev + 1) % prompts.length)
      showPrompt()
    }, PROMPT_INTERVAL_MS)

    return () => {
      if (promptIntervalRef.current) {
        window.clearInterval(promptIntervalRef.current)
      }
      if (promptHideTimerRef.current) {
        window.clearTimeout(promptHideTimerRef.current)
      }
    }
  }, [prompts])

  if (!prompts.length) {
    return null
  }

  const currentText = prompts[promptIndex]

  return (
    <div className={`floating-prompt ${promptVisible ? 'show' : 'hide'}`} aria-live="polite">
      <span
        key={promptIndex}
        className="prompt-text"
        style={{ ['--prompt-chars' as string]: currentText.length }}
      >
        {currentText}
      </span>
    </div>
  )
}
