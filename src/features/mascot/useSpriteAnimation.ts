import { useEffect, useEffectEvent, useState } from 'react'
import type { AnimationClip } from './mascotStates'

export function nextFrame(current: number, frames: number, loop: boolean) {
  if (current + 1 < frames) return { frame: current + 1, finished: false }
  return loop ? { frame: 0, finished: false } : { frame: Math.max(0, frames - 1), finished: true }
}

export function useSpriteAnimation(clip: AnimationClip, paused: boolean, onEnd?: () => void): number {
  const [snapshot, setSnapshot] = useState({ clip, paused, frame: 0 })
  const notifyEnd = useEffectEvent(() => onEnd?.())
  useEffect(() => {
    setSnapshot({ clip, paused, frame: 0 })
    if (paused || clip.frames < 1 || clip.fps <= 0) return
    let current = 0
    const interval = window.setInterval(() => {
      const next = nextFrame(current, clip.frames, clip.loop)
      current = next.frame
      setSnapshot({ clip, paused, frame: current })
      if (next.finished) {
        window.clearInterval(interval)
        notifyEnd()
      }
    }, 1000 / clip.fps)
    return () => window.clearInterval(interval)
  }, [clip, paused])
  return paused || snapshot.clip !== clip || snapshot.paused !== paused ? 0 : snapshot.frame
}
