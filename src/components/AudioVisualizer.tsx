import { useEffect, useRef } from 'react'
import AudioMotionAnalyzer from 'audiomotion-analyzer'

type AudioVisualizerProps = {
  source: HTMLAudioElement | null | undefined
}

export const AudioVisualizer = ({ source }: AudioVisualizerProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const analyzerRef = useRef<AudioMotionAnalyzer | null>(null)
  const inputRef = useRef<AudioNode | null>(null)

  useEffect(() => {
    if (!containerRef.current) return undefined
    const instance = new AudioMotionAnalyzer(containerRef.current, {
      gradient: 'rainbow',
      showScaleX: false,
      showScaleY: false,
      overlay: true,
      lineWidth: 2,
      fillAlpha: 0.15,
      ledBars: false,
      reflexRatio: 0.14,
      smoothing: 0.8,
      alphaBars: true,
      ansiBands: false,
      mode: 0,
    })
    analyzerRef.current = instance

    return () => {
      instance.destroy()
      analyzerRef.current = null
      inputRef.current = null
    }
  }, [])

  useEffect(() => {
    const analyzer = analyzerRef.current
    if (!analyzer || !source) return

    try {
      const node = analyzer.audioCtx.createMediaElementSource(source)
      analyzer.connectInput(node)
      inputRef.current = node
      return () => {
        if (inputRef.current) {
          analyzer.disconnectInput(inputRef.current)
          inputRef.current.disconnect()
        }
        inputRef.current = null
      }
    } catch (err) {
      console.warn('Visualizer connect failed', err)
    }
    return undefined
  }, [source])

  return <div ref={containerRef} className="audio-visualizer" aria-hidden />
}