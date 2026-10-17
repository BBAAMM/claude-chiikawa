import type { Pose } from '../types'

export const WALK_RANGE = 24

export const START_POSE: Pose = { x: 0, facing: 1, mode: 'rest', step: 0, lift: 0, ticksLeft: 8, tick: 0 }

function between(rand: () => number, min: number, max: number): number {
  return min + Math.floor(rand() * (max - min + 1))
}

// One tick of the idle stroll: hop a cell per step, then stop a while (the drawing breathes).
export function stepIdle(pose: Pose, rand: () => number = Math.random, range = WALK_RANGE): Pose {
  const tick = pose.tick + 1

  if (pose.ticksLeft <= 0) {
    if (pose.mode === 'walk') {
      return { ...pose, mode: 'rest', step: 0, lift: 0, ticksLeft: between(rand, 12, 28), tick }
    }
    const facing = pose.x <= 0 ? 1 : pose.x >= range ? -1 : rand() < 0.5 ? 1 : -1
    return { ...pose, mode: 'walk', facing, ticksLeft: between(rand, 6, 16), tick }
  }

  if (pose.mode === 'rest') {
    return { ...pose, ticksLeft: pose.ticksLeft - 1, tick }
  }

  const facing = (pose.x + pose.facing < 0 || pose.x + pose.facing > range ? -pose.facing : pose.facing) as Pose['facing']
  const step = (pose.step ^ 1) as 0 | 1

  return { ...pose, x: pose.x + facing, facing, step, lift: step, ticksLeft: pose.ticksLeft - 1, tick }
}
