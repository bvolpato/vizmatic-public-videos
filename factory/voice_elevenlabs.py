#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12,<3.13"
# dependencies = [
#   "soundfile",
#   "numpy",
# ]
# ///
"""Optional ElevenLabs narration synthesizer compatible with Vizmatic's voice.py contract.

Kokoro stays the default free local engine. Opt into ElevenLabs by setting
VIZMATIC_VOICE_PROVIDER=elevenlabs in .env (or the environment) and supplying an API key
via ELEVENLABS_API_KEY or ~/.config/fido/elevenlabs_api_key.

Usage: voice_elevenlabs.py <video-dir>
"""
from __future__ import annotations

import base64
import hashlib
import json
import os
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

import numpy as np
import soundfile as sf

RATE = 24000
DEFAULT_MODEL_ID = "eleven_multilingual_v2"
DEFAULT_KEY_FILE = Path.home() / ".config/fido/elevenlabs_api_key"

# Friendly presets for ElevenLabs studio voices (any raw voice_id also works).
VOICE_PRESETS: dict[str, str] = {
    "bella": "hpp4J3VqNfWAUOO0d1Us",    # Professional, Bright, Warm (informative/educational)
    "sarah": "EXAVITQu4vr4xnSDxMaL",    # Mature, Reassuring, Confident
    "alice": "Xb7hH8MSUJpSbSDYk0k2",    # Clear, Engaging Educator (British)
    "matilda": "XrExE9yKIg1WjnnlVkGX",  # Knowledgeable, Professional
    "jessica": "cgSgspJ2msm6clMCkdW9",  # Playful, Bright, Warm
    "lily": "pFZP5JQG7iQjIQuC4Bku",     # Velvety Actress (British)
}


def resolve_voice_id(name_or_id: str) -> str:
    return VOICE_PRESETS.get(name_or_id.strip().lower(), name_or_id.strip())


def load_api_key() -> str:
    env_key = os.environ.get("ELEVENLABS_API_KEY", "").strip()
    if env_key:
        return env_key
    key_path = Path(os.environ.get("ELEVENLABS_API_KEY_FILE", str(DEFAULT_KEY_FILE))).expanduser()
    if key_path.is_file():
        key = key_path.read_text(encoding="utf-8").strip()
        if key:
            return key
    raise SystemExit(
        f"ElevenLabs API key not found. Set ELEVENLABS_API_KEY in .env or save it to {key_path} (chmod 600)."
    )


def chars_to_words(alignment: dict, duration: float) -> list[dict]:
    chars = alignment.get("characters") or []
    starts = alignment.get("character_start_times_seconds") or []
    ends = alignment.get("character_end_times_seconds") or []
    n = min(len(chars), len(starts), len(ends))
    words: list[dict] = []
    buf: list[str] = []
    w_start: float | None = None
    w_end = 0.0

    def flush() -> None:
        nonlocal buf, w_start, w_end
        if not buf or w_start is None:
            buf, w_start = [], None
            return
        token = "".join(buf)
        if re.search(r"\w", token):
            clean = re.sub(r"^[^\w]+|[^\w]+$", "", token)
            if clean:
                st = round(min(w_start, duration), 3)
                en = round(min(max(w_end, st), duration), 3)
                words.append({"text": clean, "start": st, "end": en})
        buf, w_start = [], None

    for i in range(n):
        ch = chars[i]
        if ch.isspace() or ch in ("—", "–", "-"):
            flush()
        else:
            if w_start is None:
                w_start = float(starts[i])
            w_end = float(ends[i])
            buf.append(ch)
    flush()
    return words


def synthesize(text: str, voice_id: str, model_id: str, speed: float, api_key: str) -> tuple[np.ndarray, list[dict]]:
    payload = {
        "text": text,
        "model_id": model_id,
        "voice_settings": {
            "stability": 0.44,
            "similarity_boost": 0.78,
            "style": 0.22,
            "use_speaker_boost": True,
            "speed": max(0.7, min(1.2, float(speed))),
        },
    }
    req = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/with-timestamps?output_format=pcm_{RATE}",
        data=json.dumps(payload).encode("utf-8"),
        headers={"xi-api-key": api_key, "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            body = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as err:
        detail = err.read().decode("utf-8", errors="replace")[:300]
        raise RuntimeError(f"ElevenLabs HTTP {err.code}: {detail}") from err

    pcm = base64.b64decode(body["audio_base64"])
    samples = np.frombuffer(pcm, dtype=np.int16).astype(np.float32) / 32768.0
    duration = len(samples) / RATE
    align = body.get("alignment") or body.get("normalized_alignment") or {}
    return samples, chars_to_words(align, duration)


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("Usage: voice_elevenlabs.py <video-dir>")
    root = Path(sys.argv[1]).resolve()
    repo_root = Path(__file__).resolve().parent.parent
    viz_narration = repo_root / "node_modules/vizmatic/tools/narration"
    if not viz_narration.is_dir():
        raise SystemExit(f"Missing Vizmatic narration tools at {viz_narration}. Run npm install first.")
    sys.path.insert(0, str(viz_narration))
    import checks  # type: ignore
    import film as viz_film  # type: ignore

    found = viz_film.open_film(root, "voice")
    voice_cfg = found.voice
    el_cfg = found.given.get("elevenlabs") or {}
    voice_spec = (
        os.environ.get("ELEVENLABS_VOICE_ID")
        or os.environ.get("ELEVENLABS_VOICE")
        or el_cfg.get("voice")
        or "bella"
    )
    voice_id = resolve_voice_id(voice_spec)
    model_id = os.environ.get("ELEVENLABS_MODEL_ID") or el_cfg.get("model_id") or DEFAULT_MODEL_ID
    speed = float(os.environ.get("ELEVENLABS_SPEED") or el_cfg.get("speed") or voice_cfg.get("speed", 1.10))

    header, scenes = checks.outline(found.script, voice_cfg)
    (root / "audio").mkdir(exist_ok=True)
    out = {**header, "fingerprint": checks.fingerprint(header, scenes), "scenes": []}

    api_key: str | None = None
    new_count = 0
    for scene in scenes:
        beats = []
        for index, beat in enumerate(scene["beats"]):
            spoken = beat["say"]
            key = hashlib.sha1(f"el|{voice_id}|{model_id}|{speed}|{spoken}".encode("utf-8")).hexdigest()[:12]
            wav = root / "audio" / f"{scene['id']}-{index}-el-{key}.wav"
            side = wav.with_suffix(".json")
            cached = None
            try:
                info = json.loads(side.read_text(encoding="utf-8"))
                if wav.stat().st_size > checks.EMPTY_WAV and isinstance(info["words"], list) and info["duration"] > 0:
                    cached = info
            except (OSError, ValueError, KeyError, TypeError):
                cached = None

            if cached is None:
                if api_key is None:
                    api_key = load_api_key()
                    print(f"voice(elevenlabs): voice={voice_spec} ({voice_id}) model={model_id} speed={speed}", file=sys.stderr, flush=True)
                samples, words = synthesize(spoken, voice_id, model_id, speed, api_key)
                sf.write(wav, samples, RATE, subtype="PCM_16")
                cached = {"words": words, "duration": len(samples) / RATE}
                viz_film.write_json(side, cached)
                new_count += 1

            beats.append({
                "wav": wav.name,
                "say": beat["say"],
                "text": beat["text"],
                "duration": cached["duration"],
                "hold": beat["hold"],
                "words": cached["words"],
                **({"cues": beat["cues"]} if "cues" in beat else {}),
            })
            print(scene["id"], index, round(cached["duration"], 2), flush=True)
        out["scenes"].append({"id": scene["id"], "title": scene["title"], "beats": beats})

    viz_film.write_timing(root / "timing.json", out)
    takes = [beat for scene in out["scenes"] for beat in scene["beats"]]
    seconds = sum(beat["duration"] + beat["hold"] for beat in takes)
    print("total", round(seconds, 1))
    print(f"voice(elevenlabs): {len(takes)} takes, {new_count} new, {seconds:.1f} s of voice.", flush=True)


if __name__ == "__main__":
    main()
