#!/usr/bin/env node
/**
 * Builds the static GitHub Pages cinema gallery (site/index.html), per-video watch pages
 * (site/<slug>/index.html), and copies llms.txt into site/llms.txt for AI coding agents.
 */
import { execFileSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const VIDEOS_DIR = join(REPO, 'videos')
const SITE_DIR = join(REPO, 'site')
const LLMS_SRC = join(REPO, 'llms.txt')
const SITE_URL = 'https://bvolpato.github.io/vizmatic-public-videos'

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
  const depthPrefix = item.slug.split('/').map(() => '..').join('/')
  const backPath = `${depthPrefix}/index.html`
  const llmsPath = `${depthPrefix}/llms.txt`
  const watchData = JSON.stringify({ starts: item.starts, captions: item.captions, scenes: item.scenes })
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark">
<title>${escapeHtml(item.title)} | Vizmatic Public Videos</title>
<style>
  :root{--bg:#06080f;--surface:#0e1322;--surface-alt:#151d33;--ink:#f8f4ec;--muted:#aebbd4;--rule:#222c46;--gold:#ffd166;--cyan:#5ce1e6;--rose:#ff6b8b}
  *{box-sizing:border-box}
  body{margin:0;background:radial-gradient(ellipse 80% 50% at 50% -10%,#151d38 0%,var(--bg) 62%);color:var(--ink);font:16px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;min-height:100vh}
  main{max-width:1160px;margin:0 auto;padding:32px 24px 88px}
  nav{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:14px;margin-bottom:28px;font:13px/1.2 ui-monospace,Menlo,monospace}
  nav a{color:var(--cyan);text-decoration:none}
  nav a:hover{text-decoration:underline}
  .nav-right{display:flex;gap:18px;align-items:center}
  .kicker{font:600 12px/1.2 ui-monospace,Menlo,monospace;letter-spacing:.14em;color:var(--gold);text-transform:uppercase;margin:0 0 10px}
  h1{font:600 clamp(2rem,4.4vw,3rem)/1.1 Georgia,serif;margin:0 0 12px;letter-spacing:-.01em}
  .sub{color:var(--muted);margin:0 0 28px;max-width:74ch;font-size:17px}
  figure{margin:0 0 36px}
  video{width:100%;aspect-ratio:16/9;background:#04060b;border:1px solid var(--rule);border-radius:16px;display:block;box-shadow:0 24px 80px #000000aa,0 0 0 1px #5ce1e618}
  figcaption{display:flex;flex-wrap:wrap;justify-content:space-between;gap:12px;margin-top:12px;font-size:14px;color:var(--muted)}
  figcaption a{color:var(--cyan);text-decoration:none}
  .empty{padding:48px 24px;border:1px dashed var(--rule);border-radius:16px;text-align:center;color:var(--muted);background:var(--surface)}
  h2{font:600 1.35rem/1.25 Georgia,serif;margin:40px 0 16px;padding-bottom:10px;border-bottom:1px solid var(--rule)}
  .chapters{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;list-style:none;padding:0;margin:0}
  .chapters button{width:100%;text-align:left;background:var(--surface);border:1px solid var(--rule);border-radius:12px;padding:14px 16px;color:var(--ink);cursor:pointer;display:flex;flex-direction:column;gap:4px;transition:border-color .15s,background .15s,transform .15s}
  .chapters button:hover,.chapters button[aria-current="true"]{border-color:var(--gold);background:var(--surface-alt);transform:translateY(-1px)}
  .ch-meta{display:flex;justify-content:space-between;font:12px/1.2 ui-monospace,Menlo,monospace;color:var(--gold)}
  .ch-title{font:600 15px/1.3 sans-serif}
</style>
</head>
<body>
<main>
  <nav>
    <a href="${backPath}">← All Vizmatic Films</a>
    <div class="nav-right">
      <a href="${llmsPath}">llms.txt</a>
      <a href="https://bvolpato.github.io/vizmatic/" target="_blank" rel="noopener">Built with Vizmatic ↗</a>
    </div>
  </nav>
  <p class="kicker">${escapeHtml(item.category)}${item.series ? ' · ' + escapeHtml(item.series) : ''} · ${fmtTime(item.duration)}</p>
  <h1>${escapeHtml(item.title)}</h1>
  <p class="sub">${escapeHtml(item.description)}</p>
  <figure>
    ${
      item.hasVideo
        ? `<video id="film" controls preload="metadata" ${item.hasPoster ? 'poster="poster.png"' : ''} playsinline><source src="${escapeHtml(item.mp4Name)}" type="video/mp4"></video>
    <figcaption><span id="now">${escapeHtml(item.title)}</span><span><a href="${escapeHtml(item.mp4Name)}" download>Download 1080p MP4</a></span></figcaption>`
        : `<div class="empty">${item.hasPoster ? '<img src="poster.png" alt="Poster" style="max-width:100%;border-radius:10px;margin-bottom:16px"><br>' : ''}Build locally with <code>uv run factory/build.py ${escapeHtml(item.slug)}</code> to render the MP4.</div>`
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
const hasLlms = existsSync(LLMS_SRC)
if (hasLlms) copyFileSync(LLMS_SRC, join(SITE_DIR, 'llms.txt'))

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
    featured: Boolean(meta.featured),
    published: meta.published || '',
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

function groupTag(category) {
  const c = category.toLowerCase()
  if (c.includes('ai')) return 'AI & ML'
  if (c.includes('math') || c.includes('quantum')) return 'Math & Quantum'
  if (c.includes('crypto') || c.includes('distributed')) return 'Crypto & Consensus'
  if (c.includes('formal')) return 'Formal Verification'
  return 'Systems & Linux'
}

const featuredFilms = catalog
  .filter((c) => c.featured)
  .sort((a, b) => (b.published || '').localeCompare(a.published || ''))

const filterGroups = ['All', 'AI & ML', 'Math & Quantum', 'Systems & Linux', 'Crypto & Consensus', 'Formal Verification']
const groupCounts = Object.fromEntries(
  filterGroups.map((g) => [g, g === 'All' ? catalog.length : catalog.filter((c) => groupTag(c.category) === g).length]),
)
const totalMinutes = Math.round(catalog.reduce((acc, c) => acc + c.duration, 0) / 60)

const filterButtonsHtml = filterGroups
  .map(
    (g, idx) =>
      `<button type="button" class="pill${idx === 0 ? ' active' : ''}" data-filter="${escapeHtml(g)}">${escapeHtml(g)} <span class="cnt">${groupCounts[g]}</span></button>`,
  )
  .join('')

const featuredHtml = featuredFilms.length
  ? `<section class="featured" aria-label="Latest Releases">
    <div class="sec-head">
      <span class="sec-kicker">Latest Releases</span>
      <span class="sec-note">Fresh off the factory · 1080p 30fps</span>
    </div>
    <div class="feat-grid">
      ${featuredFilms
        .map(
          (c) => `<a class="feat-card" href="${escapeHtml(c.slug)}/index.html">
        <div class="thumb">
          ${c.hasPoster ? `<img src="${escapeHtml(c.slug)}/poster.png" alt="${escapeHtml(c.title)}">` : `<div class="ph">${escapeHtml(c.title)}</div>`}
          <span class="badge-new">NEW</span>
          <span class="play" aria-hidden="true">▶</span>
          <span class="dur">${fmtTime(c.duration)}</span>
        </div>
        <div class="feat-body">
          <div class="meta">${escapeHtml(c.category)}${c.series ? ` · ${escapeHtml(c.series)}` : ''}${c.published ? ` · ${escapeHtml(c.published)}` : ''}</div>
          <h2>${escapeHtml(c.title)}</h2>
          <p>${escapeHtml(c.description)}</p>
          <span class="cta">Watch Film →</span>
        </div>
      </a>`,
        )
        .join('\n      ')}
    </div>
  </section>`
  : ''

const cardsHtml = catalog
  .map((c) => {
    const grp = groupTag(c.category)
    return `<a class="card" href="${escapeHtml(c.slug)}/index.html" data-group="${escapeHtml(grp)}">
    <div class="thumb">${c.hasPoster ? `<img src="${escapeHtml(c.slug)}/poster.png" alt="${escapeHtml(c.title)}" loading="lazy">` : `<div class="ph">${escapeHtml(c.title)}</div>`}${c.featured ? '<span class="badge-new">NEW</span>' : ''}<span class="play" aria-hidden="true">▶</span><span class="dur">${fmtTime(c.duration)}</span></div>
    <div class="body">
      <div class="meta">${escapeHtml(c.category)}${c.series ? ` · ${escapeHtml(c.series)}` : ''}</div>
      <h3>${escapeHtml(c.title)}</h3>
      <p>${escapeHtml(c.description)}</p>
    </div>
  </a>`
  })
  .join('\n')

const llmsBannerHtml = hasLlms
  ? `<section class="llms-bar" aria-label="AI Agent Instructions">
    <div class="llms-copy">
      <div class="llms-kicker">Build Videos With AI Agents · llms.txt</div>
      <p>Point Claude Code, Codex, Cursor, or Gemini CLI at <code>llms.txt</code> to create cinema-grade explainers with the exact Vizmatic workflow, 3D geometry rules, and 30fps checks.</p>
    </div>
    <div class="llms-actions">
      <a class="btn btn-ghost" href="llms.txt">Read llms.txt ↗</a>
      <button type="button" class="btn btn-gold" id="copy-llms-url" data-copy="${SITE_URL}/llms.txt">Copy llms.txt URL</button>
      <button type="button" class="btn btn-cyan" id="copy-agent-prompt" data-copy="Read ${SITE_URL}/llms.txt and AGENTS.md, then create a new cinematic Vizmatic explainer video on [your topic] following every visual, 3D, and 30fps --motion check rule.">Copy Agent Prompt</button>
    </div>
  </section>`
  : ''

const indexHtml = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark">
<title>Vizmatic Public Videos | Open-Source Technical Cinema</title>
<meta name="description" content="Open-source cinematic explainer videos covering AI internals, Millennium Prize mathematics, quantum computing, cryptography, distributed systems, and formal verification.">
<style>
  :root{--bg:#06080f;--surface:#0e1322;--surface-alt:#151d34;--ink:#f8f4ec;--muted:#a9b8d4;--rule:#212c46;--gold:#ffd166;--cyan:#5ce1e6;--violet:#a78bfa;--emerald:#6ee7b7}
  *{box-sizing:border-box}
  body{margin:0;background:radial-gradient(ellipse 92% 40% at 50% -6%,#1b264f 0%,var(--bg) 56%);color:var(--ink);font:16px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;min-height:100vh}
  main{max-width:1340px;margin:0 auto;padding:52px 28px 96px}
  header{margin-bottom:34px;padding-bottom:26px;border-bottom:1px solid var(--rule)}
  .kicker{font:600 12px/1.2 ui-monospace,Menlo,monospace;letter-spacing:.16em;color:var(--gold);text-transform:uppercase;margin:0 0 12px}
  h1{font:600 clamp(2.4rem,5.2vw,4rem)/1.05 Georgia,serif;margin:0 0 14px;letter-spacing:-.015em;text-shadow:0 0 42px #5ce1e626}
  .sub{color:var(--muted);max-width:74ch;margin:0 0 22px;font-size:17px}
  .bar{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:16px}
  .links{display:flex;flex-wrap:wrap;gap:20px;align-items:center}
  .links a{color:var(--cyan);text-decoration:none;font:13px/1.2 ui-monospace,Menlo,monospace}
  .links a:hover{text-decoration:underline}
  .stats{font:13px/1.2 ui-monospace,Menlo,monospace;color:var(--muted)}

  .sec-head{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:baseline;gap:10px;margin:0 0 16px}
  .sec-kicker{font:700 12px/1.2 ui-monospace,Menlo,monospace;letter-spacing:.16em;text-transform:uppercase;color:var(--gold)}
  .sec-note{font:12px/1.2 ui-monospace,Menlo,monospace;color:var(--muted)}

  .featured{margin:0 0 38px}
  .feat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(460px,1fr));gap:24px}
  .feat-card{display:flex;flex-direction:column;background:linear-gradient(160deg,#131b32 0%,#0c1120 100%);border:1px solid #2e3d64;border-radius:18px;overflow:hidden;color:inherit;text-decoration:none;box-shadow:0 18px 54px #00000066,0 0 0 1px #ffd16614;transition:transform .2s ease,border-color .2s ease,box-shadow .2s ease}
  .feat-card:hover{transform:translateY(-4px);border-color:var(--gold);box-shadow:0 24px 64px #00000099,0 0 34px #ffd16622}
  .feat-body{padding:22px 24px 24px;display:flex;flex-direction:column;flex:1}
  .feat-body h2{font:600 1.48rem/1.22 Georgia,serif;margin:0 0 10px;color:var(--ink)}
  .feat-body p{margin:0 0 16px;color:var(--muted);font-size:15px;line-height:1.58;flex:1}
  .cta{font:600 13px/1 ui-monospace,Menlo,monospace;color:var(--gold);letter-spacing:.04em}

  .llms-bar{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:20px;margin:0 0 42px;padding:20px 24px;border-radius:16px;background:linear-gradient(135deg,#101930 0%,#0d1324 100%);border:1px solid #283a62;box-shadow:0 12px 36px #00000044}
  .llms-copy{max-width:66ch}
  .llms-kicker{font:700 12px/1.2 ui-monospace,Menlo,monospace;letter-spacing:.14em;text-transform:uppercase;color:var(--cyan);margin:0 0 6px}
  .llms-copy p{margin:0;color:var(--muted);font-size:14.5px;line-height:1.5}
  .llms-copy code{background:#182442;color:var(--gold);padding:2px 6px;border-radius:5px;font:600 13px ui-monospace,Menlo,monospace}
  .llms-actions{display:flex;flex-wrap:wrap;gap:10px}
  .btn{display:inline-flex;align-items:center;gap:6px;padding:10px 15px;border-radius:10px;font:600 13px/1 ui-monospace,Menlo,monospace;cursor:pointer;text-decoration:none;border:1px solid var(--rule);transition:transform .15s,border-color .15s,background .15s}
  .btn:hover{transform:translateY(-1px)}
  .btn-ghost{background:#121a30;color:var(--ink);border-color:#2e3e66}
  .btn-ghost:hover{border-color:var(--cyan);color:var(--cyan)}
  .btn-gold{background:#241e14;color:var(--gold);border-color:#ffd16666}
  .btn-gold:hover{border-color:var(--gold);background:#2e2618}
  .btn-cyan{background:#0f232c;color:var(--cyan);border-color:#5ce1e666}
  .btn-cyan:hover{border-color:var(--cyan);background:#132e3a}

  .filters{display:flex;flex-wrap:wrap;gap:10px;margin:0 0 26px}
  .pill{background:var(--surface);border:1px solid var(--rule);color:var(--muted);border-radius:999px;padding:8px 16px;font:600 13px/1 ui-monospace,Menlo,monospace;cursor:pointer;transition:border-color .15s,color .15s,background .15s}
  .pill .cnt{opacity:.68;margin-left:4px;font-weight:500}
  .pill:hover{border-color:var(--cyan);color:var(--ink)}
  .pill.active{background:linear-gradient(135deg,#1d2948,#131b32);border-color:var(--gold);color:var(--gold);box-shadow:0 0 18px #ffd16622}

  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(370px,1fr));gap:24px}
  .card{display:flex;flex-direction:column;background:var(--surface);border:1px solid var(--rule);border-radius:16px;overflow:hidden;color:inherit;text-decoration:none;transition:transform .2s ease,border-color .2s ease,box-shadow .2s ease}
  .card[hidden]{display:none}
  .card:hover{transform:translateY(-4px);border-color:var(--gold);box-shadow:0 20px 56px #00000088,0 0 28px #ffd16618}
  .thumb{position:relative;aspect-ratio:16/9;background:#070a14;overflow:hidden}
  .thumb img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .35s ease}
  .card:hover .thumb img,.feat-card:hover .thumb img{transform:scale(1.03)}
  .badge-new{position:absolute;left:12px;top:12px;background:linear-gradient(135deg,#ffd166,#fb923c);color:#090b12;border-radius:999px;padding:4px 10px;font:800 11px/1 ui-monospace,Menlo,monospace;letter-spacing:.1em;box-shadow:0 4px 16px #00000088}
  .play{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) scale(.9);width:56px;height:56px;border-radius:999px;display:flex;align-items:center;justify-content:center;background:#070910cc;border:1.5px solid var(--gold);color:var(--gold);font-size:19px;padding-left:3px;opacity:0;transition:opacity .2s ease,transform .2s ease;box-shadow:0 0 24px #ffd16655}
  .card:hover .play,.feat-card:hover .play{opacity:1;transform:translate(-50%,-50%) scale(1)}
  .ph{display:flex;align-items:center;justify-content:center;height:100%;padding:20px;text-align:center;font:600 1.2rem Georgia,serif;color:var(--gold)}
  .dur{position:absolute;right:10px;bottom:10px;background:#070910d8;border:1px solid #2b385a;border-radius:7px;padding:4px 8px;font:600 12px/1 ui-monospace,Menlo,monospace;color:var(--ink)}
  .body{padding:18px 20px 22px}
  .meta{font:600 11px/1.2 ui-monospace,Menlo,monospace;letter-spacing:.08em;color:var(--cyan);text-transform:uppercase;margin-bottom:7px}
  .body h3{font:600 1.18rem/1.3 Georgia,serif;margin:0 0 8px}
  .body p{margin:0;color:var(--muted);font-size:14px;line-height:1.55}
  @media (max-width:600px){.feat-grid,.grid{grid-template-columns:1fr}}
</style>
</head>
<body>
<main>
  <header>
    <p class="kicker">Open-Source AI, Math &amp; Systems Cinema</p>
    <h1>Vizmatic Public Videos</h1>
    <p class="sub">Code-first cinematic explainer films covering AI &amp; ML internals, Millennium Prize mathematics, quantum interference, zero-knowledge cryptography, distributed consensus, Linux, Rust concurrency, and formal verification. Authored in TypeScript and rendered reproducibly with Vizmatic.</p>
    <div class="bar">
      <div class="links">
        <a href="https://bvolpato.github.io/vizmatic/" target="_blank" rel="noopener">Vizmatic Engine →</a>
        <a href="https://github.com/bvolpato/vizmatic-public-videos" target="_blank" rel="noopener">Source Repository →</a>
        ${hasLlms ? '<a href="llms.txt">llms.txt →</a>' : ''}
      </div>
      <div class="stats">${catalog.length} films · ~${totalMinutes} min · 1080p 30fps · MIT</div>
    </div>
  </header>
  ${featuredHtml}
  ${llmsBannerHtml}
  <div class="sec-head">
    <span class="sec-kicker">Full Catalog</span>
    <span class="sec-note">Click any film for 1080p playback, chapters &amp; captions</span>
  </div>
  <div class="filters" role="tablist" aria-label="Filter by topic">${filterButtonsHtml}</div>
  <section class="grid" id="gallery">
${cardsHtml}
  </section>
</main>
<script>
(() => {
  const pills = Array.from(document.querySelectorAll('.pill'));
  const cards = Array.from(document.querySelectorAll('.card'));
  for (const pill of pills) {
    pill.addEventListener('click', () => {
      const target = pill.dataset.filter;
      pills.forEach((p) => p.classList.toggle('active', p === pill));
      cards.forEach((card) => {
        card.hidden = target !== 'All' && card.dataset.group !== target;
      });
    });
  }
  for (const btn of document.querySelectorAll('[data-copy]')) {
    btn.addEventListener('click', async () => {
      const text = btn.getAttribute('data-copy');
      const prev = btn.textContent;
      try {
        await navigator.clipboard.writeText(text);
        btn.textContent = 'Copied!';
      } catch {
        btn.textContent = 'Select & copy';
      }
      setTimeout(() => { btn.textContent = prev; }, 1600);
    });
  }
})();
</script>
</body>
</html>`

writeFileSync(join(SITE_DIR, 'index.html'), indexHtml)
console.log(`Built static gallery in site/ with ${catalog.length} videos${hasLlms ? ' + llms.txt' : ''}.`)
