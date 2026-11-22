import {
    Node, circle, dot, dynamic, group, line, linear, polyPath, rect,
    type SceneFunction, type Vec,
} from 'vizmatic/stage'
import { COSMOS, nebula, txt } from '../../../factory/style'

const CORE_XS = [-600, -200, 200, 600] as const
const TASK_PALETTE = [COSMOS.cyan, COSMOS.blue, COSMOS.gold, COSMOS.violet, COSMOS.emerald] as const

export const tokioScene: SceneFunction = (s, c) => {
    const showRuntime = s.value(1)
    const phase = s.value(0)
    const stealU = s.value(0)
    const freezeC0 = s.value(0)
    const showEscape = s.value(0)
    const showSelect = s.value(0)
    const raceProg = s.value(0)
    const dropFlash = s.value(0)

    const rtCopy = group(
        txt('TOKIO MULTI-THREADED RUNTIME', -855, -425, 26, COSMOS.blue, 'mono', 'left'),
        txt('4-Core Work-Stealing Scheduler', -855, -360, 56, COSMOS.ink, 'serif', 'left').glow(5, COSMOS.blue),
    )

    // Stage 1: 4-Core work-stealing scheduler with 16 task blocks per core + half-batch (8 tasks) peeling off!
    const liveRuntime = dynamic(() => {
        if (showRuntime.value < 0.04) return []
        const a = showRuntime.value
        const ph = phase.value
        const u = stealU.value
        const fr = freezeC0.value
        const esc = showEscape.value

        const nodes: Node[] = [
            nebula(-600, -15, 320, fr > 0.25 ? '#ff6b8b28' : '#60a5fa22').opacity(a),
            nebula(400, -15, 360, '#ffd16618', '#6ee7b712').opacity(a),
        ]

        // Core chassis boxes + 4x4 local task block grids (16 slots each)
        const baseCounts = [16, 6, 0, 0]
        const stolenDone = u > 0.92
        const c0Visible = u > 0.04 ? 8 : baseCounts[0]!
        const c2Visible = stolenDone ? 4 : 0
        const c3Visible = stolenDone ? 4 : 0
        const counts = [c0Visible, baseCounts[1]!, c2Visible, c3Visible]

        for (let ci = 0; ci < 4; ci++) {
            const cx = CORE_XS[ci]!
            const isBlocked = ci === 0 && fr > 0.25 && esc < 0.6
            const strokeCol = isBlocked ? COSMOS.rose : ci === 0 ? COSMOS.blue : ci === 1 ? COSMOS.cyan : COSMOS.gold
            const statusText = isBlocked
                ? 'BLOCKED!'
                : ci === 0
                  ? `${counts[ci]} tasks`
                  : ci === 1
                    ? `${counts[ci]} tasks`
                    : stolenDone
                      ? `Stole 4`
                      : 'Idle core'

            nodes.push(
                rect(310, 325, {
                    fill: isBlocked ? '#22101d' : '#0d1426',
                    stroke: strokeCol,
                    width: isBlocked ? 4 : 2.8,
                    radius: 16,
                }).at(cx, 15).glow(isBlocked ? 14 : 7, strokeCol).opacity(a),
                txt(`Core ${ci}`, cx, -112, 30, strokeCol, 'serif').opacity(a),
                txt(statusText, cx, 146, 26, isBlocked ? COSMOS.rose : COSMOS.muted, 'mono').opacity(a),
            )

            // 4x4 grid of local queue slots inside each core (16 slots!)
            for (let slot = 0; slot < 16; slot++) {
                const colIdx = slot % 4
                const rowIdx = Math.floor(slot / 4)
                const bx = cx - 96 + colIdx * 64
                const by = -58 + rowIdx * 48
                const filled = slot < counts[ci]!
                const tCol = isBlocked && filled ? COSMOS.rose : TASK_PALETTE[(slot + ci) % TASK_PALETTE.length]!
                nodes.push(
                    rect(52, 36, {
                        fill: filled ? '#18243b' : '#0a101d',
                        stroke: filled ? tCol : '#1f2b47',
                        width: filled ? 2.4 : 1.2,
                        radius: 6,
                    }).at(bx, by).opacity(a).glow(filled ? 5 : 0, tCol),
                )
            }
        }

        // Half-batch of 8 glowing task blocks peeling off Core 0 and arcing to idle Core 2 (4) & Core 3 (4)!
        if (u > 0.02 && u < 0.98) {
            for (let k = 0; k < 8; k++) {
                const targetCore = k < 4 ? 2 : 3
                const dstSlot = k % 4
                const srcSlot = 8 + k
                const srcX = CORE_XS[0]! - 96 + (srcSlot % 4) * 64
                const srcY = -58 + Math.floor(srcSlot / 4) * 48
                const dstX = CORE_XS[targetCore]! - 96 + (dstSlot % 4) * 64
                const dstY = -58 + Math.floor(dstSlot / 4) * 48

                const localU = Math.max(0, Math.min(1, (u - k * 0.03) / 0.76))
                const lift = targetCore === 2 ? 210 : 275
                const curX = srcX + (dstX - srcX) * localU
                const curY = srcY + (dstY - srcY) * localU - Math.sin(localU * Math.PI) * lift

                // Glowing trail behind each stolen task block
                const trail: Vec[] = Array.from({ length: 12 }, (_, ti) => {
                    const tt = Math.max(0, localU - (ti / 11) * 0.28)
                    return [
                        srcX + (dstX - srcX) * tt,
                        srcY + (dstY - srcY) * tt - Math.sin(tt * Math.PI) * lift,
                    ] as Vec
                })
                const col = k < 4 ? COSMOS.gold : COSMOS.emerald
                nodes.push(
                    new Node(polyPath(trail)).stroke(col, 3.2, 0.72 * a).glow(8, col),
                    rect(46, 32, { fill: '#222014', stroke: col, width: 2.8, radius: 6 })
                        .at(curX, curY)
                        .glow(10, col)
                        .opacity(a),
                )
            }
            nodes.push(
                txt('STEAL HALF BATCH (8 / 16 TASKS)', 100, -252, 28, COSMOS.gold, 'mono')
                    .glow(8, COSMOS.gold)
                    .opacity(Math.sin(Math.min(1, u) * Math.PI) * a),
            )
        }

        // Escape lane: spawn_blocking / Rayon offload strip along bottom
        if (esc > 0.04) {
            const pulseX = -600 + ((ph * 360) % 600)
            nodes.push(
                new Node(polyPath([[-600, 178], [-600, 315], [0, 315]])).stroke(COSMOS.emerald, 4, 0.9 * esc * a).glow(10, COSMOS.emerald),
                dot(9, '#ffffff').at(pulseX, 315).glow(14, COSMOS.emerald).opacity(esc * a),
                rect(820, 76, { fill: '#0e2220', stroke: COSMOS.emerald, width: 3, radius: 12 })
                    .at(120, 315)
                    .glow(10, COSMOS.emerald)
                    .opacity(esc * a),
                txt('spawn_blocking()  /  Rayon CPU pool', 120, 315, 28, COSMOS.emerald, 'mono').opacity(esc * a),
            )
        }

        return group(...nodes)
    })

    // ── Stage 2: JoinSet + Semaphore + Animated select! Latency Race with Drop Unwind Sparks ──
    const selectCopy = group(
        txt('STRUCTURED ASYNC & CANCELLATION', 0, -425, 26, COSMOS.gold, 'mono'),
        txt('JoinSet, Semaphore, and select! Drop', 0, -360, 56, COSMOS.ink, 'serif').glow(5, COSMOS.gold),
    )

    const liveSelect = dynamic(() => {
        if (showSelect.value < 0.04) return []
        const a = showSelect.value
        const p = raceProg.value
        const df = dropFlash.value
        const ph = phase.value

        const laneL = -640
        const deadlineX = 440
        const rpcX = laneL + p * 760
        const tmoX = laneL + Math.min(1, p * 1.12) * (deadlineX - laneL)

        const nodes: Node[] = [
            nebula(0, 60, 480, df > 0.2 ? '#ff6b8b1e' : '#6ee7b71a', '#ffd16610').opacity(a),
            // Top bar: JoinSet + Semaphore permit slots
            rect(620, 84, { fill: '#0e1628', stroke: COSMOS.cyan, width: 2.5, radius: 12 }).at(-360, -230).opacity(a),
            txt('JoinSet: aborts unfinished on Drop', -360, -230, 26, COSMOS.cyan, 'mono').opacity(a),
            rect(620, 84, { fill: '#0e1628', stroke: COSMOS.gold, width: 2.5, radius: 12 }).at(360, -230).opacity(a),
            txt('Semaphore: permits 3 / 4', 360, -230, 26, COSMOS.gold, 'mono').opacity(a),

            // Millisecond axis ruler
            line([laneL, 255], [640, 255], { stroke: '#2c3c60', width: 2.5 }).opacity(a),
            txt('0 ms', laneL, 295, 26, COSMOS.dim, 'mono').opacity(a),
            txt('15 ms deadline', deadlineX, 295, 26, COSMOS.gold, 'mono').opacity(a),
            txt('25 ms', 640, 295, 26, COSMOS.dim, 'mono').opacity(a),
            line([deadlineX, -115], [deadlineX, 255], { stroke: COSMOS.gold, width: 3.5, dash: [10, 8] })
                .glow(10, COSMOS.gold)
                .opacity(a)
                ,

            // Race branch 1: slow RPC
            line([laneL, -25], [640, -25], { stroke: '#1f2b47', width: 2.5 }).opacity(a),
            new Node(polyPath([[laneL, -25], [rpcX, -25]]))
                .stroke(df > 0.2 ? COSMOS.rose : COSMOS.blue, 7, (df > 0.2 ? 0.55 : 0.92) * a)
                .glow(10, df > 0.2 ? COSMOS.rose : COSMOS.blue)
                ,
            txt('rpc_fetch().await', laneL, -72, 28, df > 0.2 ? COSMOS.rose : COSMOS.blue, 'mono', 'left').opacity(a),

            // Race branch 2: timeout wins!
            line([laneL, 145], [640, 145], { stroke: '#1f2b47', width: 2.5 }).opacity(a),
            new Node(polyPath([[laneL, 145], [tmoX, 145]]))
                .stroke(COSMOS.emerald, 7, 0.96 * a)
                .glow(12, COSMOS.emerald)
                ,
            dot(11, '#ffffff').at(tmoX, 145).glow(16, COSMOS.emerald).opacity(a),
            txt('tokio::time::sleep(15 ms)  ->  WINNER', laneL, 195, 28, COSMOS.emerald, 'mono', 'left').opacity(a),
        ]

        // Drop unwind sparks exploding off the losing rpc_fetch Future!
        if (df > 0.04) {
            for (let k = 0; k < 16; k++) {
                const ang = (k / 16) * Math.PI * 2 + ph * 1.4
                const dist = 24 + df * (58 + (k % 4) * 28)
                const sx = rpcX + Math.cos(ang) * dist
                const sy = -25 + Math.sin(ang) * dist * 0.72
                nodes.push(
                    dot(5.5, k % 2 === 0 ? COSMOS.rose : COSMOS.amber)
                        .at(sx, sy)
                        .glow(10, COSMOS.rose)
                        .opacity((1 - df * 0.35) * a)
                        ,
                )
            }
            nodes.push(
                circle(22 + df * 64, { fill: null, stroke: COSMOS.rose, width: 3.5 })
                    .at(rpcX, -25)
                    .opacity((1 - df * 0.45) * a)
                    .glow(12, COSMOS.rose)
                    ,
                txt('drop(rpc_fut)  ->  Drop::drop() unwinds', rpcX + 42, -72, 28, COSMOS.rose, 'mono', 'left')
                    .glow(8, COSMOS.rose)
                    .opacity(df * a),
                txt('socket closed · buffer freed', rpcX + 42, 22, 26, COSMOS.amber, 'mono', 'left').opacity(df * a),
            )
        }

        return group(...nodes)
    })

    s.add(rtCopy, liveRuntime)
    const fullDur = Math.max(8, c.end - c.start - 0.1)
    c.at(0.05, () => s.play(phase.to(fullDur * 0.9, { duration: fullDur, ease: linear })))
    c.on('steal half', () => s.play(stealU.to(1, { duration: 2.0 })))
    c.on('blocking a worker', () => s.play(freezeC0.to(1, { duration: 0.55 })))
    c.on('spawn blocking', () => s.play(showEscape.to(1, { duration: 0.65 })))

    c.on('structured lifecycles', () => {
        s.play(
            showRuntime.to(0, { duration: 0.3 }),
            showSelect.to(1, { duration: 0.35 }),
            raceProg.to(0.95, { duration: 4.5 }),
        )
    })
    c.swap('structured lifecycles', rtCopy, selectCopy)
    s.add(liveSelect)
    c.on('drops the losing', () => s.play(dropFlash.to(1, { duration: 0.95 })))
}
