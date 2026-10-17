import type { Facing, Mood } from '../types'

// 10x8 Chiikawa: a round white body with little bear ears, no outline. One character per pixel; '.' is transparent.
export const PALETTE: Record<string, string> = {
  W: '#ffffff', // body
  K: '#2a2a2a', // eyes
  k: '#8a8a8a', // closed or tired eyes, small mouth
  P: '#f5a3b5', // cheeks
  M: '#e8607a', // mouth
  Y: '#ffd84a', // sparkly eyes
  S: '#7ec8f0', // tears
  B: '#8fa8e8', // blanket
  b: '#5f78c0', // blanket shade
}

export const SPRITE = [
  '..W....W..',
  '.WWWWWWWW.',
  'WWKWWWWKWW',
  'WPWWkkWWPW',
  'WWWWWWWWWW',
  '.WWWWWWWW.',
  '..WWWWWW..',
  '...W..W...',
]

// Rows 1-4 (the face) per mood; the ears stay the same. The middle rows bulge a pixel each side so the cheeks round out.
const FACES: Record<Exclude<Mood, 'sleepy'>, string[]> = {
  idle: ['.WWWWWWWW.', 'WWKWWWWKWW', 'WPWWkkWWPW', 'WWWWWWWWWW'],
  happy: ['.WWWWWWWW.', 'WWKWWWWKWW', 'WPWWMMWWPW', 'WWWWMMWWWW'],
  excited: ['.WWWWWWWW.', 'WWYWWWWYWW', 'WPWWMMWWPW', 'WWWWMMWWWW'],
  tired: ['.WWWWWWWW.', 'WWkWWWWkWW', 'WWWWWWWWWW', 'WWWWkkWWWW'],
  // 까-앙: tears running down under each eye.
  worried: ['.WWWWWWWW.', 'WWKWWWWKWW', 'WPSWMMWSPW', 'WWSWWWWSWW'],
  yummy: ['.WWWWWWWW.', 'WWkWWWWkWW', 'WPWWMMWWPW', 'WWWWMMWWWW'],
}

// Idle eyes and mouth glance the way the stroll goes.
const IDLE_EYES: Record<Facing, string> = { 1: 'WWWKWWWWKW', [-1]: 'WKWWWWKWWW' }
const IDLE_MOUTH: Record<Facing, string> = { 1: 'WPWWWkkWPW', [-1]: 'WPWkkWWWPW' }

// 잘자...: tucked into a blue blanket, eyes closed.
const SLEEPY = [
  '..........',
  '..W....W..',
  '.WWWWWWWW.',
  'WWkWWWWkWW',
  'WPWWWWWWPW',
  'bBBBBBBBBb',
  'BBBBBBBBBB',
  '.bbbbbbbb.',
]

// Breathing in stretches the belly a row, so the head rises while the feet stay put.
const BELLY = { body: '.WWWWWWWW.', sleepy: 'BBBBBBBBBB' }

const FEET = ['...W..W...', '..W....W..']
const BLANK = '...........'

export type SpriteOptions = {
  // Strolling: shuffle the feet and glance toward `facing`.
  isWalking?: boolean
  frame?: number
  facing?: Facing
  // Raised a pixel, feet and all: a hop while walking.
  lift?: 0 | 1
  // Breathing in: the body grows a row with the feet planted.
  breath?: 0 | 1
}

// Picks the pixels for a mood on an 11x9 canvas, so the band never changes size.
export function spriteFor(mood: Mood, options: SpriteOptions = {}): string[] {
  const { isWalking = false, frame = 0, facing, lift = 0, breath = 0 } = options
  let body: string[]

  if (mood === 'sleepy') {
    body = [...SLEEPY]
  } else {
    const face = [...FACES[mood]]
    if (mood === 'idle' && facing !== undefined) {
      face[1] = IDLE_EYES[facing]
      face[2] = IDLE_MOUTH[facing]
    }
    body = [SPRITE[0]!, ...face, SPRITE[5]!, SPRITE[6]!, FEET[isWalking ? frame % 2 : 0]!]
  }

  if (breath) body.splice(6, 0, mood === 'sleepy' ? BELLY.sleepy : BELLY.body)
  const rows = body.map(row => `${row}.`)

  // Feet sit on the last pixel row, where the grass row below picks them up.
  if (breath) return rows
  return lift ? [...rows, BLANK] : [BLANK, ...rows]
}

export type Cell = { char: string; color?: string; backgroundColor?: string }

// Packs two pixel rows into one terminal row with half blocks, so pixels stay square.
export function toCells(sprite: string[] = SPRITE, palette: Record<string, string> = PALETTE): Cell[][] {
  const rows: Cell[][] = []
  for (let y = 0; y < sprite.length; y += 2) {
    const top = sprite[y] ?? ''
    const bottom = sprite[y + 1] ?? ''
    const row: Cell[] = []
    for (let x = 0; x < top.length; x++) {
      const t = palette[top[x]!]
      const b = palette[bottom[x] ?? '.']
      if (t && b) row.push({ char: '▀', color: t, backgroundColor: b })
      else if (t) row.push({ char: '▀', color: t })
      else if (b) row.push({ char: '▄', color: b })
      else row.push({ char: ' ' })
    }
    rows.push(row)
  }
  return rows
}
