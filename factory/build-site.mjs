#!/usr/bin/env node
/**
 * Builds the static GitHub Pages gallery (site/index.html) and per-video watch pages
 * (site/<slug>/index.html) from videos/** metadata, posters, and rendered MP4/VTT outputs.
 */
import { execFileSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const VIDEOS_DIR = join(REPO, 'videos')
const SITE_DIR = join(REPO, 'site')

function findFilms(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (['node_modules', 'dist', 'stills', 'audio', 'target', 'lab'].includes(entry)) continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      if (existsSync(join(full, 'film.json')) && existsSync(join(full, 'script.json'))) {
        out.push(full)
      } else {
        findFilms(full, out)
      }
    }
  }
  return out.sort()
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function fmtTime(sec) {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

function probeMedia(mp4Path, script) {
  if (!existsSync(mp4Path)) return { hasVideo: false, duration: 0, starts: [], captions: '' }
  const chapters = JSON.parse(
    execFileSync('ffprobe', ['-v', 'error', '-of', 'json', '-show_chapters', '-show_format', mp4Path], { encoding: 'utf8' }),
  )
  const duration = Number(chapters.format?.duration || 0)
  const starts = script.scenes.map((sc) => {
    const found = (chapters.chapters || []).find((c) => c.tags?.title === sc.title)
    return found ? Number(found.start_time) : 0
  })
  let captions = ''
  try {
    captions = execFileSync('ffmpeg', ['-nostdin', '-v', 'error', '-i', mp4Path, '-map', '0:s:0', '-f', 'webvtt', '-'], { encoding: 'utf8' })
  } catch {
    captions = ''
  }
  return { hasVideo: true, duration, starts, captions }
}

function estimateDuration(videoDir) {
  const timingPath = join(videoDir, 'timing.json')
  if (!existsSync(timingPath)) return 0
  const timing = JSON.parse(readFileSync(timingPath, 'utf8'))
  let total = (timing.lead || 0) + (timing.tail || 0)
  for (const sc of timing.scenes || []) {
    for (const b of sc.beats || []) total += (b.duration || 0) + (b.hold || 0)
    total += timing.gap || 0
  }
  return total
}

function watchPageHtml(item) {
  const backPath = item.slug.split('/').map(() => '..').join('/') + '/index.html'
  const watchData = JSON.stringify({ starts: item.starts, captions: item.captions, scenes: item.scenes })
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark">
<title>${escapeHtml(item.title)} — Vizmatic Public Videos</title>
<style>
  :root{--bg:#070910;--surface:#111626;--surface-alt:#182036;--ink:#f8f4ec;--muted:#b5c1d8;--rule:#26304a;--gold:#ffd166;--cyan:#5ce1e6;--rose:#ff6b8b}
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
  main{max-width:1100px;margin:0 auto;padding:32px 24px 80px}
  nav{margin-bottom:24px;font:14px/1.2 ui-monospace,Menlo,monospace}
  nav a{color:var(--cyan);text-decoration:none}
  nav a:hover{text-decoration:underline}
  .kicker{font:600 13px/1.2 ui-monospace,Menlo,monospace;letter-spacing:.12em;color:var(--gold);text-transform:uppercase;margin:0 0 8px}
  h1{font:600 clamp(1.9rem,4.4vw,2.9rem)/1.12 Georgia,serif;margin:0 0 10px}
  .sub{color:var(--muted);margin:0 0 24px;max-width:76ch}
  figure{margin:0 0 32px}
  video{width:100%;aspect-ratio:16/9;background:#05070d;border:1px solid var(--rule);border-radius:12px;display:block}
  figcaption{display:flex;flex-wrap:wrap;justify-content:space-between;gap:12px;margin-top:10px;font-size:14px;color:var(--muted)}
  figcaption a{color:var(--cyan);text-decoration:none}
  .empty{padding:48px 24px;border:1px dashed var(--rule);border-radius:12px;text-align:center;color:var(--muted);background:var(--surface)}
  h2{font:600 1.4rem/1.25 Georgia,serif;margin:36px 0 14px;padding-bottom:8px;border-bottom:1px solid var(--rule)}
  .chapters{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;list-style:none;padding:0;margin:0}
  .chapters button{width:100%;text-align:left;background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:14px 16px;color:var(--ink);cursor:pointer;display:flex;flex-direction:column;gap:4px}
  .chapters button:hover,.chapters button[aria-current="true"]{border-color:var(--gold);background:var(--surface-alt)}
  .ch-meta{display:flex;justify-content:space-between;font:12px/1.2 ui-monospace,Menlo,monospace;color:var(--gold)}
  .ch-title{font:600 15px/1.3 sans-serif}
</style>
</head>
<body>
<main>
  <nav><a href="${backPath}">← All Vizmatic Public Videos</a> · <a href="https://bvolpato.github.io/vizmatic/" target="_blank" rel="noopener">Built with Vizmatic</a></nav>
  <p class="kicker">${escapeHtml(item.category)}${item.series ? ' · ' + escapeHtml(item.series) : ''}</p>
  <h1>${escapeHtml(item.title)}</h1>
  <p class="sub">${escapeHtml(item.description)}</p>
  <figure>
    ${
      item.hasVideo
        ? `<video id="film" controls preload="metadata" ${item.hasPoster ? 'poster="poster.png"' : ''} playsinline><source src="${escapeHtml(item.mp4Name)}" type="video/mp4"></video>
    <figcaption><span id="now">${escapeHtml(item.title)}</span><span><a href="${escapeHtml(item.mp4Name)}" download>Download MP4</a></span></figcaption>`
        : `<div class="empty">${item.hasPoster ? '<img src="poster.png" alt="Poster" style="max-width:100%;border-radius:8px;margin-bottom:16px"><br>' : ''}Build locally with <code>uv run factory/build.py ${escapeHtml(item.slug)}</code> to render the MP4.</div>`
    }
  </figure>
  <h2>Chapters</h2>
  <ol class="chapters" id="chapter-list"></ol>
</main>
<script>
(() => {
  const data = ${watchData};
  const video = document.getElementById('film');
  const list = document.getElementById('chapter-list');
  const now = document.getElementById('now');
  const fmt = (sec) => Math.floor(sec / 60) + ':' + String(Math.floor(sec % 60)).padStart(2, '0');
  if (video && data.captions) {
    const track = document.createElement('track');
    track.kind = 'captions'; track.label = 'English'; track.srclang = 'en'; track.default = true;
    track.src = URL.createObjectURL(new Blob([data.captions], { type: 'text/vtt' }));
    video.appendChild(track);
  }
  const buttons = data.scenes.map((sc, i) => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.innerHTML = '<span class="ch-meta"><span>' + String(i + 1).padStart(2, '0') + ' / ' + String(data.scenes.length).padStart(2, '0') + '</span><span>' + fmt(data.starts[i] || 0) + '</span></span><span class="ch-title">' + sc.title + '</span>';
    if (video) btn.addEventListener('click', () => { video.currentTime = data.starts[i] || 0; video.play().catch(() => {}); });
    li.appendChild(btn); list.appendChild(li); return btn;
  });
  if (video) {
    video.addEventListener('timeupdate', () => {
      let active = 0;
      for (let i = 0; i < data.starts.length; i++) if (video.currentTime >= data.starts[i] - 0.1) active = i;
      buttons.forEach((b, i) => b.setAttribute('aria-current', String(i === active)));
      if (now) now.textContent = String(active + 1).padStart(2, '0') + ' / ' + String(data.scenes.length).padStart(2, '0') + ' · ' + data.scenes[active].title;
    });
  }
})();
</script>
</body>
</html>`
}

mkdirSync(SITE_DIR, { recursive: true })
const filmDirs = findFilms(VIDEOS_DIR)
const catalog = []

for (const dir of filmDirs) {
  const slug = relative(VIDEOS_DIR, dir).replace(/\\/g, '/')
  const cfg = JSON.parse(readFileSync(join(dir, 'film.json'), 'utf8'))
  const metaPath = join(dir, 'meta.json')
  const meta = existsSync(metaPath) ? JSON.parse(readFileSync(metaPath, 'utf8')) : {}
  const script = JSON.parse(readFileSync(join(dir, 'script.json'), 'utf8'))
  const mp4Name = `${cfg.output}.mp4`
  const mp4Path = join(dir, 'dist', mp4Name)
  const posterPath = join(dir, 'poster.png')
  const outDir = join(SITE_DIR, slug)
  mkdirSync(outDir, { recursive: true })

  const probed = probeMedia(mp4Path, script)
  const hasPoster = existsSync(posterPath)
  if (hasPoster) copyFileSync(posterPath, join(outDir, 'poster.png'))
  if (probed.hasVideo) copyFileSync(mp4Path, join(outDir, mp4Name))

  const duration = probed.duration || estimateDuration(dir)
  const item = {
    slug,
    title: meta.title || cfg.output,
    description: meta.description || '',
    category: meta.category || 'Explainer',
    series: meta.series || '',
    duration,
    hasVideo: probed.hasVideo,
    hasPoster,
    mp4Name,
    starts: probed.starts,
    captions: probed.captions,
    scenes: script.scenes.map((s) => ({ id: s.id, title: s.title })),
  }
  writeFileSync(join(outDir, 'index.html'), watchPageHtml(item))
  catalog.push(item)
}

const cardsHtml = catalog
  .map(
    (c) => `<a class="card" href="${escapeHtml(c.slug)}/index.html">
    <div class="thumb">${c.hasPoster ? `<img src="${escapeHtml(c.slug)}/poster.png" alt="${escapeHtml(c.title)}" loading="lazy">` : `<div class="ph">${escapeHtml(c.title)}</div>`}<span class="dur">${fmtTime(c.duration)}</span></div>
    <div class="body">
      <div class="meta">${escapeHtml(c.category)}${c.series ? ` · ${escapeHtml(c.series)}` : ''}</div>
      <h3>${escapeHtml(c.title)}</h3>
      <p>${escapeHtml(c.description)}</p>
    </div>
  </a>`,
  )
  .join('\n')

const indexHtml = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark">
<title>Vizmatic Public Videos</title>
<style>
  :root{--bg:#070910;--surface:#111626;--surface-alt:#182036;--ink:#f8f4ec;--muted:#b5c1d8;--rule:#26304a;--gold:#ffd166;--cyan:#5ce1e6}
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
  main{max-width:1180px;margin:0 auto;padding:48px 24px 80px}
  header{margin-bottom:40px;border-bottom:1px solid var(--rule);padding-bottom:24px}
  .kicker{font:600 13px/1.2 ui-monospace,Menlo,monospace;letter-spacing:.12em;color:var(--gold);text-transform:uppercase;margin:0 0 8px}
  h1{font:600 clamp(2.2rem,5vw,3.4rem)/1.1 Georgia,serif;margin:0 0 12px}
  .sub{color:var(--muted);max-width:74ch;margin:0 0 16px}
  .links a{color:var(--cyan);text-decoration:none;font:14px/1.2 ui-monospace,Menlo,monospace;margin-right:18px}
  .links a:hover{text-decoration:underline}
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:20px}
  .card{display:flex;flex-direction:column;background:var(--surface);border:1px solid var(--rule);border-radius:14px;overflow:hidden;color:inherit;text-decoration:none;transition:transform .15s,border-color .15s}
  .card:hover{transform:translateY(-2px);border-color:var(--gold)}
  .thumb{position:relative;aspect-ratio:16/9;background:#0a0e1a;overflow:hidden}
  .thumb img{width:100%;height:100%;object-fit:cover;display:block}
  .ph{display:flex;align-items:center;justify-content:center;height:100%;padding:20px;text-align:center;font:600 1.2rem Georgia,serif;color:var(--gold)}
  .dur{position:absolute;right:10px;bottom:10px;background:#070910cc;border:1px solid var(--rule);border-radius:6px;padding:3px 8px;font:600 12px/1 ui-monospace,Menlo,monospace;color:var(--ink)}
  .body{padding:18px 20px 22px}
  .meta{font:600 12px/1.2 ui-monospace,Menlo,monospace;color:var(--cyan);text-transform:uppercase;margin-bottom:6px}
  .body h3{font:600 1.15rem/1.3 Georgia,serif;margin:0 0 8px}
  .body p{margin:0;color:var(--muted);font-size:14px}
</style>
</head>
<body>
<main>
  <header>
    <p class="kicker">Open-Source Math &amp; Systems Cinema</p>
    <h1>Vizmatic Public Videos</h1>
    <p class="sub">Code-first cinematic explainer videos covering mathematics, Rust concurrency, Linux virtualization, io_uring, and formal verification — authored in TypeScript and rendered reproducibly with Vizmatic.</p>
    <div class="links">
      <a href="https://bvolpato.github.io/vizmatic/" target="_blank" rel="noopener">Vizmatic Engine →</a>
      <a href="https://github.com/bvolpato/vizmatic-public-videos" target="_blank" rel="noopener">Source Repository →</a>
    </div>
  </header>
  <section class="grid">
${cardsHtml}
  </section>
</main>
</body>
</html>`

writeFileSync(join(SITE_DIR, 'index.html'), indexHtml)
console.log(`Built static gallery in site/ with ${catalog.length} videos.`)
