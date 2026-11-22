#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""Unified, change-aware video factory for vizmatic-public-videos.

Defaults to free local Kokoro narration. Loads .env from the repository root so setting
VIZMATIC_VOICE_PROVIDER=elevenlabs + ELEVENLABS_VOICE=bella opts into ElevenLabs cleanly.

Examples:
  uv run factory/build.py riemann-hypothesis
  uv run factory/build.py --all --check-only
  uv run factory/build.py --changed origin/main
  VIZMATIC_VOICE_PROVIDER=elevenlabs uv run factory/build.py riemann-hypothesis
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
TSC_BIN = REPO_ROOT / "node_modules/vizmatic/node_modules/typescript/bin/tsc"
GLOBAL_TRIGGERS = ("factory/", "package.json", "package-lock.json", "tsconfig.base.json", ".github/workflows/pages.yml")


def load_dotenv(path: Path) -> None:
    if not path.is_file():
        return
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, val = line.split("=", 1)
        key = key.strip()
        val = val.strip().strip('"').strip("'")
        os.environ.setdefault(key, val)


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
    selected = []
    for slug in all_videos:
        prefix = f"videos/{slug}/"
        if any(p.startswith(prefix) for p in paths):
            selected.append(slug)
    return selected


def run_cmd(cmd: list[str], cwd: Path) -> None:
    print("  $", " ".join(cmd), flush=True)
    subprocess.run(cmd, cwd=cwd, check=True)


def compute_fingerprint(video_dir: Path, mode: str) -> str:
    h = hashlib.sha256()
    h.update(mode.encode())
    h.update(os.environ.get("VIZMATIC_VOICE_PROVIDER", "kokoro").encode())
    h.update(os.environ.get("ELEVENLABS_VOICE", "").encode())
    h.update(os.environ.get("ELEVENLABS_VOICE_ID", "").encode())
    for rel in ("package.json", "tsconfig.base.json", "factory/style.ts", "factory/caption-alignment.ts"):
        p = REPO_ROOT / rel
        if p.is_file():
            h.update(p.read_bytes())
    for p in sorted(video_dir.rglob("*")):
        if not p.is_file():
            continue
        if any(part in ("dist", "stills", "audio", "target", "node_modules") for part in p.parts):
            continue
        if p.name in ("narration.wav", "poster.png", ".DS_Store"):
            continue
        h.update(p.relative_to(video_dir).as_posix().encode())
        h.update(p.read_bytes())
    return h.hexdigest()


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


def build_video(slug: str, video_dir: Path, args: argparse.Namespace) -> None:
    print(f"\n=== [{slug}] ===", flush=True)
    if not VIZ_CLI.is_file():
        raise SystemExit("Missing node_modules/vizmatic. Run npm install or link your built Vizmatic checkout.")
    ensure_local_node_modules(video_dir)
    film_cfg = json.loads((video_dir / "film.json").read_text(encoding="utf-8"))
    meta_path = video_dir / "meta.json"
    meta_cfg = json.loads(meta_path.read_text(encoding="utf-8")) if meta_path.is_file() else {}
    output_name = film_cfg["output"]
    entry = film_cfg.get("entry", "film.ts")
    mp4 = video_dir / "dist" / f"{output_name}.mp4"
    stamp = video_dir / "dist/.factory-stamp.json"

    mode = "check" if args.check_only else ("voice" if args.voice_only else ("draft" if args.draft else "render"))
    fp = compute_fingerprint(video_dir, mode)
    if not args.force and mode == "render" and mp4.is_file() and stamp.is_file():
        try:
            prev = json.loads(stamp.read_text(encoding="utf-8"))
            if prev.get("fingerprint") == fp:
                print(f"  up to date ({mp4.name})", flush=True)
                return
        except (ValueError, OSError):
            pass

    provider = os.environ.get("VIZMATIC_VOICE_PROVIDER", "kokoro").strip().lower()
    if not args.check_only:
        if provider == "elevenlabs":
            run_cmd(["uv", "run", str(REPO_ROOT / "factory/voice_elevenlabs.py"), "."], video_dir)
        else:
            run_cmd(["node", str(VIZ_CLI), "narrated", "voice", "."], video_dir)
        run_cmd(["node", str(VIZ_CLI), "narrated", "mix", "."], video_dir)
        if args.voice_only:
            return

    run_cmd(["node", str(TSC_BIN), "-p", "tsconfig.json"], video_dir)
    check_flags = film_cfg.get("check", ["--text-size", "26"])
    run_cmd(["node", str(VIZ_CLI), "check", entry, *check_flags], video_dir)
    if args.check_only:
        return

    workers = os.environ.get("VIZMATIC_WORKERS") or str(min(6, os.cpu_count() or 4))
    backend = os.environ.get("VIZMATIC_BACKEND", "auto")
    encoder = os.environ.get("VIZMATIC_ENCODER", "auto")
    width = "1280" if args.draft else str(meta_cfg.get("width", 1920))
    fps = str(meta_cfg.get("fps", 30))
    quality = "draft" if args.draft else "high"
    out_name = f"{output_name}-draft" if args.draft else output_name

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
        poster_at = str(meta_cfg.get("posterAt", 2.0))
        run_cmd(
            [
                "ffmpeg", "-nostdin", "-hide_banner", "-loglevel", "error", "-y",
                "-ss", poster_at, "-i", str(mp4), "-frames:v", "1", "-update", "1", "poster.png",
            ],
            video_dir,
        )
        stamp.parent.mkdir(parents=True, exist_ok=True)
        stamp.write_text(json.dumps({"fingerprint": fp, "provider": provider}, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    load_dotenv(REPO_ROOT / ".env")
    parser = argparse.ArgumentParser(description="Build Vizmatic public videos.")
    parser.add_argument("slugs", nargs="*", help="Video slugs under videos/ (e.g. riemann-hypothesis)")
    parser.add_argument("--all", action="store_true", help="Build every video in videos/")
    parser.add_argument("--changed", metavar="BASE_REF", help="Build only videos changed since BASE_REF (or all if factory/Vizmatic changed)")
    parser.add_argument("--list", action="store_true", help="List available video slugs")
    parser.add_argument("--list-changed", metavar="BASE_REF", help="Print changed video slugs as JSON")
    parser.add_argument("--check-only", action="store_true", help="Run TypeScript and Vizmatic checks without synthesizing or rendering")
    parser.add_argument("--voice-only", action="store_true", help="Synthesize voice and mix narration.wav only")
    parser.add_argument("--draft", action="store_true", help="Render 720p draft MP4")
    parser.add_argument("--force", action="store_true", help="Ignore cached build stamps")
    args = parser.parse_args()

    all_videos = discover_videos()
    if args.list:
        for slug in all_videos:
            print(slug)
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
