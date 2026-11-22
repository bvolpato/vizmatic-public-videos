import { Node, circle, dot, dynamic, group, line, polyPath, type SceneFunction, type Vec } from 'vizmatic/stage'
import { COSMOS, nebula, txt } from '../../../factory/style'

export const ownership: SceneFunction = (s, c) => {
    const showWall = s.value(1)
    const strX = s.value(-640)
    const rcX = s.value(-640)
    const rcBurst = s.value(0)
    const showMutex = s.value(0)
    const guardAngle = s.value(0)

    const wallLabels = group(
        txt('Thread 1', -460, -370, 36, COSMOS.blue, 'serif'),
        txt('Thread 2', 460, -370, 36, COSMOS.cyan, 'serif'),
        line([0, -330], [0, 330], { stroke: COSMOS.gold, width: 4 }).glow(10, COSMOS.gold),
        txt('Send / Sync  Compiler Gate', 0, -395, 26, COSMOS.gold, 'mono'),
    )

    const liveCrossing = dynamic(() => {
        if (showWall.value < 0.02) return []
        const a = showWall.value
        const sx = strX.value
        const rx = rcX.value
        const b = rcBurst.value
        const nodes: Node[] = [
            // String sails right across the gate in emerald
            new Node(polyPath([[-640, -110], [sx, -110]])).stroke(COSMOS.emerald, 4, 0.85 * a).glow(8, COSMOS.emerald),
            dot(10, COSMOS.emerald).at(sx, -110).glow(14, COSMOS.emerald).opacity(a),
            txt('String  (Send + Sync)', sx, -155, 28, COSMOS.emerald, 'mono').opacity(a),
            // Rc / RefCell strikes the gate and shatters with E0277 shockwave
            new Node(polyPath([[-640, 130], [rx, 130]])).stroke(COSMOS.rose, 4, 0.85 * a).glow(8, COSMOS.rose),
            dot(10, COSMOS.rose).at(rx, 130).glow(14, COSMOS.rose).opacity(a),
            txt('Rc<T> / Arc<RefCell<T>>', -780, 68, 28, COSMOS.rose, 'mono', 'left').opacity(a),
        ]
        if (b > 0.02) {
            nodes.push(
                circle(25 + b * 70, { fill: null, stroke: COSMOS.rose, width: 3.5 * (1 - b * 0.5) }).at(0, 130).opacity((1 - b * 0.4) * a).glow(10, COSMOS.rose),
                txt('error[E0277]: not Send / Sync', 120, 130, 30, COSMOS.rose, 'mono', 'left').opacity(b * a),
            )
        }
        return group(...nodes)
    })

    // Stage 2: Armored Mutex<T> glowing orb enclosing inner T + orbiting RAII MutexGuard
    const mutexCopy = group(
        txt('Mutex<T> owns T', 0, -370, 68, COSMOS.ink, 'serif').glow(6, COSMOS.cyan),
        txt('You cannot touch the value without acquiring the guard', 0, 345, 32, COSMOS.muted, 'sans'),
        txt('MutexGuard unlocks automatically on Drop — even on panic', 0, 405, 28, COSMOS.emerald, 'mono'),
    )

    const liveMutex = dynamic(() => {
        if (showMutex.value < 0.02) return []
        const a = showMutex.value
        const ang = guardAngle.value
        const gx = Math.cos(ang) * 235
        const gy = Math.sin(ang) * 235
        return group(
            nebula(0, 0, 380, '#5ce1e626', '#ffd16610').opacity(a),
            circle(235, { fill: null, stroke: COSMOS.cyan, width: 4.5, dash: [18, 10] }).at(0, 0).opacity(0.9 * a).glow(10, COSMOS.cyan),
            circle(165, { fill: '#12182b', stroke: COSMOS.gold, width: 3.5 }).at(0, 0).opacity(a).glow(8, COSMOS.gold),
            txt('Mutex<u64>', 0, -52, 26, COSMOS.cyan, 'mono').opacity(a),
            txt('counter: 42', 0, 14, 34, COSMOS.ink, 'mono').opacity(a),
            dot(14, COSMOS.emerald).at(gx, gy).glow(16, COSMOS.emerald).opacity(a),
            txt('MutexGuard', gx, gy - 34, 26, COSMOS.emerald, 'mono').opacity(a),
        )
    })

    s.add(wallLabels, liveCrossing)
    c.on('sails straight through', () => s.play(strX.to(520, { duration: 2.2 })))
    c.on('shatters against the wall', () => {
        s.play(rcX.to(-18, { duration: 1.4 }))
        s.play(rcBurst.to(1, { duration: 0.9 }))
    })

    c.on('owns the data inside', () => {
        s.play(showWall.to(0, { duration: 0.35 }))
        s.play(showMutex.to(1, { duration: 0.4 }))
        s.play(guardAngle.to(Math.PI * 1.6, { duration: 8.5 }))
    })
    c.swap('owns the data inside', wallLabels, mutexCopy)
    s.add(liveMutex)
}
