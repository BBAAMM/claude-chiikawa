import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, Timer } from 'claude-code'

import type { Mood } from '../types'
import { CAPTIONS, MOODS, isFoodTalk } from './moods'
import { groundRows, grassPalette } from './ground'
import { PALETTE, spriteFor, toCells } from './sprite'
import { START_POSE, stepIdle } from './walk'

const mood = atom({ plugin: 'chiikawa', key: 'mood' } as const, 'idle')
// When the shown mood ends, kept in state so it survives a reload; null holds it until changed.
const moodUntil = atom({ plugin: 'chiikawa', key: 'moodUntil' } as const, null as number | null)
const frame = atom({ plugin: 'chiikawa', key: 'frame' } as const, 0)
const pose = atom({ plugin: 'chiikawa', key: 'pose' } as const, START_POSE)

const TICK_MS = 250
const MOOD_MS = 4000
const SLEEP_MS = 5 * 60 * 1000
const LONG_TURN_MS = 2 * 60 * 1000
const SPRITE_COLUMNS = 11
const CAPTION_COLUMNS = 16

let ticker: Timer | undefined
let sleepTimer: Timer | undefined
let isWorking = false
let startedAt = 0
let palette: Record<string, string> | undefined

// Mixes the grass into the theme's background once, and again when the theme changes.
async function loadPalette($: EngineInterface) {
  const theme = (await $.config.list()).find(row => row.key === 'theme')
  palette = { ...PALETTE, ...grassPalette(String(theme?.value ?? '').includes('light')) }
}

// Shows a mood for a while; the ticker puts it back to idle once it ends.
async function feel($: EngineInterface, next: Mood, ms: number | null = MOOD_MS) {
  const until = ms === null ? null : (await $.clock.now()) + ms
  await update($, moodUntil, () => until)
  await update($, mood, () => next)
}

// Dozes off under the blanket after a quiet while.
function scheduleSleep($: EngineInterface) {
  sleepTimer?.cancel()
  sleepTimer = $.clock.after(SLEEP_MS, () => void feel($, 'sleepy', null))
}

// Keeps the breathing clock running, and strolls while idle.
async function tick($: EngineInterface) {
  const until = await read($, moodUntil)
  let current = await read($, mood)
  const isOver = until === null ? current !== 'sleepy' : (await $.clock.now()) >= until
  if (current !== 'idle' && isOver) {
    await feel($, 'idle', null)
    current = 'idle'
  }

  await update($, frame, n => (n + 1) % 1200)
  if (!isWorking && current === 'idle') {
    await update($, pose, stepIdle)
  }
}

function startTicker($: EngineInterface) {
  ticker?.cancel()
  ticker = $.clock.every(TICK_MS, () => void tick($).catch(() => undefined))
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'chiikawa',
      description: '치이카와의 표정을 바꿔요 (happy, excited, tired, worried, yummy, sleepy)',
    })
    startTicker($)
    scheduleSleep($)

    return next(e)
  })

  on('command.run', { command: 'chiikawa' }, async ($, e) => {
    const picked = e.args.trim() as Mood
    if (!MOODS.includes(picked)) {
      return { text: `사용법: /chiikawa <${MOODS.join(' | ')}>` }
    }
    sleepTimer?.cancel()
    await feel($, picked, picked === 'sleepy' || picked === 'idle' ? null : MOOD_MS)
    scheduleSleep($)

    return { text: `치이카와: ${CAPTIONS[picked] || '...'}` }
  })

  on('prompt.submit', async ($, e, next) => {
    sleepTimer?.cancel()
    isWorking = true
    await $.clock
      .now()
      .then(now => {
        startedAt = now
        return feel($, isFoodTalk(e.text) ? 'yummy' : 'excited')
      })
      .catch(() => undefined)

    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    const ran = await next(e)
    if (ran.isError) {
      await feel($, 'worried').catch(() => undefined)
    }

    return ran
  })

  on('turn.complete', async ($, e, next) => {
    isWorking = false
    await update($, frame, () => 0)
    const tookMs = (await $.clock.now()) - startedAt
    if (e.reason === 'answer') {
      await feel($, tookMs > LONG_TURN_MS ? 'tired' : 'happy')
    } else {
      await feel($, 'worried')
    }
    scheduleSleep($)

    return next(e)
  })

  on('config.set', { key: 'theme' }, async ($, e, next) => {
    const result = await next(e)
    palette = undefined

    return result
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey || e.props.maxRows < 5) {
      return next(e)
    }

    // A reload mid-session may skip session.start; drawing restarts the ticker too.
    isWorking = e.props.isWorking
    if (!ticker) startTicker($)

    if (!palette) await loadPalette($).catch(() => undefined)
    const current = await read($, mood)
    const ticks = await read($, frame)
    const where = await read($, pose)
    const working = e.props.isWorking
    const strolling = current === 'idle' && !working
    const isWalking = strolling && where.mode === 'walk'
    // Ticks per breath half: quick while working, slow while asleep.
    const pace = working ? 2 : current === 'sleepy' ? 6 : 4
    const breath = isWalking ? 0 : ((Math.floor(ticks / pace) % 2) as 0 | 1)

    const sprite = spriteFor(current, {
      isWalking,
      frame: where.step,
      facing: strolling ? where.facing : undefined,
      lift: isWalking ? where.lift : 0,
      breath,
    })
    const dots = '.'.repeat((Math.floor(ticks / 2) % 3) + 1)
    const caption = CAPTIONS[current] || (working ? `열일 중${dots}` : isWalking ? '♪' : '')
    const room = Math.max(0, e.props.bodyColumns - SPRITE_COLUMNS - CAPTION_COLUMNS)
    const x = Math.min(where.x, room)
    const cells = toCells(sprite.slice(0, 8), palette)
    const ground = toCells(groundRows(sprite[8]!, x, e.props.bodyColumns), palette)[0]!
    const { Box, Text } = $.ui.resolve(e)

    return (
      <Box flexDirection="column">
        <Box flexDirection="row">
          <Box width={x} flexShrink={0} />
          <Box flexDirection="column" flexShrink={0}>
            {cells.map((row, y) => (
              <Text key={`r${y}`}>
                {row.map((cell, i) => (
                  <Text key={`c${i}`} color={cell.color} backgroundColor={cell.backgroundColor}>
                    {cell.char}
                  </Text>
                ))}
              </Text>
            ))}
          </Box>
          <Box flexDirection="column" justifyContent="center" paddingLeft={1}>
            <Text dimColor>{caption}</Text>
          </Box>
        </Box>
        <Text>
          {ground.map((cell, i) => (
            <Text key={`g${i}`} color={cell.color} backgroundColor={cell.backgroundColor}>
              {cell.char}
            </Text>
          ))}
        </Text>
      </Box>
    )
  })
}
