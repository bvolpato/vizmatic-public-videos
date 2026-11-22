import {
    Node, circle, dot, dynamic, group, line, linear, linearGradient, polyPath, rect,
    type SceneFunction, type Vec,
} from 'vizmatic/stage'
import { COSMOS, nebula, txt } from '../../../factory/style'

const SLICE_COLS = [COSMOS.cyan, COSMOS.blue, COSMOS.violet, COSMOS.gold] as const
const SLICE_LABELS = ['&mut [0..4]', '&mut [4..8]', '&mut [8..12]', '&mut [12..16]'] as const
const INIT_VALS = [10, 14, 21, 18, 32, 27, 41, 36, 54, 49, 63, 58, 71, 66, 82, 77] as const

export const scopes: SceneFunction = (s, c) => {
    const showScope = s.value(1)
    const ambient = s.value(0)
    const partition = s.value(0)
    const beamProg = s.value(0)
    const showChan = s.value(0)
    const fillLevel = s.value(0)
    const flowPhase = s.value(0)

    const scopeCopy = group(
        txt('std::thread::scope', 0, -425, 58, COSMOS.cyan, 'serif').glow(6, COSMOS.cyan),
        txt('Parent stack buffer partitions into 4 disjoint &mut slices — zero Arc, zero locks', 0, -360, 28, COSMOS.muted, 'sans'),
    )

    // Populated IMMEDIATELY at t=0: parent stack frame + 16-cell contiguous buffer + 4 worker lanes + join rails!
    const liveScope = dynamic(() => {
        if (showScope.value < 0.04) return []
        const a = showScope.value
        const amb = ambient.value
        const part = partition.value
        const prog = beamProg.value

        const nodes: Node[] = [
            nebula(0, 10, 520, '#5ce1e618', '#ffd16610').opacity(a),
            // Parent stack frame bar holding 16 contiguous cells at y = -230
            rect(1440, 128, { fill: '#0d1426', stroke: part > 0.2 ? COSMOS.gold : '#324269', width: 2.5, radius: 14 })
                .at(0, -225)
                .opacity(a),
            txt('PARENT STACK FRAME  ·  let mut buf: [u32; 16]', -695, -310, 26, COSMOS.gold, 'mono', 'left').opacity(a),
            txt(
                part > 0.2 ? 'chunks_mut(4) -> 4 DISJOINT BORROWS' : 'LOCAL STACK MEMORY (NOT \'static)',
                695,
                -310,
                26,
                part > 0.2 ? COSMOS.emerald : COSMOS.muted,
                'mono',
                'right',
            ).opacity(a),
        ]

        // 16 contiguous cells — physically separate slightly into 4 color-coded disjoint slices when partition -> 1!
        const cellW = 76
        const groupGap = 24 * part
        const totalSpan = 16 * (cellW + 4) + 3 * groupGap
        const startX = -totalSpan / 2 + cellW / 2

        for (let i = 0; i < 16; i++) {
            const gIdx = Math.floor(i / 4)
            const inG = i % 4
            const cx = startX + i * (cellW + 4) + gIdx * groupGap
            const col = SLICE_COLS[gIdx]!
            const activeSlice = part > 0.15
            // Live in-place mutation as worker pulse crosses cell i's phase!
            const cellProg = Math.max(0, Math.min(1, (prog * 1.15 - (inG * 0.18 + gIdx * 0.04)) * 2.4))
            const val = INIT_VALS[i]! + Math.round(cellProg * 10)
            const mutated = cellProg > 0.5
            const border = activeSlice ? col : '#2c3c60'
            const fill = mutated ? '#162838' : activeSlice ? '#121c33' : '#101729'

            nodes.push(
                rect(cellW, 74, { fill, stroke: border, width: mutated ? 3 : 2, radius: 8 })
                    .at(cx, -225)
                    .opacity(a)
                    .glow(mutated ? 8 : 0, col),
                txt(String(val), cx, -225, 26, mutated ? '#ffffff' : activeSlice ? col : COSMOS.muted, 'mono').opacity(a),
            )
        }

        // Start & guaranteed join vertical glowing rails
        const railL = -580
        const railR = 640
        const joinHit = Math.max(0, Math.min(1, (prog - 0.85) / 0.15))
        nodes.push(
            line([railL, -108], [railL, 315], { stroke: COSMOS.gold, width: 3.5 }).glow(8, COSMOS.gold).opacity(a),
            line([railR, -108], [railR, 315], { stroke: COSMOS.emerald, width: 4 + joinHit * 2.5 })
                .glow(10 + joinHit * 10, COSMOS.emerald)
                .opacity(a)
                ,
            txt('scope start', railL, 355, 26, COSMOS.gold, 'mono').opacity(a),
            txt('guaranteed join', railR, 355, 26, COSMOS.emerald, 'mono').opacity(a),
            txt('Zero Arc · Zero copies · Zero locks', 30, 355, 28, COSMOS.emerald, 'mono').opacity(a * (0.45 + 0.55 * part)),
        )

        // 4 worker lanes with continuous ambient activity + streaming per-element mutation pulses
        for (let w = 0; w < 4; w++) {
            const y = -62 + w * 106
            const col = SLICE_COLS[w]!
            // Background track rail visible immediately at t = 0
            nodes.push(
                line([railL, y], [railR, y], { stroke: '#23304f', width: 2.5 }).opacity(a),
                txt(SLICE_LABELS[w]!, railL - 22, y, 26, col, 'mono', 'right').opacity(a),
            )

            // Subtle ambient standby pulse at t = 0 before scope launches
            if (prog < 0.05) {
                const idleX = railL + ((amb * 120 + w * 95) % 220)
                nodes.push(dot(5, col).at(idleX, y).opacity(0.45 * a).glow(6, col))
            } else {
                const wProg = Math.min(1, Math.max(0, prog * 1.08 - w * 0.04))
                const endX = railL + wProg * (railR - railL)
                nodes.push(
                    new Node(polyPath([[railL, y], [endX, y]])).stroke(col, 6, 0.92 * a).glow(10, col),
                    dot(10, '#ffffff').at(endX, y).glow(14, col).opacity(a),
                )
                // 4 per-element mutation pulses streaming along each worker beam
                for (let e = 0; e < 4; e++) {
                    const px = railL + Math.min(wProg, (e + 0.5) / 4) * (railR - railL)
                    if (px < endX - 18) {
                        nodes.push(
                            circle(11, { fill: '#0e1828', stroke: col, width: 2.2 }).at(px, y).opacity(a).glow(6, col),
                        )
                    }
                }
            }

            // Join barrier convergence spark
            if (joinHit > 0.05) {
                nodes.push(
                    circle(14 + joinHit * 22, { fill: null, stroke: COSMOS.emerald, width: 3 })
                        .at(railR, y)
                        .opacity((1 - joinHit * 0.4) * a)
                        .glow(10, COSMOS.emerald)
                        ,
                )
            }
        }

        return group(...nodes)
    })

    // ── Stage 2: Atomic Acquire/Release + 8-Slot Bounded mpsc Ring-Buffer Pipeline ──
    const chanCopy = group(
        txt('Atomics & Bounded Channels', 0, -425, 58, COSMOS.ink, 'serif').glow(6, COSMOS.amber),
        txt('Lock-free Acquire/Release flags  ·  Ownership transfer with backpressure', 0, -360, 28, COSMOS.muted, 'sans'),
    )

    const liveChan = dynamic(() => {
        if (showChan.value < 0.04) return []
        const a = showChan.value
        const filled = Math.round(fillLevel.value)
        const ph = flowPhase.value
        const isFull = filled >= 8
        const isDrained = filled === 0 && ph > 3.5

        const pipeGrad = linearGradient([-580, 70], [580, 70], [COSMOS.amber, COSMOS.cyan, COSMOS.emerald])
        const nodes: Node[] = [
            nebula(0, 75, 480, isFull ? '#ff6b8b24' : '#5ce1e61e', '#6ee7b712').opacity(a),
            // Top strip: Atomic Acquire/Release ordering arc
            rect(1340, 108, { fill: '#0d1426', stroke: '#2c3d62', width: 2, radius: 12 }).at(0, -215).opacity(a),
            txt('AtomicBool::store(true, Release)', -630, -215, 26, COSMOS.amber, 'mono', 'left').opacity(a),
            txt('AtomicBool::load(Acquire)', 630, -215, 26, COSMOS.emerald, 'mono', 'right').opacity(a),
            line([-100, -215], [160, -215], { stroke: COSMOS.cyan, width: 3.5 }).glow(8, COSMOS.cyan).opacity(a),
            dot(8, '#ffffff').at(-100 + ((ph * 160) % 260), -215).glow(12, COSMOS.cyan).opacity(a),
            txt('happens-before', 30, -252, 26, COSMOS.cyan, 'mono').opacity(a),

            // Bounded mpsc pipeline spine
            new Node(polyPath([[-560, 75], [560, 75]])).stroke(pipeGrad, 4, 0.65 * a),
            // Producer nodes on left
            circle(56, { fill: '#14192a', stroke: isFull ? COSMOS.rose : COSMOS.amber, width: 4 })
                .at(-690, 75)
                .glow(12, isFull ? COSMOS.rose : COSMOS.amber)
                .opacity(a),
            txt('tx', -690, 75, 32, isFull ? COSMOS.rose : COSMOS.amber, 'mono').opacity(a),
            txt('Producers', -690, -15, 28, COSMOS.amber, 'serif').opacity(a),
            txt(isFull ? 'PARKED!' : 'tx.send(ev)', -690, 162, 26, isFull ? COSMOS.rose : COSMOS.muted, 'mono').opacity(a),

            // Consumer node on right
            circle(56, { fill: '#14192a', stroke: COSMOS.emerald, width: 4 })
                .at(690, 75)
                .glow(12, COSMOS.emerald)
                .opacity(a),
            txt('rx', 690, 75, 32, COSMOS.emerald, 'mono').opacity(a),
            txt('Consumer', 690, -15, 28, COSMOS.emerald, 'serif').opacity(a),
            txt(isDrained ? 'None -> exit' : 'for ev in rx', 690, 162, 26, COSMOS.emerald, 'mono').opacity(a),
        ]

        // 8-slot bounded ring buffer chassis
        nodes.push(
            rect(940, 134, {
                fill: '#0b1120',
                stroke: isFull ? COSMOS.rose : COSMOS.cyan,
                width: isFull ? 3.5 : 2.5,
                radius: 16,
            }).at(0, 75).opacity(a).glow(isFull ? 14 : 6, isFull ? COSMOS.rose : COSMOS.cyan),
        )

        for (let i = 0; i < 8; i++) {
            const sx = -385 + i * 110
            const active = i < filled
            const col = isFull ? COSMOS.gold : COSMOS.cyan
            nodes.push(
                rect(88, 88, {
                    fill: active ? '#17253a' : '#0e1424',
                    stroke: active ? col : '#263350',
                    width: active ? 3.5 : 1.8,
                    radius: 10,
                }).at(sx, 75).opacity(a).glow(active ? 9 : 0, col),
                txt(active ? `e${i + 1}` : '·', sx, 75, 28, active ? col : '#475575', 'mono').opacity(a),
            )
        }

        // Backpressure shockwave pulsing upstream toward producer when full
        if (isFull) {
            const waveX = -465 - ((ph * 180) % 160)
            nodes.push(
                line([-465, 75], [-625, 75], { stroke: COSMOS.rose, width: 5 }).glow(14, COSMOS.rose).opacity(a),
                circle(16 + ((ph * 40) % 24), { fill: null, stroke: COSMOS.rose, width: 3 })
                    .at(waveX, 75)
                    .glow(10, COSMOS.rose)
                    .opacity(0.85 * a)
                    ,
            )
        } else if (filled > 0) {
            const px = -610 + ((ph * 220) % 140)
            const qx = 475 + ((ph * 220) % 140)
            nodes.push(
                dot(8.5, COSMOS.amber).at(px, 75).glow(12, COSMOS.amber).opacity(a),
                dot(8.5, COSMOS.emerald).at(qx, 75).glow(12, COSMOS.emerald).opacity(a),
            )
        }

        const status = isFull
            ? 'BUFFER FULL (8/8)  —  BACKPRESSURE PUSHES UPSTREAM'
            : isDrained
              ? 'ALL SENDERS DROPPED  —  CONSUMER DRAINS & EXITS CLEANLY'
              : `BOUNDED MPSC RING  (${filled}/8 OWNED BATCHES IN FLIGHT)`
        nodes.push(
            txt(status, 0, 268, 28, isFull ? COSMOS.gold : COSMOS.emerald, 'mono').glow(6, isFull ? COSMOS.gold : COSMOS.emerald).opacity(a),
        )
        return group(...nodes)
    })

    s.add(scopeCopy, liveScope)

    const scopeDur = Math.max(4, c.cue('When threads coordinate').start - c.start - 0.2)
    c.at(0.04, () => {
        s.play(ambient.to(scopeDur, { duration: scopeDur, ease: linear }))
    })
    c.on('Switch to thread scope', () => {
        s.play(
            partition.to(1, { duration: 0.7 }),
            beamProg.to(1.05, { duration: 4.2 }),
        )
    })

    const chanDur = Math.max(4, c.end - c.cue('When threads coordinate').start - 0.25)
    c.on('When threads coordinate', () => {
        s.play(
            showScope.to(0, { duration: 0.3 }),
            showChan.to(1, { duration: 0.35 }),
            fillLevel.to(4, { duration: 1.6 }),
            flowPhase.to(chanDur * 1.1, { duration: chanDur, ease: linear }),
        )
    })
    c.swap('When threads coordinate', scopeCopy, chanCopy)
    s.add(liveChan)
    c.on('Once full', () => s.play(fillLevel.to(8, { duration: 1.1 })))
    c.on('drains and exits', () => s.play(fillLevel.to(0, { duration: 1.5 })))
}
