export type MascotState = 'idle' | 'reading' | 'thinking' | 'checking' | 'celebrating' | 'confused' | 'asking' | 'responding'

export interface AnimationClip {
  row: number
  frames: number
  fps: number
  loop: boolean
  returnTo?: MascotState
  // Optional local strip for this pose; geometry remains 32 x 32.
  src?: string
  columns?: number
  rows?: number
}
export interface SpriteSheetConfig {
  src: string
  frameWidth: number
  frameHeight: number
  columns: number
  rows: number
  clips: Record<MascotState, AnimationClip>
}

// IHDR + visual inspection: Idle 320x32/10 frames; Box3 128x32/4;
// drculacat 192x32/6. All cells are 32x32, row 0.
// These are pack poses (idle, box, costume), not literal reading/talking art.
// Edit each clip's local src/geometry to replace its pose without repacking.
export const MASCOT_SHEET: SpriteSheetConfig = {
  src: '/mascot/catpack-idle.png',
  frameWidth: 32, frameHeight: 32, columns: 10, rows: 1,
  clips: {
    idle: { row: 0, frames: 10, fps: 8, loop: true },
    reading: { src: '/mascot/catpack-box.png', columns: 4, row: 0, frames: 4, fps: 5, loop: true },
    thinking: { src: '/mascot/catpack-box.png', columns: 4, row: 0, frames: 4, fps: 3, loop: true },
    checking: { src: '/mascot/catpack-box.png', columns: 4, row: 0, frames: 4, fps: 7, loop: true },
    celebrating: { src: '/mascot/catpack-answer.png', columns: 6, row: 0, frames: 6, fps: 8, loop: false, returnTo: 'idle' },
    confused: { src: '/mascot/catpack-answer.png', columns: 6, row: 0, frames: 6, fps: 3, loop: true },
    asking: { row: 0, frames: 10, fps: 6, loop: true },
    responding: { src: '/mascot/catpack-answer.png', columns: 6, row: 0, frames: 6, fps: 9, loop: true },
  },
}

export function statusToMascotState({ status, stage, needsAnchor = false }: {
  status?: string | null; stage?: string | null; needsAnchor?: boolean
}): MascotState {
  if (status === 'failed') return 'confused'
  if (status === 'completed') return needsAnchor ? 'asking' : 'celebrating'
  if (status === 'queued') return 'reading'
  if (status === 'processing') {
    if (stage === 'interpreting') return 'thinking'
    if (stage === 'validating' || stage === 'planning' || stage === 'persisting') return 'checking'
    return 'reading'
  }
  return 'idle'
}
