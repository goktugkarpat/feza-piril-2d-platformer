#!/usr/bin/env python3
"""Feza ve Pırıl: Işıklı Rüyalar – records every voice line (SES.LINES in src/ses.js) and writes sesler.js.

Needs:  python3 -m pip install edge-tts   (internet while recording)   and ffmpeg
Run:    python3 gen_voice.py            only new/changed lines are recorded; the rest come from .ses_onbellek/
        python3 gen_voice.py --bolum14  only new space and five companion prompts -> sesler14.js; old banks untouched
        python3 gen_voice.py --hepsi    record everything again
        python3 gen_voice.py --bolum13  only Bölüm 13 lines (p_ip_ / a_ip_) -> sesler13.js
        python3 gen_voice.py --bolum12  only Bölüm 12 lines (p_q_ / an_q_ / a_q_) -> sesler12.js (sesler.js is not touched)

Voice: tr-TR-EmelNeural (natural Turkish female). Key prefix chooses the delivery:
  a_  narrator – slower, slightly lower, tender bedtime-story tone
  p_  Pırıl    – same voice, a little higher (+25 Hz) and a bit faster: a sweet little dragon, not a chipmunk.
               (edge-tts shifts the formants together with the pitch: measured +15 % at +25 Hz, +26 % at +38 Hz.)
  Bölüm 8 neighbours (same voice, small natural shifts — never caricatured): kd_ kabak dede (lower, unhurried), in_ iskelet nine
  (slow, soft), ck_ cadı kız (a child: higher, lively), kk_ kara kedi (playful), ht_ hayalet teyze (high, airy, gentle),
  k2_ kabak ikizler (two little pumpkin kids speaking in unison: the line is recorded twice, a few Hz apart, and mixed 35 ms apart),
  cn_ Cadı Nine (warm grandma, a touch lower), kb_ the carved pumpkin that comes alive (warm, a little deep).
  Bölüm 9 Pırıl's family (same voice, small natural shifts): bn_ Büyükanne Ejderha (slow, warm, a little low: a loving grandma),
  ea_ Pırıl's mum (warm, gentle), eb_ Pırıl's dad (lower, cheerful), fs_ little cousin Fıstık (a tiny dragon: high, soft and shy).
  Bölüm 11 the cute vampire family: vk_ Vela (a girl Feza's age: high, cheerful), vd_ Vampir Dede (round grandpa: slow, deep), vn_ Vampir Nine
  (warm grandma, a little low), vb_ baby Pıtır (one or two words, very high and sweet).
  Bölüm 12 (Annemle Sabancı'da Bir Gün): an_ Feza's mum (same voice, a touch lower and calmer than Pırıl, livelier than the narrator:
  warm and natural). Lines with _q_ (p_q_, an_q_, a_q_) are written to sesler12.js; all other lines to sesler.js.
Output: sesler.js / sesler12.js / sesler13.js  →  window.VOICE_MP3 = {key: base64 mp3}  and  window.VOICE_DUR = {key: seconds}.
"""
import asyncio
import base64
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import time

import edge_tts
import edge_tts.communicate as _etc

# Oct 2026: the old Read Aloud host started answering 403 in some regions (edge-tts issue #490 / PR #491).
# The same key works on Edge's new host; on a 403 we switch hosts (and back, if the new one ever fails).
_KEY = "6A5AA1D4EAFF4E9FB37E23D68491D6F4"
_HOSTS = [_etc.WSS_URL, f"wss://api.msedgeservices.com/tts/cognitiveservices/websocket/v1?Ocp-Apim-Subscription-Key={_KEY}"]
_host = {"i": 1}


def _use_host(i):
    _host["i"] = i % len(_HOSTS)
    _etc.WSS_URL = _HOSTS[_host["i"]]
    if _host["i"] == 1:
        _etc.WSS_HEADERS["Ocp-Apim-Subscription-Key"] = _KEY
    else:
        _etc.WSS_HEADERS.pop("Ocp-Apim-Subscription-Key", None)


_use_host(1)

VOICE = "tr-TR-EmelNeural"
STYLE = {            # prefix → (rate, pitch, volume)
    "a_": ("-18%", "-3Hz", "+0%"),
    "p_": ("-3%", "+16Hz", "+0%"),   # +16 Hz: F0 ≈ 230 Hz (measured; +25 Hz gave 245 Hz and a sharper tone): soft, cute, a little high, not shrill. Rate -3 %: unhurried and sweet.
    "kd_": ("-5%", "-12Hz", "+0%"),   # Bölüm 8 kabak dede
    "in_": ("-7%", "-6Hz", "+0%"),    # iskelet nine
    "ck_": ("+6%", "+28Hz", "+0%"),    # cadı kız
    "kk_": ("+2%", "+10Hz", "+0%"),    # kara kedi
    "ht_": ("-3%", "+20Hz", "+0%"),    # hayalet teyze
    "k2_": ("+6%", "+24Hz", "+0%"),    # kabak ikizler (1. ses; 2. ses CHORUS'ta)
    "cn_": ("-10%", "-8Hz", "+0%"),    # Cadı Nine
    "kb_": ("-6%", "-10Hz", "+0%"),    # canlanan yüz kabağı (sıcak, biraz kalın)
    "bn_": ("-14%", "-14Hz", "+0%"),   # Bölüm 9 Büyükanne Ejderha (yavaş, sıcak, sevecen)
    "ea_": ("-6%", "-3Hz", "+0%"),     # Pırıl'ın annesi (sıcak, yumuşak)
    "eb_": ("-5%", "-20Hz", "+0%"),    # Pırıl'ın babası (biraz kalın, neşeli)
    "fs_": ("-9%", "+30Hz", "-8%"),    # minik kuzen Fıstık (ince, utangaç, yavaş)
    "vk_": ("+4%", "+26Hz", "+0%"),    # Bölüm 11 Vela (vampir kız: neşeli, Feza yaşında)
    "vd_": ("-10%", "-22Hz", "+0%"),   # Vampir Dede (tombul, neşeli: tok ve ağır)
    "vn_": ("-9%", "-10Hz", "+0%"),    # Vampir Nine (sıcak, yumuşak: anlatıcıdan biraz pes, şefkatli)
    "vb_": ("-4%", "+40Hz", "+0%"),    # Pıtır (bebek; çok kısa sözler: ince, tatlı)
    "an_": ("-6%", "-7Hz", "+0%"),     # Bölüm 12 Feza'nın annesi (sıcak, sakin, doğal: anlatıcıdan canlı, Pırıl'dan pes)
}
# Second take mixed under the first one (same rate → same timing): two children saying it together.
CHORUS = {"k2_": ("+6%", "+38Hz", "+0%")}


def chorus(key):
    for pre, st in CHORUS.items():
        if key.startswith(pre):
            return st
    return None
DEFAULT = ("-5%", "+2Hz", "+0%")
# Pırıl's "how to play" lines are said a touch slower than her happy chatter: Feza learns the controls from them.
TEACH = {"p_merhaba", "p_zipla", "p_ciftzipla", "p_minder", "p_buyuk", "p_uyuyor", "p_sakli", "p_i_yuz", "p_i_ahtapot_yardim"}
TEACH_RATE = "-6%"

# How words should *sound* (subtitles keep the normal spelling). Regex → spoken form.
# Avoid short capitalised words the engine may read as abbreviations ("Aa" was read as "Anadolu Ajansı").
PRONOUNCE = [
    (r"\.\.\.", "."),          # trailing dots: let the engine end the sentence calmly
]

ROOT = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(ROOT, ".ses_onbellek")
OUT = os.path.join(ROOT, "sesler.js")
OUT13 = os.path.join(ROOT, "sesler13.js")
OUT14 = os.path.join(ROOT, "sesler14.js")
OUT12 = os.path.join(ROOT, "sesler12.js")   # Bölüm 12 cümleleri (p_q_ an_q_ a_q_): index.html sesler.js'ten sonra yükler


def bolum13(key):
    return re.match(r"^(p|a)_ip_", key) is not None

def bolum12(key):
    return re.match(r"^(p|an|a)_q_", key) is not None


def bolum14(key):
    # New companion bank also carries only the five new B12/B13 prompts.
    # --bolum14 never rewrites the established voice banks.
    return re.match(r"^(p|an|a)_uz_", key) is not None or key == "p_q_ekmek" or key.startswith("p_ip_oyuncak_")
OUT_ISIL = os.path.join(ROOT, "sesler_isil.js")   # Işıl (Bölüm 3 finali) anlatıcı cümleleri: a_is_


def bolumisil(key):
    return key.startswith("a_is_")


SRC = os.path.join(ROOT, "src", "ses.js")


def remove_temp(path):
    try:
        os.remove(path)
    except (FileNotFoundError, PermissionError):
        pass  # a synced (Dropbox) folder may briefly hold a finished temporary file


FFMPEG = "/opt/homebrew/bin/ffmpeg" if os.path.exists("/opt/homebrew/bin/ffmpeg") else shutil.which("ffmpeg")
FFPROBE = "/opt/homebrew/bin/ffprobe" if os.path.exists("/opt/homebrew/bin/ffprobe") else shutil.which("ffprobe")
if not FFMPEG:   # Windows without ffmpeg on PATH: the copy bundled with the imageio-ffmpeg package (pip install imageio-ffmpeg)
    try:
        import imageio_ffmpeg
        FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        FFMPEG = None
# 1) shorten long pauses between sentences to ~0.4 s, 2) keep ~40 ms before the first sound and
# 3) ~120 ms after the last one (reverse trick trims the tail), 4) tiny fades against clicks, 5) gentle loudness match.
TRIM = ("silenceremove=stop_periods=-1:stop_threshold=-40dB:stop_duration=0.1:stop_silence=0.34,"
        "silenceremove=start_periods=1:start_threshold=-48dB:start_silence=0.04:detection=peak,"
        "areverse,silenceremove=start_periods=1:start_threshold=-48dB:start_silence=0.12:detection=peak,"
        "afade=t=in:d=0.03,areverse,afade=t=in:d=0.006,"
        "loudnorm=I=-18:TP=-2:LRA=11")


# Pırıl's lines get a gentle high-shelf cut (-2.5 dB above ~4.5 kHz) and a soft ceiling at 9.5 kHz before loudness matching:
# sibilants and the "edge" of the pitched-up voice are rounded off; nothing robotic (the narrator's lines are untouched).
TRIM_P = TRIM.replace("loudnorm", "treble=g=-2.5:f=4500,lowpass=f=9500,loudnorm")


def trim_chain(key):
    return TRIM if key.startswith("a_") else TRIM_P   # every character voice (Pırıl, Bölüm 8 neighbours) gets the soft treble rounding


def style(key):
    for pre, st in STYLE.items():
        if key.startswith(pre):
            new_teach = re.match(r"^p_uz_(ay|mars|jupiter|uranus)_", key) or key == "p_q_ekmek" or key.startswith("p_ip_oyuncak_")
            return (TEACH_RATE,) + st[1:] if key in TEACH or new_teach else st
    return DEFAULT


def spoken(text):
    for pat, rep in PRONOUNCE:
        text = re.sub(pat, rep, text)
    return text


def load_lines():
    m = re.search(r"/\*SESLER\*/(.*?)/\*SESLER-SON\*/", open(SRC, encoding="utf-8").read(), re.S)
    if not m:
        sys.exit("LINES block (/*SESLER*/ ... /*SESLER-SON*/) not found in src/ses.js")
    return json.loads(m.group(1))


def cache_path(key, text):
    rate, pitch, vol = style(key)
    ch = chorus(key)
    h = hashlib.md5((f"{VOICE}|{rate}|{pitch}|{vol}|{trim_chain(key)}|{spoken(text)}" + (f"|koro{ch}" if ch else "")).encode("utf-8")).hexdigest()
    return os.path.join(CACHE, h + ".mp3")


def duration(path):
    try:
        if FFPROBE:
            r = subprocess.run([FFPROBE, "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
                               capture_output=True, text=True, timeout=20)
            return float(r.stdout.strip())
        # no ffprobe (e.g. imageio-ffmpeg): decode once and read the last "time=" ffmpeg reports
        r = subprocess.run([FFMPEG, "-hide_banner", "-nostats", "-stats_period", "100", "-i", path, "-f", "null", "-"],
                           capture_output=True, text=True, timeout=30)
        ts = re.findall(r"time=(\d+):(\d+):(\d+(?:\.\d+)?)", r.stderr)
        if not ts:
            r = subprocess.run([FFMPEG, "-hide_banner", "-i", path, "-f", "null", "-"], capture_output=True, text=True, timeout=30)
            ts = re.findall(r"time=(\d+):(\d+):(\d+(?:\.\d+)?)", r.stderr)
        h, m, sec = ts[-1]
        return int(h) * 3600 + int(m) * 60 + float(sec)
    except Exception:
        return 0.0


def trim(raw, final, key=""):
    """Cut leading/trailing silence and re-encode as small mono mp3. Falls back to the raw file without ffmpeg."""
    if not FFMPEG:
        shutil.move(raw, final)
        return
    tmp = final + ".tmp.mp3"
    r = subprocess.run([FFMPEG, "-y", "-loglevel", "error", "-i", raw, "-af", trim_chain(key),
                        "-ac", "1", "-ar", "24000", "-c:a", "libmp3lame", "-b:a", "48k", tmp])
    if r.returncode == 0 and os.path.exists(tmp) and os.path.getsize(tmp) > 800:
        os.replace(tmp, final)
        remove_temp(raw)
    else:
        if os.path.exists(tmp):
            remove_temp(tmp)
        shutil.move(raw, final)


async def record(key, text, sem):
    final = cache_path(key, text)
    raw = final + ".raw.mp3"
    rate, pitch, vol = style(key)
    async with sem:
        for attempt in range(6):
            try:
                await edge_tts.Communicate(spoken(text), VOICE, rate=rate, pitch=pitch, volume=vol).save(raw)
                if os.path.getsize(raw) < 1000:
                    raise RuntimeError("empty audio")
                ch = chorus(key)
                if ch and FFMPEG:   # two voices in unison: second take 35 ms later, both a little softer
                    raw2, mix = final + ".raw2.mp3", final + ".mix.mp3"
                    await edge_tts.Communicate(spoken(text), VOICE, rate=ch[0], pitch=ch[1], volume=ch[2]).save(raw2)
                    r = subprocess.run([FFMPEG, "-y", "-loglevel", "error", "-i", raw, "-i", raw2, "-filter_complex",
                                        "[1:a]adelay=35|35[b];[0:a][b]amix=inputs=2:duration=longest:normalize=0,volume=0.7",
                                        "-ac", "1", "-c:a", "libmp3lame", "-b:a", "96k", mix])
                    remove_temp(raw2)
                    if r.returncode == 0 and os.path.exists(mix) and os.path.getsize(mix) > 1000:
                        remove_temp(raw)
                        os.replace(mix, raw)
                    elif os.path.exists(mix):
                        remove_temp(mix)
                trim(raw, final, key)
                return True
            except Exception as e:  # network hiccup / rate limit: back off and retry
                if os.path.exists(raw):
                    remove_temp(raw)
                if "403" in str(e) and attempt % 2 == 0:
                    _use_host(_host["i"] + 1)
                if attempt == 5:
                    print(f"  FAILED {key}: {e}")
                    return False
                await asyncio.sleep(1.5 * (attempt + 1))


async def main():
    os.makedirs(CACHE, exist_ok=True)
    all_lines = load_lines()
    only12 = "--bolum12" in sys.argv
    only13 = "--bolum13" in sys.argv
    only14 = "--bolum14" in sys.argv
    onlyisil = "--isil" in sys.argv
    if sum((only12, only13, only14)) > 1:
        sys.exit("Choose one chapter output at a time")
    lines = {k: t for k, t in all_lines.items() if bolumisil(k)} if onlyisil else {k: t for k, t in all_lines.items() if bolum14(k)} if only14 else {k: t for k, t in all_lines.items() if bolum13(k) and not bolum14(k)} if only13 else {k: t for k, t in all_lines.items() if bolum12(k) and not bolum14(k)} if only12 else all_lines
    if "--hepsi" in sys.argv:
        for k, t in lines.items():
            if os.path.exists(cache_path(k, t)):
                os.remove(cache_path(k, t))
    todo = [(k, t) for k, t in lines.items() if not os.path.exists(cache_path(k, t))]
    print(f"{len(lines)} lines, {len(todo)} to record ({VOICE})")
    sem = asyncio.Semaphore(4)
    await asyncio.gather(*(record(k, t, sem) for k, t in todo))

    mp3, dur, missing = {}, {}, []
    for k, t in lines.items():
        p = cache_path(k, t)
        d = duration(p) if os.path.exists(p) else 0.0
        if d < 0.25:
            missing.append(k)
            continue
        mp3[k] = base64.b64encode(open(p, "rb").read()).decode("ascii")
        dur[k] = round(d, 3)
        letters = len(re.sub(r"[^\wçğıöşüÇĞİÖŞÜ]", "", t))
        lps = letters / max(0.2, d - 0.16)   # minus the kept head/tail padding
        lo, hi = (7.5, 15.5) if k.startswith("a_") else (8.5, 18.5)
        flag = "   <-- check (unusual speed: maybe read as an abbreviation?)" if lps < lo or lps > hi else ""
        print(f"  {k:14s} {d:5.2f} s  {lps:4.1f} letters/s{flag}")

    if missing:
        print("MISSING (existing voice bank preserved):", ", ".join(missing))
        sys.exit(1)
    if onlyisil:
        write_out(OUT_ISIL, mp3, dur, True)
        return
    if only14:
        write_out(OUT14, mp3, dur, True)
        return
    k12 = [k for k in mp3 if bolum12(k) and not bolum14(k)]
    k13 = [k for k in mp3 if bolum13(k) and not bolum14(k)]
    if not only13:
        write_out(OUT12, {k: mp3[k] for k in k12}, {k: dur[k] for k in k12}, True)
    if not only12:
        write_out(OUT13, {k: mp3[k] for k in k13}, {k: dur[k] for k in k13}, True)
    if not only12 and not only13:
        k14 = [k for k in mp3 if bolum14(k)]
        write_out(OUT14, {k: mp3[k] for k in k14}, {k: dur[k] for k in k14}, True)
        kis = [k for k in mp3 if bolumisil(k)]
        write_out(OUT_ISIL, {k: mp3[k] for k in kis}, {k: dur[k] for k in kis}, True)
        rest = [k for k in mp3 if not bolumisil(k) and not bolum12(k) and not bolum13(k) and not bolum14(k)]
        write_out(OUT, {k: mp3[k] for k in rest}, {k: dur[k] for k in rest}, False)
        keep = {os.path.basename(cache_path(k, t)) for k, t in all_lines.items()}
        for f in os.listdir(CACHE):  # drop recordings of lines that no longer exist and temp leftovers
            if f.endswith(".mp3") and f not in keep:
                remove_temp(os.path.join(CACHE, f))


def write_out(path, mp3, dur, part12):
    temp_out = path + ".tmp"
    with open(temp_out, "w", encoding="utf-8", newline="\n") as f:   # LF also on Windows (the Mac commits it)
        if part12:   # loaded after sesler.js: adds to the same tables
            if path == OUT_ISIL:
                f.write("// Feza ve Pırıl – Işıl (Bölüm 3 finali) anlatıcı sesleri; python3 gen_voice.py --isil.\n")
            elif path == OUT14:
                f.write("// Feza ve Pırıl – Annemle Yıldız Yolculuğu ve yeni B12/B13 ipuçları; python3 gen_voice.py --bolum14.\n")
            elif path == OUT13:
                f.write("// Feza ve Pırıl – İpek Göğü sesleri; python3 gen_voice.py --bolum13.\n")
            else:
                f.write("// Feza ve Pırıl – Bölüm 12 (Annemle Sabancı'da Bir Gün) ses kayıtları (tr-TR-EmelNeural; p_q_ Pırıl, an_q_ anne, a_q_ anlatıcı).\n"
                    "// Bu dosya gen_voice.py ile üretildi (python3 gen_voice.py --bolum12); elle değiştirmeyin. Cümleler: src/ses.js › LINES.\n")
            f.write("window.VOICE_MP3 = window.VOICE_MP3 || {};\nObject.assign(window.VOICE_MP3, {\n")
            f.write(",\n".join(f" {json.dumps(k)}: \"{v}\"" for k, v in mp3.items()))
            f.write("\n});\n")
            f.write("window.VOICE_DUR = window.VOICE_DUR || {};\nObject.assign(window.VOICE_DUR, " + json.dumps(dur, ensure_ascii=False) + ");\n")
        else:
            f.write("// Feza ve Pırıl: Işıklı Rüyalar – voice lines (tr-TR-EmelNeural; a_ narrator, p_ Pırıl), trimmed mono mp3 as base64.\n"
                    "// Bu dosya gen_voice.py ile üretildi; elle değiştirmeyin. Cümleler: src/ses.js › LINES.\n")
            f.write("window.VOICE_MP3 = {\n")
            f.write(",\n".join(f" {json.dumps(k)}: \"{v}\"" for k, v in mp3.items()))
            f.write("\n};\n")
            f.write("window.VOICE_DUR = " + json.dumps(dur, ensure_ascii=False) + ";\n")
    for attempt in range(10):   # Windows/Dropbox may briefly lock the old file
        try:
            os.replace(temp_out, path)
            break
        except PermissionError:
            if attempt == 9:
                raise
            time.sleep(0.5)
    size = os.path.getsize(path) / 1024
    print(f"wrote {os.path.basename(path)}: {len(mp3)} lines, {sum(dur.values()):.1f} s audio, {size:.0f} KB")


if __name__ == "__main__":
    asyncio.run(main())
