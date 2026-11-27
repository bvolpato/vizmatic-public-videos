#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""Unified, multi-stage cached video factory for vizmatic-public-videos.

Caches each stage independently so unchanged work is never repeated:
  1. voice  -- skipped when script.json, voice settings, and audio/*.wav match
  2. mix    -- skipped when timing.json, audio/*.wav, and film.json["mix"] match
  3. render -- skipped when picture + audio match; remuxes audio in <1s without
               re-rendering video frames when only narration.wav changed.

Defaults to free local Kokoro narration. Loads .env from the repository root so setting
VIZMATIC_VOICE_PROVIDER=elevenlabs + ELEVENLABS_VOICE=liam opts into ElevenLabs cleanly.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
VIDEOS_DIR = REPO_ROOT / "videos"
VIZ_CLI = REPO_ROOT / "node_modules/vizmatic/dist/cli.js"
TSC_BIN = (
    REPO_ROOT / "node_modules/vizmatic/node_modules/typescript/bin/tsc"
    if (REPO_ROOT / "node_modules/vizmatic/node_modules/typescript/bin/tsc").is_file()
    else REPO_ROOT / "node_modules/typescript/bin/tsc"
)
GLOBAL_TRIGGERS = ("factory/", "package.json", "package-lock.json", "tsconfig.base.json", ".github/workflows/pages.yml")


def load_dotenv(path: Path) -> None:
    if not path.is_file():
        return
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, val = line.split("=", 1)
        os.environ.setdefault(key.strip(), val.strip().strip('"').strip("'"))


def discover_videos() -> dict[str, Path]:
    found: dict[str, Path] = {}
    for film_json in sorted(VIDEOS_DIR.rglob("film.json")):
        rel = film_json.parent.relative_to(VIDEOS_DIR).as_posix()
        found[rel] = film_json.parent
    return found


def changed_videos(base_ref: str, all_videos: dict[str, Path]) -> list[str]:
    try:
        out = subprocess.check_output(
            ["git", "-C", str(REPO_ROOT), "diff", "--name-only", f"{base_ref}...HEAD"],
            text=True,
        )
    except subprocess.CalledProcessError:
        return list(all_videos.keys())
    paths = [p.strip() for p in out.splitlines() if p.strip()]
    if any(p.startswith(GLOBAL_TRIGGERS) for p in paths):
        print("factory/engine or Vizmatic version changed -> selecting all videos", flush=True)
        return list(all_videos.keys())
    return [slug for slug in all_videos if any(p.startswith(f"videos/{slug}/") for p in paths)]


def run_cmd(cmd: list[str], cwd: Path) -> None:
    print("  $", " ".join(cmd), flush=True)
    subprocess.run(cmd, cwd=cwd, check=True)


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 16), b""):
            h.update(chunk)
    return h.hexdigest()


def digest_items(files: list[Path], extra: object = None) -> str | None:
    parts: dict[str, str] = {}
    for p in sorted(set(files)):
        if not p.is_file():
            return None
        resolved = p.resolve()
        try:
            key = resolved.relative_to(REPO_ROOT).as_posix()
        except ValueError:
            key = resolved.as_posix()
        parts[key] = sha256_file(p)
    payload = json.dumps({"files": parts, "extra": extra}, sort_keys=True).encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def read_stamp(path: Path) -> dict:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else {}
    except (OSError, ValueError):
        return {}


def write_stamp(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(".tmp")
    tmp.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
    tmp.replace(path)


def timing_wavs(video_dir: Path) -> list[Path] | None:
    tp = video_dir / "timing.json"
    if not tp.is_file():
        return None
    try:
        data = json.loads(tp.read_text(encoding="utf-8"))
        wavs = [video_dir / "audio" / beat["wav"] for sc in data["scenes"] for beat in sc["beats"]]
        return wavs if wavs and all(w.is_file() and w.stat().st_size > 44 for w in wavs) else None
    except (OSError, ValueError, KeyError, TypeError):
        return None


def voice_key(video_dir: Path, film_cfg: dict, provider: str) -> str:
    extra: dict[str, object] = {
        "provider": provider,
        "voice": film_cfg.get("voice"),
    }
    files = [video_dir / "script.json"]
    if provider == "elevenlabs":
        files.append(REPO_ROOT / "factory/voice_elevenlabs.py")
        extra.update(
            {
                "el_voice": os.environ.get("ELEVENLABS_VOICE", ""),
                "el_voice_id": os.environ.get("ELEVENLABS_VOICE_ID", ""),
                "el_model": os.environ.get("ELEVENLABS_MODEL_ID", ""),
                "el_speed": os.environ.get("ELEVENLABS_SPEED", ""),
            }
        )
    return digest_items(files, extra) or ""


def mix_key(video_dir: Path, film_cfg: dict, wavs: list[Path]) -> str:
    extra = {"output": film_cfg["output"], "mix": film_cfg.get("mix")}
    return digest_items([video_dir / "timing.json", *wavs], extra) or ""


def picture_key(video_dir: Path, film_cfg: dict, meta_cfg: dict, draft: bool) -> str:
    files: list[Path] = []
    for rel in ("package.json", "tsconfig.base.json", "factory/style.ts", "factory/caption-alignment.ts"):
        p = REPO_ROOT / rel
        if p.is_file():
            files.append(p)
    for p in sorted(video_dir.rglob("*")):
        if not p.is_file():
            continue
        if any(part in ("dist", "stills", "audio", "target", "node_modules", "lab") for part in p.parts):
            continue
        if p.name in ("narration.wav", "poster.png", "film.json", "meta.json", ".DS_Store"):
            continue
        files.append(p)
    film_visual = {k: v for k, v in film_cfg.items() if k not in ("voice", "mix")}
    extra = {
        "film": film_visual,
        "draft": draft,
        "width": 1280 if draft else meta_cfg.get("width", 1920),
        "fps": meta_cfg.get("fps", 30),
        "posterAt": meta_cfg.get("posterAt", 2.0),
    }
    return digest_items(files, extra) or ""


def ensure_local_node_modules(video_dir: Path) -> None:
    nm = video_dir / "node_modules"
    nm.mkdir(exist_ok=True)
    link = nm / "vizmatic"
    target = (REPO_ROOT / "node_modules/vizmatic").resolve()
    if link.is_symlink() or link.exists():
        if link.resolve() == target:
            return
        link.unlink()
    link.symlink_to(target)


def render_standalone_poster(video_dir: Path, meta_cfg: dict, film_cfg: dict) -> bool:
    """Render poster.png directly from scenes/poster.ts without baking a split-second intro into the MP4."""
    poster_src = video_dir / "scenes/poster.ts"
    if not poster_src.is_file():
        return False
    poster_t = float(meta_cfg.get("posterFrame", meta_cfg.get("posterAt", 0.45)))
    if poster_t <= 0 or poster_t >= 0.68:
        poster_t = 0.45
    width = str(meta_cfg.get("width", 1920))
    rel_factory = os.path.relpath(REPO_ROOT / "factory/style", video_dir).replace(os.sep, "/")
    bloom = str(meta_cfg.get("posterBloom", 0.24))
    entry_path = video_dir / ".poster-entry.ts"
    tmp_dir = video_dir / ".poster-tmp"
    entry_code = (
        "import { film } from 'vizmatic/stage'\n"
        f"import {{ COSMOS }} from '{rel_factory}'\n"
        "import { poster } from './scenes/poster'\n\n"
        f"export default film({{ width: 1920, height: 1080, fps: 30, background: COSMOS.bg, bloom: {bloom}, bleed: true }}, (s) => {{\n"
        "    poster(s, { intro: 0.7, gap: 0.35, tail: 0, end: 0.7 })\n"
        "    s.at(0.7, () => {})\n"
        "})\n"
    )
    try:
        entry_path.write_text(entry_code, encoding="utf-8")
        if tmp_dir.exists():
            import shutil
            shutil.rmtree(tmp_dir)
        run_cmd(
            [
                "node", str(VIZ_CLI), "film", entry_path.name,
                "--frame", f"{poster_t:.3f}",
                "--width", width,
                "--out", tmp_dir.name,
            ],
            video_dir,
        )
        rendered = sorted(tmp_dir.glob("*.png"))
        assert rendered, f"{video_dir.name}: standalone poster render produced no PNG"
        rendered[0].replace(video_dir / "poster.png")
        return True
    finally:
        entry_path.unlink(missing_ok=True)
        if tmp_dir.exists():
            import shutil
            shutil.rmtree(tmp_dir)


def build_video(slug: str, video_dir: Path, args: argparse.Namespace) -> None:
    print(f"\n=== [{slug}] ===", flush=True)
    if not VIZ_CLI.is_file():
        raise SystemExit("Missing node_modules/vizmatic. Run ./factory/setup-vizmatic.sh first.")
    ensure_local_node_modules(video_dir)
    film_cfg = json.loads((video_dir / "film.json").read_text(encoding="utf-8"))
    meta_path = video_dir / "meta.json"
    meta_cfg = json.loads(meta_path.read_text(encoding="utf-8")) if meta_path.is_file() else {}
    output_name = film_cfg["output"]
    entry = film_cfg.get("entry", "film.ts")
    out_name = f"{output_name}-draft" if args.draft else output_name
    mp4 = video_dir / "dist" / f"{out_name}.mp4"
    audio_cache_dir = video_dir / "audio/.cache"
    render_cache_dir = video_dir / "dist/.cache"
    provider = os.environ.get("VIZMATIC_VOICE_PROVIDER", "kokoro").strip().lower()

    if args.poster_only:
        ensure_local_node_modules(video_dir)
        if not render_standalone_poster(video_dir, meta_cfg, film_cfg):
            if mp4.is_file():
                poster_at = str(meta_cfg.get("posterAt", 2.0))
                run_cmd(
                    [
                        "ffmpeg", "-nostdin", "-hide_banner", "-loglevel", "error", "-y",
                        "-ss", poster_at, "-i", str(mp4), "-frames:v", "1", "-update", "1", "poster.png",
                    ],
                    video_dir,
                )
            else:
                print("  poster: no scenes/poster.ts and no rendered MP4 yet (skipping)", flush=True)
        return

    # ── Stage 1 & 2: Voice + Mix (independently cached under audio/.cache) ────
    if not args.check_only:
        v_stamp = audio_cache_dir / "voice.json"
        v_key = voice_key(video_dir, film_cfg, provider)
        existing_wavs = timing_wavs(video_dir)
        v_prev = read_stamp(v_stamp)
        if not args.force and existing_wavs and v_prev.get("key") == v_key and v_prev.get("wavs") == digest_items([video_dir / "timing.json", *existing_wavs]):
            print("  voice: up to date (cached)", flush=True)
        else:
            if provider == "elevenlabs":
                run_cmd(["uv", "run", str(REPO_ROOT / "factory/voice_elevenlabs.py"), "."], video_dir)
            else:
                run_cmd(["node", str(VIZ_CLI), "narrated", "voice", "."], video_dir)
            existing_wavs = timing_wavs(video_dir)
            if existing_wavs:
                write_stamp(v_stamp, {"key": v_key, "wavs": digest_items([video_dir / "timing.json", *existing_wavs])})

        assert existing_wavs, f"{slug}: voice step did not produce audio takes"
        m_stamp = audio_cache_dir / "mix.json"
        m_key = mix_key(video_dir, film_cfg, existing_wavs)
        narration_wav = video_dir / "narration.wav"
        m_prev = read_stamp(m_stamp)
        if not args.force and narration_wav.is_file() and m_prev.get("key") == m_key and m_prev.get("narration") == sha256_file(narration_wav):
            print("  mix: up to date (cached)", flush=True)
        else:
            run_cmd(["node", str(VIZ_CLI), "narrated", "mix", "."], video_dir)
            write_stamp(m_stamp, {"key": m_key, "narration": sha256_file(narration_wav)})

        if args.voice_only:
            return

    # ── Stage 3: Typecheck + Vizmatic Layout Check ────────────────────────────
    run_cmd(["node", str(TSC_BIN), "-p", "tsconfig.json"], video_dir)
    check_flags = film_cfg.get("check", ["--text-size", "26"])
    run_cmd(["node", str(VIZ_CLI), "check", entry, *check_flags], video_dir)
    if args.check_only:
        return

    # ── Stage 4: Render (or instant audio-only remux when picture unchanged!) ─
    r_stamp = render_cache_dir / ("render-draft.json" if args.draft else "render.json")
    p_key = picture_key(video_dir, film_cfg, meta_cfg, args.draft)
    a_key = sha256_file(video_dir / "narration.wav")
    r_prev = read_stamp(r_stamp)
    poster = video_dir / "poster.png"

    if not args.force and mp4.is_file() and r_prev.get("picture") == p_key:
        if r_prev.get("audio") == a_key and (args.draft or poster.is_file()):
            print(f"  render: up to date ({mp4.name})", flush=True)
            return
        if r_prev.get("audio") != a_key:
            print("  render: picture unchanged, remuxing updated narration.wav (0 frames re-rendered)", flush=True)
            tmp_mp4 = mp4.with_name(f".{mp4.stem}.remux.mp4")
            run_cmd(
                [
                    "ffmpeg", "-nostdin", "-hide_banner", "-loglevel", "error", "-y",
                    "-i", str(mp4), "-i", "narration.wav",
                    "-map", "0:v:0", "-map", "1:a:0", "-map", "0:s?",
                    "-map_metadata", "0", "-map_chapters", "0",
                    "-c:v", "copy", "-c:s", "copy",
                    "-c:a", "aac", "-b:a", "384k", "-ar", "48000", "-ac", "2",
                    "-movflags", "+faststart", str(tmp_mp4),
                ],
                video_dir,
            )
            tmp_mp4.replace(mp4)
        if not args.draft and not poster.is_file():
            if not render_standalone_poster(video_dir, meta_cfg, film_cfg):
                poster_at = str(meta_cfg.get("posterAt", 2.0))
                run_cmd(
                    [
                        "ffmpeg", "-nostdin", "-hide_banner", "-loglevel", "error", "-y",
                        "-ss", poster_at, "-i", str(mp4), "-frames:v", "1", "-update", "1", "poster.png",
                    ],
                    video_dir,
                )
        write_stamp(r_stamp, {"picture": p_key, "audio": a_key, "provider": provider})
        return

    workers = os.environ.get("VIZMATIC_WORKERS") or str(min(6, os.cpu_count() or 4))
    backend = os.environ.get("VIZMATIC_BACKEND", "auto")
    # Use libx264 for final high-quality renders so Vizmatic's anti-banding x264 tuning and dither grain are preserved
    # (hardware NVENC/VideoToolbox quantize subtle dark radial gradients into visible concentric rings).
    default_encoder = "auto" if args.draft else "libx264"
    encoder = os.environ.get("VIZMATIC_ENCODER", default_encoder)
    width = "1280" if args.draft else str(meta_cfg.get("width", 1920))
    fps = str(meta_cfg.get("fps", 30))
    quality = "draft" if args.draft else "high"

    run_cmd(
        [
            "node", str(VIZ_CLI), "film", entry,
            "--name", out_name, "--out", "dist", "--format", "mp4",
            "--audio", "narration.wav",
            "--quality", quality, "--backend", backend, "--encoder", encoder,
            "--dither", "--width", width, "--fps", fps, "--motion-blur", "1", "--workers", workers,
        ],
        video_dir,
    )

    if not args.draft:
        if not render_standalone_poster(video_dir, meta_cfg, film_cfg):
            poster_at = str(meta_cfg.get("posterAt", 2.0))
            run_cmd(
                [
                    "ffmpeg", "-nostdin", "-hide_banner", "-loglevel", "error", "-y",
                    "-ss", poster_at, "-i", str(mp4), "-frames:v", "1", "-update", "1", "poster.png",
                ],
                video_dir,
            )
    write_stamp(r_stamp, {"picture": p_key, "audio": a_key, "provider": provider})


def main() -> None:
    load_dotenv(REPO_ROOT / ".env")
    parser = argparse.ArgumentParser(description="Build Vizmatic public videos with granular stage caching.")
    parser.add_argument("slugs", nargs="*", help="Video slugs under videos/ (e.g. riemann-hypothesis)")
    parser.add_argument("--all", action="store_true", help="Build every video in videos/")
    parser.add_argument("--changed", metavar="BASE_REF", help="Build only videos changed since BASE_REF (or all if factory/Vizmatic changed)")
    parser.add_argument("--list", action="store_true", help="List available video slugs")
    parser.add_argument("--list-json", action="store_true", help="Print all available video slugs as a JSON array")
    parser.add_argument("--list-changed", metavar="BASE_REF", help="Print changed video slugs as JSON")
    parser.add_argument("--check-only", action="store_true", help="Run TypeScript and Vizmatic checks without synthesizing or rendering")
    parser.add_argument("--voice-only", action="store_true", help="Synthesize voice and mix narration.wav only")
    parser.add_argument("--poster-only", action="store_true", help="Render standalone poster.png from scenes/poster.ts (or MP4 fallback) only")
    parser.add_argument("--draft", action="store_true", help="Render 720p draft MP4")
    parser.add_argument("--force", action="store_true", help="Ignore cached stage stamps")
    args = parser.parse_args()

    all_videos = discover_videos()
    if args.list:
        for slug in all_videos:
            print(slug)
        return
    if args.list_json:
        print(json.dumps(list(all_videos.keys())))
        return
    if args.list_changed:
        print(json.dumps(changed_videos(args.list_changed, all_videos)))
        return

    if args.all:
        targets = list(all_videos.keys())
    elif args.changed:
        targets = changed_videos(args.changed, all_videos)
    elif args.slugs:
        targets = args.slugs
    else:
        parser.error("Specify video slug(s), --all, or --changed <base-ref>")

    if not targets:
        print("No videos changed — nothing to build.")
        return

    for slug in targets:
        if slug not in all_videos:
            raise SystemExit(f"Unknown video slug {slug!r}. Available: {', '.join(all_videos)}")
        build_video(slug, all_videos[slug], args)


if __name__ == "__main__":
    main()
