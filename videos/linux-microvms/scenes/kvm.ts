import { Node, circle, dot, dynamic, group, line, polyPath, type SceneFunction, type Vec } from 'vizmatic/stage'
import { COSMOS, nebula, txt } from '../../../factory/style'

export const kvm: SceneFunction = (s, c) => {
    const trip = s.value(0) // 0..1: guest runs -> VM Exit -> KVM -> VMM -> VM Resume -> guest

    const layers = group(
        txt('Hardware Virtualization  ·  VM Exit & Resume', -830, -405, 56, COSMOS.ink, 'serif', 'left').glow(5, COSMOS.cyan),
        line([-840, -100], [840, -100], { stroke: COSMOS.gold, width: 3, dash: [10, 8] }).glow(8, COSMOS.gold),
        line([-840, 150], [840, 150], { stroke: COSMOS.cyan, width: 2.5, dash: [8, 8] }).glow(6, COSMOS.cyan),

        txt('GUEST  (VMX Non-Root)', -820, -250, 32, COSMOS.cyan, 'mono', 'left'),
        txt('Native CPU speed + isolated EPT page tables', -820, -200, 26, COSMOS.muted, 'sans', 'left'),

        txt('HOST KERNEL  ·  KVM', -820, 12, 32, COSMOS.gold, 'mono', 'left'),
        txt('Catches traps & schedules vCPUs', -820, 62, 26, COSMOS.muted, 'sans', 'left'),

        txt('USER-SPACE VMM', -820, 255, 32, COSMOS.emerald, 'mono', 'left'),
        txt('Emulates virtio block & net', -820, 305, 26, COSMOS.muted, 'sans', 'left'),
    )

    // Exact path of one privileged I/O instruction out and back
    const WAYPOINTS: Vec[] = [
        [-100, -230],
        [100, -230],
        [100, 20],
        [280, 265],
        [460, 265],
        [620, 20],
        [620, -230],
        [800, -230],
    ]

    const samplePath = (u: number): Vec[] => {
        const segs = WAYPOINTS.length - 1
        const scaled = Math.max(0, Math.min(segs, u * segs))
        const full = Math.floor(scaled)
        const rem = scaled - full
        const pts: Vec[] = WAYPOINTS.slice(0, full + 1)
        if (full < segs) {
            const a = WAYPOINTS[full]!
            const b = WAYPOINTS[full + 1]!
            pts.push([a[0] + (b[0] - a[0]) * rem, a[1] + (b[1] - a[1]) * rem])
        }
        return pts
    }

    const liveTrip = dynamic(() => {
        const u = trip.value
        if (u < 0.01) return []
        const pts = samplePath(u)
        const tip = pts[pts.length - 1]!
        const nodes: Node[] = [
            new Node(polyPath(pts)).stroke(COSMOS.gold, 5, 0.95).glow(10, COSMOS.gold),
            new Node(polyPath(pts)).stroke('#ffffff', 1.4, 0.45),
            dot(10, '#ffffff').at(tip[0], tip[1]).glow(16, COSMOS.cyan),
        ]
        if (u > 0.25) {
            nodes.push(
                circle(26, { fill: null, stroke: COSMOS.rose, width: 2.5 }).at(100, -100).glow(8, COSMOS.rose),
                txt('VM Exit', 140, -135, 26, COSMOS.rose, 'mono', 'left'),
            )
        }
        if (u > 0.78) {
            nodes.push(
                circle(26, { fill: null, stroke: COSMOS.emerald, width: 2.5 }).at(620, -100).glow(8, COSMOS.emerald),
                txt('VM Resume', 660, -135, 26, COSMOS.emerald, 'mono', 'left'),
            )
        }
        return group(...nodes)
    })

    s.add(nebula(160, 0, 480, '#ffd16618', '#5ce1e610'), layers, liveTrip)
    c.on('full speed', () => s.play(trip.to(0.18, { duration: 1.8 })))
    c.on('trapping out', () => s.play(trip.to(0.62, { duration: 2.8 })))
    c.on('drop back', () => s.play(trip.to(1, { duration: 2.2 })))
}
