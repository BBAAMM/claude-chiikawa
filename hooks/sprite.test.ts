import { test, expect } from 'claude-code/testing'

import type { Pose } from '../types'
import { GRASS_ALPHA, grassPalette, groundRows } from './ground'
import { MOODS, isFoodTalk } from './moods'
import { SPRITE, spriteFor, toCells } from './sprite'
import { START_POSE, WALK_RANGE, stepIdle } from './walk'

test('base sprite is 10x8', () => {
  expect(SPRITE.length).toBe(8)
  for (const row of SPRITE) expect(row.length).toBe(10)
})

test('every mood, frame, lift and breath packs into 4 rows of 11 cells above the ground', () => {
  for (const mood of MOODS) {
    for (const frame of [0, 1]) {
      for (const lift of [0, 1] as const) {
        for (const breath of [0, 1] as const) {
          const sprite = spriteFor(mood, { isWalking: true, frame, lift, breath })
          expect(sprite.length).toBe(9)
          const cells = toCells(sprite.slice(0, 8))
          expect(cells.length).toBe(4)
          for (const row of cells) expect(row.length).toBe(11)
        }
      }
    }
  }
})

test('walking frames shuffle the feet, still frames do not', () => {
  expect(spriteFor('idle', { isWalking: true, frame: 1 })).not.toEqual(spriteFor('idle', { isWalking: true, frame: 0 }))
  expect(spriteFor('idle', { frame: 1 })).toEqual(spriteFor('idle', { frame: 0 }))
})

test('breathing in raises the head but keeps the feet planted', () => {
  for (const mood of MOODS) {
    const out = spriteFor(mood)
    const inn = spriteFor(mood, { breath: 1 })
    expect(inn[8]).toBe(out[8])
    expect(out[8]).not.toBe('...........')
    expect(inn[0]).toBe(out[1])
  }
})

test('idle eyes look the way it walks', () => {
  expect(spriteFor('idle', { facing: 1 })).not.toEqual(spriteFor('idle', { facing: -1 }))
})

test('idle mouth shifts a pixel the way it walks', () => {
  const mouthAt = (facing?: 1 | -1) => spriteFor('idle', { facing })[4]!.indexOf('kk')
  expect(mouthAt(1)).toBe(mouthAt() + 1)
  expect(mouthAt(-1)).toBe(mouthAt() - 1)
})

test('walking hops along and turns at the edges', () => {
  let pose: Pose = { ...START_POSE, mode: 'walk', ticksLeft: 100 }
  const seen = new Set<number>()
  for (let i = 0; i < 80; i++) {
    pose = stepIdle(pose, () => 0.5)
    expect(pose.x).toBeGreaterThanOrEqual(0)
    expect(pose.x).toBeLessThanOrEqual(WALK_RANGE)
    expect(pose.lift).toBe(pose.step)
    seen.add(pose.facing)
  }
  expect(seen.size).toBe(2)
})

test('it stops to rest in place without hopping', () => {
  let pose: Pose = { ...START_POSE, x: 5, mode: 'walk', ticksLeft: 0 }
  pose = stepIdle(pose, () => 0)
  expect(pose.mode).toBe('rest')
  for (let i = 0; i < 10; i++) {
    pose = stepIdle(pose, () => 0)
    expect(pose.x).toBe(5)
    expect(pose.lift).toBe(0)
  }
})

test('food talk is noticed', () => {
  expect(isFoodTalk('점심 뭐 먹지')).toBe(true)
  expect(isFoodTalk('fix the build')).toBe(false)
})

test('grass spans the band under the feet in soft greens', () => {
  const [top, grass] = groundRows('..DG..GD...', 4, 40)
  expect(grass.length).toBe(40)
  expect(top.slice(6, 8)).toBe('DG')
  expect(GRASS_ALPHA).toBeLessThan(0.5)
  const dark = grassPalette(false)
  for (const color of Object.values(dark)) expect(parseInt(color.slice(1, 3), 16)).toBeLessThan(0x70)
  const light = grassPalette(true)
  for (const color of Object.values(light)) expect(parseInt(color.slice(1, 3), 16)).toBeGreaterThan(0xd0)
})

test('plain white Chiikawa with ears, no frog hood or outline', () => {
  for (const mood of MOODS) {
    const sprite = spriteFor(mood).join('')
    expect(sprite.includes('G')).toBe(false)
    expect(sprite.includes('O')).toBe(false)
  }
  expect(spriteFor('worried').join('').includes('S')).toBe(true)
})
