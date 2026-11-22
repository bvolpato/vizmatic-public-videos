import {
    Node, circle, dot, dynamic, group, line, linear, polyPath, rect,
    type SceneFunction, type Vec,
} from 'vizmatic/stage'
import { COSMOS, nebula, txt } from '../../../factory/style'

export const batching: SceneFunction = (s, c) => {
    const race = s.value(0)
    const batchFocus = s.value(0)
    const sqpollFocus = s.value(0)

    const header = group(
        txt('32 SYNCHRONIZED 4 KiB READS  ·  LIVE RACE', -855, -425, 26, COSMOS.emerald, 'mono', 'left'),
        txt('From 32 Syscalls -> 1 Enter -> 0 (SQPOLL)', -855, -360, 54, COSMOS.ink, 'serif', 'left').glow(5, COSMOS.emerald),
    )

    const liveRace = dynamic(() => {
        const t = race.value
        const bf = batchFocus.value
        const sf = sqpollFocus.value

        const laneL = -520
        const laneR = 450
        const laneW = laneR - laneL
        const lanes = [
            { y: -170, title: '1. Classic read()', col: COSMOS.rose, opsDone: Math.min(32, Math.floor(t * 28)), syscalls: Math.min(32, Math.floor(t * 28)), speedLabel: '1.0x' },
            { y: 35, title: '2. io_uring batch', col: COSMOS.gold, opsDone: Math.min(32, Math.floor(Math.max(0, t - 0.05) * 44)), syscalls: t > 0.25 ? 1 : 0, speedLabel: '4.2x' },
            { y: 240, title: '3. SQPOLL mode', col: COSMOS.emerald, opsDone: Math.min(32, Math.floor(t * 58)), syscalls: 0, speedLabel: '6.8x' },
        ] as const

        const nodes: Node[] = [
            nebula(0, 35, 520, sf > 0.3 ? '#6ee7b722' : bf > 0.3 ? '#ffd16620' : '#ff6b8b1c'),
            txt('OPERATION TIMELINE (USER / KERNEL CROSSINGS)', -35, -290, 26, COSMOS.muted, 'mono'),
            txt('SYSCALLS', 685, -290, 26, COSMOS.muted, 'mono'),
        ]

        // Lane 1: Classic read() — 32 jagged crimson kernel-boundary trap spikes!
        {
            const ln = lanes[0]!
            const prog = Math.min(1, t * 0.88)
            const activeSpikes = Math.max(1, Math.floor(prog * 32))
            nodes.push(
                rect(laneW + 30, 146, { fill: '#140c16', stroke: '#5a2234', width: 2, radius: 12 }).at((laneL + laneR) / 2, ln.y),
                line([laneL, ln.y], [laneR, ln.y], { stroke: '#4d2536', width: 1.8, dash: [8, 8] }),
                txt(ln.title, -855, ln.y - 24, 28, ln.col, 'mono', 'left'),
                txt('1 trap per 4 KiB read', -855, ln.y + 22, 26, COSMOS.muted, 'sans', 'left'),
            )
            const pts: Vec[] = [[laneL, ln.y - 34]]
            for (let k = 0; k < activeSpikes; k++) {
                const xA = laneL + (k / 32) * laneW
                const xM = laneL + ((k + 0.5) / 32) * laneW
                const xB = laneL + ((k + 1) / 32) * laneW
                pts.push([xA, ln.y - 34], [xM, ln.y + 42], [xB, ln.y - 34])
            }
            const tip = pts[pts.length - 1]!
            nodes.push(
                new Node(polyPath(pts)).stroke(COSMOS.rose, 2.8, 0.92).glow(7, COSMOS.rose),
                dot(8, '#ffffff').at(tip[0], tip[1]).glow(12, COSMOS.rose),
            )
            // Right syscall bar (32/32 full crimson)
            const barW = Math.max(8, (ln.syscalls / 32) * 280)
            nodes.push(
                rect(290, 44, { fill: '#0c1120', stroke: '#293554', width: 1.8, radius: 8 }).at(685, ln.y - 16),
                rect(barW, 34, { fill: COSMOS.rose, stroke: null, radius: 6 }).at(540 + barW / 2, ln.y - 16).glow(8, COSMOS.rose),
                txt(`${ln.syscalls} syscalls`, 685, ln.y + 34, 28, COSMOS.rose, 'mono'),
            )
        }

        // Lane 2: io_uring Batch — 32 gold SQEs packed -> 1 single io_uring_enter pulse -> 32 emerald completions!
        {
            const ln = lanes[1]!
            const prog = Math.min(1, Math.max(0, t - 0.04) * 1.38)
            const packed = Math.min(32, Math.floor(prog * 64))
            const entered = prog >= 0.45
            const compCount = entered ? Math.min(32, Math.floor((prog - 0.45) * 60)) : 0
            const enterX = laneL + laneW * 0.48
            nodes.push(
                rect(laneW + 30, 146, {
                    fill: '#141320',
                    stroke: bf > 0.3 && sf < 0.5 ? COSMOS.gold : '#3a3954',
                    width: bf > 0.3 && sf < 0.5 ? 3.2 : 2,
                    radius: 12,
                }).at((laneL + laneR) / 2, ln.y).glow(bf > 0.3 && sf < 0.5 ? 10 : 0, COSMOS.gold),
                line([laneL, ln.y], [laneR, ln.y], { stroke: '#3a3a52', width: 1.8, dash: [8, 8] }),
                txt(ln.title, -855, ln.y - 24, 28, ln.col, 'mono', 'left'),
                txt('Pack 32 -> 1 enter()', -855, ln.y + 22, 26, COSMOS.muted, 'sans', 'left'),
            )
            // 32 gold SQE mini-blocks packing on the left half (User side)
            for (let k = 0; k < packed; k++) {
                const bx = laneL + 10 + (k / 32) * (laneW * 0.43)
                nodes.push(rect(9, 26, { fill: COSMOS.gold, stroke: null, radius: 2 }).at(bx, ln.y - 32))
            }
            // ONE blazing vertical io_uring_enter() crossing pulse!
            if (entered) {
                nodes.push(
                    line([enterX, ln.y - 52], [enterX, ln.y + 52], { stroke: COSMOS.gold, width: 6 }).glow(14, COSMOS.gold),
                    dot(10, '#ffffff').at(enterX, ln.y).glow(16, COSMOS.gold),
                    txt('1 enter()', enterX + 22, ln.y + 38, 26, COSMOS.gold, 'mono', 'left'),
                )
            }
            // 32 emerald CQE completions streaming on the right half
            for (let k = 0; k < compCount; k++) {
                const bx = enterX + 26 + (k / 32) * (laneW * 0.45)
                nodes.push(rect(9, 26, { fill: COSMOS.emerald, stroke: null, radius: 2 }).at(bx, ln.y - 32))
            }
            // Right syscall bar (tiny 1/32 gold sliver!)
            nodes.push(
                rect(290, 44, { fill: '#0c1120', stroke: '#293554', width: 1.8, radius: 8 }).at(685, ln.y - 16),
                rect(entered ? 16 : 4, 34, { fill: COSMOS.gold, stroke: null, radius: 4 }).at(540 + (entered ? 8 : 2), ln.y - 16).glow(8, COSMOS.gold),
                txt(`${entered ? 1 : 0} syscall`, 685, ln.y + 34, 28, COSMOS.gold, 'mono'),
            )
        }

        // Lane 3: SQPOLL Mode — emerald kernel poller sweeping continuously with ZERO syscalls!
        {
            const ln = lanes[2]!
            const prog = Math.min(1, t * 1.6)
            const done = Math.min(32, Math.floor(prog * 32))
            const sweepX = laneL + ((t * 1.8) % 1) * laneW
            nodes.push(
                rect(laneW + 30, 146, {
                    fill: '#0c1c1e',
                    stroke: sf > 0.3 ? COSMOS.emerald : '#264546',
                    width: sf > 0.3 ? 3.5 : 2,
                    radius: 12,
                }).at((laneL + laneR) / 2, ln.y).glow(sf > 0.3 ? 12 : 0, COSMOS.emerald),
                line([laneL, ln.y], [laneR, ln.y], { stroke: '#224a44', width: 1.8, dash: [8, 8] }),
                txt(ln.title, -855, ln.y - 24, 28, ln.col, 'mono', 'left'),
                txt('Kernel thread polls ring', -855, ln.y + 22, 26, COSMOS.muted, 'sans', 'left'),
                // Glowing kernel-side SQPOLL sweep radar
                line([sweepX, ln.y + 8], [sweepX, ln.y + 56], { stroke: COSMOS.emerald, width: 5 }).glow(14, COSMOS.emerald),
                circle(14, { fill: '#10322c', stroke: COSMOS.emerald, width: 2.5 }).at(sweepX, ln.y + 34).glow(10, COSMOS.emerald),
            )
            // 32 continuous emerald packets flowing smoothly across zero-crossing shared memory
            for (let k = 0; k < done; k++) {
                const bx = laneL + 14 + (k / 32) * (laneW - 24)
                nodes.push(
                    rect(20, 26, { fill: '#12382c', stroke: COSMOS.emerald, width: 1.8, radius: 4 }).at(bx, ln.y - 30),
                )
            }
            // Right syscall bar: ZERO!
            nodes.push(
                rect(290, 44, { fill: '#0c1120', stroke: COSMOS.emerald, width: 2.2, radius: 8 }).at(685, ln.y - 16),
                txt('0 syscalls!', 685, ln.y - 16, 28, COSMOS.emerald, 'mono').glow(8, COSMOS.emerald),
                txt('1 dedicated poll core', 685, ln.y + 34, 26, COSMOS.cyan, 'mono'),
            )
        }

        return group(...nodes)
    })

    s.add(header, liveRace)

    const fullDur = Math.max(10, c.end - c.start - 0.1)
    c.at(0.05, () => s.play(race.to(1.25, { duration: fullDur, ease: linear })))
    c.on('one single enter', () => s.play(batchFocus.to(1, { duration: 0.7 })))
    c.on('Turn on', () => s.play(sqpollFocus.to(1, { duration: 0.8 })))
}
