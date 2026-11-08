import { useState } from 'react'
import { MASCOT_SHEET } from './mascotStates'
import type { MascotState, SpriteSheetConfig } from './mascotStates'
import { useMediaQuery } from './useMediaQuery'
import { useSpriteAnimation } from './useSpriteAnimation'
import './mascot.css'

export interface PixelMascotProps {
  state: MascotState
  config?: SpriteSheetConfig
  scale?: number
  flip?: boolean
  label?: string
  className?: string
  motion?: 'system' | 'play' | 'pause'
}

function Playback({ state, config = MASCOT_SHEET, scale = 4, flip, label, className, motion = 'system' }: PixelMascotProps) {
  const [playing, setPlaying] = useState(state)
  const clip = config.clips[playing]
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)')
  const paused = motion === 'pause' || (motion === 'system' && reduced)
  const frame = useSpriteAnimation(clip, paused, () => {
    if (clip.returnTo) setPlaying(clip.returnTo)
  })
  const zoom = Number.isFinite(scale) ? Math.max(1, Math.floor(scale)) : 4
  return <div
    role={label ? 'img' : undefined}
    aria-label={label || undefined}
    aria-hidden={label ? undefined : true}
    className={`mascot-sprite ${className ?? ''}`}
    data-state={playing}
    data-animated={!paused}
    style={{
      width: config.frameWidth * zoom,
      height: config.frameHeight * zoom,
      flexShrink: 0,
      backgroundImage: `url("${clip.src ?? config.src}")`,
      backgroundSize: `${(clip.columns ?? config.columns) * config.frameWidth * zoom}px ${(clip.rows ?? config.rows) * config.frameHeight * zoom}px`,
      backgroundPosition: `${-frame * config.frameWidth * zoom}px ${-clip.row * config.frameHeight * zoom}px`,
      backgroundRepeat: 'no-repeat',
      imageRendering: 'pixelated',
      transform: flip ? 'scaleX(-1)' : undefined,
    }}
  />
}

export default function PixelMascot(props: PixelMascotProps) {
  return <Playback key={`${props.state}:${props.config?.src ?? MASCOT_SHEET.src}`} {...props} />
}
