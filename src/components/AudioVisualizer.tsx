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
      gradient: 'prism',
      showScaleX: false,
      showScaleY: false,
      overlay: true,
      lineWidth: 3,
      fillAlpha: 0.4,
      ledBars: true,
      reflexRatio: 0.28,
      reflexAlpha: 0.35,
      smoothing: 0.65,
      alphaBars: false,
      ansiBands: false,
      barSpace: 0.25,
      loRes: false,
      showBgColor: false,
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