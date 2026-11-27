#!/usr/bin/env node
/**
 * Scaffold a new cinematic video under videos/<slug>/ following the factory conventions.
 * Usage: node factory/new-video.mjs <slug> ["Title"]
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const slug = process.argv[2]
const title = process.argv[3] || slug?.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
if (!slug || !/^[a-z0-9][a-z0-9/-]*$/.test(slug)) {
  console.error('Usage: node factory/new-video.mjs <slug> ["Video Title"]')
  process.exit(1)
}
const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dir = join(REPO, 'videos', slug)
if (existsSync(dir)) {
  console.error(`Directory already exists: ${dir}`)
  process.exit(1)
}
const depth = slug.split('/').length + 1
const up = '../'.repeat(depth)

mkdirSync(join(dir, 'scenes'), { recursive: true })
writeFileSync(
  join(dir, 'tsconfig.json'),
  JSON.stringify({ extends: `${up}tsconfig.base.json`, compilerOptions: { paths: { 'vizmatic/stage': [`${up}node_modules/vizmatic/dist/stage`] } } }, null, 2) + '\n',
)
writeFileSync(
  join(dir, 'meta.json'),
  JSON.stringify({ title, description: 'Short description of what this cinematic explainer teaches.', category: 'Systems', width: 1920, height: 1080, fps: 30, posterAt: 2.0 }, null, 2) + '\n',
)
writeFileSync(
  join(dir, 'film.json'),
  JSON.stringify(
    {
      entry: 'film.ts',
      output: title.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      look: 'midnight',
      voice: { name: 'af_heart', speed: 1.12 },
      check: ['--text-size', '26'],
      mix: { seed: 42, levels: { under: -31, pause: -25, card: -21 }, effects: [] },
    },
    null,
    2,
  ) + '\n',
)
writeFileSync(
  join(dir, 'script.json'),
  JSON.stringify(
    {
      timeline: { intro: 0.8, pause: 0.25, gap: 0.45, tail: 1.4 },
      pronounce: {},
      scenes: [
        {
          id: 'hook',
          title,
          beats: [{ say: 'Open with a sharp visual hook in the first fifteen seconds.', hold: 0.4 }],
        },
      ],
    },
    null,
    2,
  ) + '\n',
)
writeFileSync(
  join(dir, 'scenes/hook.ts'),
  `import { dot, group, type SceneFunction } from 'vizmatic/stage'\nimport { COSMOS, nebula, txt } from '${up}factory/style'\n\nexport const hook: SceneFunction = (s) => {\n    s.add(\n        nebula(0, 0, 500, '#5ce1e626'),\n        dot(8, COSMOS.gold).at(0, -140).glow(14, COSMOS.gold),\n        group(txt(${JSON.stringify(title)}, 0, 20, 96, COSMOS.ink, 'serif').glow(6, COSMOS.blue)),\n    )\n}\n`,
)
writeFileSync(
  join(dir, 'film.ts'),
  `import { narrated, type SceneFunction } from 'vizmatic/stage'\nimport { retimeBeatCaptions } from '${up}factory/caption-alignment'\nimport { COSMOS, nebula, starfield } from '${up}factory/style'\nimport { hook } from './scenes/hook'\nimport script from './script.json'\nimport timing from './timing.json'\n\nconst chapters: Record<string, SceneFunction> = { hook }\n\nfunction chapter(index: number): SceneFunction {\n    const scene = timing.scenes[index]!\n    return (stage, cue, clock) => {\n        for (const [i, beat] of cue.beats.entries()) {\n            const captions = stage.captions.filter((c) => c.t0 >= beat.start - 0.002 && c.t0 < beat.end - 0.002)\n            if (captions.length > 0) {\n                const measured = { ...scene.beats[i]!, start: beat.start, end: beat.end }\n                if (!(typeof measured.wav === 'string' && measured.wav.includes('-el-'))) {\n                    const aligned = retimeBeatCaptions(captions, measured, script.pronounce)\n                    stage.captions.splice(stage.captions.indexOf(captions[0]!), captions.length, ...aligned.captions)\n                }\n            }\n        }\n        stage.add(nebula(0, -40, 1220, '#1e275228'), ...starfield(130, index + 1))\n        chapters[scene.id]!(stage, cue, clock)\n    }\n}\n\nexport default narrated({\n    title: ${JSON.stringify(title)},\n    description: 'Cinematic explainer built with Vizmatic.',\n    width: 1920, height: 1080, fps: 30, background: COSMOS.bg, bloom: 0.22, bleed: true,\n    timing,\n    scenes: Object.fromEntries(timing.scenes.map((scene, index) => [scene.id, chapter(index)])),\n})\n`,
)
console.log(`Scaffolded videos/${slug}. Run: uv run factory/build.py ${slug}`)
