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

function parseRgbaHex(hex: string): [number, number, number, number] {
    const clean = hex.replace('#', '')
    const r = Number.parseInt(clean.slice(0, 2), 16) || 0
    const g = Number.parseInt(clean.slice(2, 4), 16) || 0
    const b = Number.parseInt(clean.slice(4, 6), 16) || 0
    const a = clean.length >= 8 ? Number.parseInt(clean.slice(6, 8), 16) : 255
    return [r, g, b, Number.isNaN(a) ? 255 : a]
}

function toRgbaHex(r: number, g: number, b: number, a: number): string {
    const hex = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')
    return `#${hex(r)}${hex(g)}${hex(b)}${hex(a)}`
}

export function nebula(x: number, y: number, radius: number, innerHex: string, midHex = '#07091000') {
    // Expand stage-wide background nebulas past the 1920x1080 corners so their outer edge never forms a visible ring.
    const r = radius >= 700 ? Math.max(radius, 1220) : radius
    const c0 = parseRgbaHex(innerHex)
    const cMid = parseRgbaHex(midHex)
    const hasMid = cMid[3] > 0
    const cEnd: [number, number, number, number] = [7, 9, 16, 0]
    const rawGamma = hasMid && c0[3] > 0 && cMid[3] < c0[3] ? Math.log(cMid[3] / c0[3]) / Math.log(0.5) : 1.15
    const gamma = Math.max(0.75, Math.min(2.6, rawGamma))
    const stops: [number, string][] = []
    const steps = 8
    for (let i = 0; i <= steps; i++) {
        const u = i / steps
        // Strictly monotonic C1 cosine-power falloff avoids Mach-band derivative kinks at midpoint and outer edge.
        const alphaWeight = Math.pow(0.5 * (1 + Math.cos(Math.PI * u)), gamma)
        const tint = Math.min(1, u * 1.4)
        const baseR = hasMid ? c0[0] + (cMid[0] - c0[0]) * tint : c0[0]
        const baseG = hasMid ? c0[1] + (cMid[1] - c0[1]) * tint : c0[1]
        const baseB = hasMid ? c0[2] + (cMid[2] - c0[2]) * tint : c0[2]
        const outR = baseR * alphaWeight + cEnd[0] * (1 - alphaWeight)
        const outG = baseG * alphaWeight + cEnd[1] * (1 - alphaWeight)
        const outB = baseB * alphaWeight + cEnd[2] * (1 - alphaWeight)
        const outA = c0[3] * alphaWeight
        stops.push([Number(u.toFixed(3)), toRgbaHex(outR, outG, outB, outA)])
    }
    return circle(r, {
        fill: radialGradient([0, 0], r, stops),
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
