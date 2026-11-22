import { circle, dot, line, radialGradient, text, type Node } from 'vizmatic/stage'

export const COSMOS = {
    bg: '#070910',
    surface: '#111626',
    surfaceAlt: '#171d32',
    ink: '#f8f4ec',
    muted: '#b5c1d8',
    dim: '#6e7c9e',
    rule: '#26304a',
    gold: '#ffd166',
    cyan: '#5ce1e6',
    blue: '#60a5fa',
    violet: '#a78bfa',
    rose: '#ff6b8b',
    emerald: '#6ee7b7',
    amber: '#fb923c',
} as const

export function txt(
    value: string,
    x: number,
    y: number,
    size = 34,
    color: string = COSMOS.ink,
    font: 'mono' | 'serif' | 'sans' = 'sans',
    anchor: 'left' | 'center' | 'right' = 'center',
) {
    return text(value, { size, color, font: font === 'serif' ? 'text-serif' : font, anchor }).at(x, y)
}

export function rule(x1: number, y1: number, x2: number, y2: number, color: string = COSMOS.rule, width = 2) {
    return line([x1, y1], [x2, y2], { stroke: color, width })
}

export function nebula(x: number, y: number, radius: number, innerHex: string, midHex = '#07091000') {
    return circle(radius, {
        fill: radialGradient([0, 0], radius, [
            [0, innerHex],
            [0.5, midHex],
            [1, '#07091000'],
        ]),
        stroke: null,
    }).at(x, y)
}

/** Deterministic deep-space starfield (zero flicker across seeks and workers). */
export function starfield(count = 130, seed = 1, accentHex: string = COSMOS.gold): Node[] {
    const out: Node[] = []
    for (let i = 0; i < count; i++) {
        const sx = Math.sin((i + seed * 19) * 127.1 + 3.7) * 43758.5453
        const sy = Math.sin((i + seed * 31) * 269.5 + 9.1) * 19642.349
        const x = -940 + (sx - Math.floor(sx)) * 1880
        const y = -520 + (sy - Math.floor(sy)) * 1040
        const r = 0.7 + (i % 4) * 0.32
        const op = 0.14 + (i % 5) * 0.055
        out.push(dot(r, i % 11 === 0 ? accentHex : '#8ea4d2').opacity(op).at(x, y))
    }
    return out
}
