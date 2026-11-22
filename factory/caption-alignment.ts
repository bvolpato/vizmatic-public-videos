/** Align existing caption text with recorded word times without changing beat envelopes. */
export interface Caption { t0: number; t1: number; text: string }
export interface MeasuredWord { text: string; start: number; end: number }
export interface MeasuredBeat {
    start: number; end: number; say: string; text: string; words: readonly MeasuredWord[]
}
interface MappedCharacter { char: string; start: number; end: number }
export interface CaptionBoundary {
    cueIndex: number; wordIndex: number; word: string; relativeWordStart: number
    oldTime: number; newTime: number; printedOffset: number
}
interface Placement { scene: string; beat: number; start: number; end: number }
interface Timing {
    scenes: readonly { id: string; beats: readonly { say: string; text: string; duration: number; words: readonly MeasuredWord[] }[] }[]
}

/** Merge contiguous numeric fragments produced by older caption splitters. */
export function mergeNumericCaptionFragments(captions: Caption[]): void {
    for (let index = 0; index + 1 < captions.length; index++) {
        const before = captions[index]!, after = captions[index + 1]!
        if (/\d\.$/.test(before.text) && /^\d/.test(after.text) && Math.abs(before.t1 - after.t0) < 1e-6) {
            const joined = before.text + after.text
            const wrapped = joined.length > 74 ? joined.replace(/^(.{1,74})\s/, '$1\n') : joined
            captions.splice(index, 2, { t0: before.t0, t1: after.t1, text: wrapped })
            index--
        }
    }
}

/**
 * Reconstruct only the named beats when an older runtime splits internal periods.
 * Preserve the beat envelope and use the caller's runtime line splitter.
 * The measured-word pass sets the final internal transition times afterward.
 */
export function rebuildDottedCaptionBeats(
    captions: Caption[],
    beats: readonly { start: number; end: number; text: string }[],
    splitLines: (text: string) => readonly string[],
): void {
    for (const beat of beats) {
        const first = captions.findIndex(cue => cue.t0 >= beat.start - 1e-6 && cue.t0 < beat.end - 1e-6)
        const count = captions.filter(cue => cue.t0 >= beat.start - 1e-6 && cue.t0 < beat.end - 1e-6).length
        requireCondition(first >= 0 && count > 0, 'the dotted-term repair has no captions in its selected beat')
        const lines = splitLines(beat.text.replace(/(?<=\w)\.(?=\w)/g, '\uE000')).map(line => line.replaceAll('\uE000', '.'))
        const length = lines.reduce((total, line) => total + line.length, 0)
        requireCondition(lines.length > 0 && length > 0, 'the dotted-term repair produced no caption text')
        let at = beat.start
        captions.splice(first, count, ...lines.map((text, index) => {
            const t0 = at, t1 = index === lines.length - 1 ? beat.end : at + (beat.end - beat.start) * text.length / length
            at = t1
            return { t0, t1, text }
        }))
    }
}

function requireCondition(condition: unknown, message: string): asserts condition {
    if (!condition) throw new Error(`Caption alignment: ${message}`)
}

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const characters = (text: string): MappedCharacter[] => text.split('').map((char, start) => ({ char, start, end: start + 1 }))
const joined = (units: readonly MappedCharacter[]) => units.map(unit => unit.char).join('')

/** Phoneme markup changes the voice, but recorded tokens retain its visible label. */
function withoutPhonemes(units: readonly MappedCharacter[]): MappedCharacter[] {
    const text = joined(units), result: MappedCharacter[] = []
    const pattern = /\[([^\]]+)\]\(\/[^)]*\/\)/g
    let previous = 0
    for (const match of text.matchAll(pattern)) {
        result.push(...units.slice(previous, match.index), ...units.slice(match.index + 1, match.index + 1 + match[1]!.length))
        previous = match.index + match[0].length
    }
    result.push(...units.slice(previous))
    return result
}

function canonical(units: readonly MappedCharacter[]): MappedCharacter[] {
    return withoutPhonemes(units).flatMap(unit =>
        Array.from(unit.char.normalize('NFKC').toLowerCase()).filter(char => /[\p{L}\p{N}]/u.test(char)).map(char => ({ ...unit, char })))
}

/** Preserve exact common edges of multiword expansions, leaving changed tokens atomic. */
function replacementUnits(original: readonly MappedCharacter[], replacement: string): MappedCharacter[] {
    const start = Math.min(...original.map(unit => unit.start)), end = Math.max(...original.map(unit => unit.end))
    const result = replacement.split('').map(char => ({ char, start, end }))
    const old = canonical(original), next = canonical(result)
    let prefix = 0, suffix = 0
    while (prefix < Math.min(old.length, next.length) && old[prefix]!.char === next[prefix]!.char) prefix++
    while (suffix < Math.min(old.length, next.length) - prefix && old[old.length - suffix - 1]!.char === next[next.length - suffix - 1]!.char) suffix++
    const middleStart = old[prefix]?.start ?? end
    const middleEnd = old[old.length - suffix - 1]?.end ?? middleStart
    // Canonical units are copies. Match their code-unit position in the replacement.
    const visible = withoutPhonemes(result)
    let position = 0
    for (const unit of visible) {
        const letters = canonical([unit])
        if (!letters.length) continue
        const origin = position < prefix ? old[position] : position >= next.length - suffix ? old[old.length - (next.length - position)] : undefined
        unit.start = origin?.start ?? middleStart
        unit.end = origin?.end ?? middleEnd
        position += letters.length
    }
    return result
}

function spokenCharacters(say: string, pronunciations: Readonly<Record<string, string>>) {
    let units = characters(say)
    // Match the substitution order and token guards used by the saved TTS input.
    for (const [written, spoken] of Object.entries(pronunciations).sort((a, b) => b[0].length - a[0].length)) {
        const pattern = new RegExp(`(?<![\\p{L}\\p{N}_.,])${escape(written)}(?![\\p{L}\\p{N}_]|[.,]\\d)`, 'gu')
        const text = joined(units), replaced: MappedCharacter[] = []
        let previous = 0
        for (const match of text.matchAll(pattern)) {
            replaced.push(...units.slice(previous, match.index), ...replacementUnits(units.slice(match.index, match.index + match[0].length), spoken))
            previous = match.index + match[0].length
        }
        replaced.push(...units.slice(previous))
        units = replaced
    }
    return { synthesisText: joined(units), units: canonical(units) }
}

/**
 * Preserve cue text, outer lead/tail coverage, and any interval after the beat.
 * Every internal transition uses the next cue's first measured spoken word.
 * Unmatched or indivisible boundaries fail instead of using character durations.
 */
export function retimeBeatCaptions(cues: readonly Caption[], beat: MeasuredBeat, pronunciations: Readonly<Record<string, string>> = {}) {
    requireCondition(cues.length > 0, 'a beat has no captions')
    requireCondition(Number.isFinite(beat.start) && beat.end > beat.start, 'invalid beat interval')
    requireCondition(beat.words?.length > 0, 'measured words are missing')
    requireCondition(Math.abs(cues[0]!.t0 - beat.start) <= .002 && Math.abs(cues.at(-1)!.t1 - beat.end) <= .002, 'caption envelope differs from the measured beat')
    cues.forEach((cue, index) => {
        requireCondition(Number.isFinite(cue.t0) && Number.isFinite(cue.t1) && cue.t1 > cue.t0, 'invalid caption interval')
        if (index) requireCondition(Math.abs(cue.t0 - cues[index - 1]!.t1) < .002, 'caption intervals are not contiguous')
    })
    const printed = characters(beat.say).filter(unit => !/\s/u.test(unit.char))
    requireCondition(cues.map(cue => cue.text.replace(/\s/gu, '')).join('') === joined(printed), 'caption wording differs from the recorded script')
    const spoken = spokenCharacters(beat.say, pronunciations)
    requireCondition(spoken.synthesisText === beat.text, 'pronunciation expansion differs from the recorded synthesis input')
    const wordCharacters: string[] = [], wordAt: number[] = []
    beat.words.forEach((word, index) => {
        requireCondition(Number.isFinite(word.start) && Number.isFinite(word.end) && word.start >= 0 && word.end >= word.start && word.end <= beat.end - beat.start + .002, 'invalid measured word interval')
        if (index) requireCondition(word.start >= beat.words[index - 1]!.start && word.end >= beat.words[index - 1]!.end, 'measured word times are not monotonic')
        for (const unit of canonical(characters(word.text))) { wordCharacters.push(unit.char); wordAt.push(index) }
    })
    requireCondition(joined(spoken.units) === wordCharacters.join(''), 'recorded word tokens do not exactly match the synthesis input')
    const captions = cues.map(cue => ({ ...cue })), boundaries: CaptionBoundary[] = []
    let printedCount = 0
    for (let index = 1; index < captions.length; index++) {
        printedCount += captions[index - 1]!.text.replace(/\s/gu, '').length
        const offset = printed[printedCount]?.start
        requireCondition(offset !== undefined, 'caption boundary has no printed word')
        requireCondition(!spoken.units.some(unit => unit.start < offset && unit.end > offset), 'caption boundary splits an atomic pronunciation expansion')
        const position = spoken.units.findIndex(unit => unit.end > offset)
        requireCondition(position >= 0, 'caption boundary has no spoken word')
        const wordIndex = wordAt[position]!
        requireCondition(position === 0 || wordAt[position - 1] !== wordIndex, 'caption boundary is inside one measured word token')
        const word = beat.words[wordIndex]!, time = beat.start + word.start
        requireCondition(time > captions[index - 1]!.t0 && time < captions.at(-1)!.t1, 'measured boundary cannot form a positive caption interval')
        boundaries.push({ cueIndex: index, wordIndex, word: word.text, relativeWordStart: word.start,
            oldTime: cues[index]!.t0, newTime: time, printedOffset: offset })
        captions[index - 1]!.t1 = time
        captions[index]!.t0 = time
    }
    return { captions, boundaries, changed: captions.some((cue, index) => cue.t0 !== cues[index]!.t0 || cue.t1 !== cues[index]!.t1) }
}

/** Apply exact measured-word alignment after all caption text repairs. */
export function retimeMeasuredCaptions(cues: readonly Caption[], timing: Timing, placements: readonly Placement[], pronunciations: Readonly<Record<string, string>> = {}) {
    const captions: Caption[] = [], beats: { scene: string; beat: number; changed: boolean; boundaries: CaptionBoundary[] }[] = []
    let consumed = 0
    for (const placed of placements) {
        const take = timing.scenes.find(scene => scene.id === placed.scene)?.beats[placed.beat]
        requireCondition(take, `missing recorded beat ${placed.scene}/${placed.beat}`)
        requireCondition(Math.abs(take.duration - (placed.end - placed.start)) < 1e-6, 'beat placement duration differs from recording')
        const selected = cues.filter(cue => cue.t0 >= placed.start - .002 && cue.t0 < placed.end - .002)
        const result = retimeBeatCaptions(selected, { ...take, start: placed.start, end: placed.end }, pronunciations)
        captions.push(...result.captions)
        beats.push({ scene: placed.scene, beat: placed.beat, changed: result.changed, boundaries: result.boundaries })
        consumed += selected.length
    }
    requireCondition(consumed === cues.length, 'captions outside measured beat intervals would be lost')
    return { captions, beats }
}
