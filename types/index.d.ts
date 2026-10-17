export type Mood = 'idle' | 'happy' | 'excited' | 'tired' | 'worried' | 'yummy' | 'sleepy'

export type Facing = 1 | -1

// Where the idle stroll is: walking hops along, resting breathes in place.
export type Pose = {
  x: number
  facing: Facing
  mode: 'walk' | 'rest'
  step: 0 | 1
  lift: 0 | 1
  ticksLeft: number
  tick: number
}

declare module 'claude-code' {
  interface PluginState {
    'chiikawa': { mood: Mood; moodUntil: number | null; frame: number; pose: Pose }
  }
}
