// A soft strip of grass along the band's bottom edge, right above the engine's own line.
// Terminals have no alpha, so the grass greens are mixed into the theme's background.
const DARK_BACKGROUND = '#1e1e1e'
const LIGHT_BACKGROUND = '#ffffff'
const GRASS = '#9fd47f'
const GRASS_SHADE = '#7fbf6a'
export const GRASS_ALPHA = 0.28

function mix(color: string, under: string, alpha: number): string {
  const channel = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16)
  const out = [0, 1, 2].map(i => Math.round(channel(color, i) * alpha + channel(under, i) * (1 - alpha)))
  return `#${out.map(n => n.toString(16).padStart(2, '0')).join('')}`
}

// g and h are the grass's two tones; t is a taller tuft.
export function grassPalette(isLight: boolean): Record<string, string> {
  const under = isLight ? LIGHT_BACKGROUND : DARK_BACKGROUND
  return {
    g: mix(GRASS, under, GRASS_ALPHA),
    h: mix(GRASS_SHADE, under, GRASS_ALPHA),
    t: mix(GRASS, under, GRASS_ALPHA * 0.8),
  }
}

// The bottom two pixel rows across the band: the feet with a tuft here and there, then grass.
// Patterns follow the column, so the grass stays put while Chiikawa walks over it.
export function groundRows(feet: string, x: number, width: number): [string, string] {
  let top = ''
  let grass = ''
  for (let col = 0; col < width; col++) {
    const pixel = col >= x && col < x + feet.length ? feet[col - x]! : '.'
    top += pixel !== '.' ? pixel : col % 7 === 3 || col % 11 === 8 ? 't' : '.'
    grass += col % 5 === 2 || col % 3 === 0 ? 'h' : 'g'
  }
  return [top, grass]
}
