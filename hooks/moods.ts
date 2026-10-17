import type { Mood } from '../types'

// Captions from the character sheet's 다양한 표정.
export const CAPTIONS: Record<Mood, string> = {
  idle: '',
  happy: '행복해!',
  excited: '신나!',
  tired: '지쳐...',
  worried: '걱정돼...',
  yummy: '맛있는거 최고!',
  sleepy: '잘자... zZ',
}

export const MOODS = Object.keys(CAPTIONS) as Mood[]

const FOOD = /밥|먹|맛있|간식|배고|커피|버블티|라면|피자|치킨|food|eat|snack|lunch|dinner|coffee/i

export function isFoodTalk(text: string): boolean {
  return FOOD.test(text)
}
