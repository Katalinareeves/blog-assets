#!/usr/bin/env python3
"""
Lee el perfil publico de YouTube Music de minatozakitty y arma radio/data.json
para la escena de radio de "el jardin".

No usa login ni cookies: la pagina del perfil es publica y trae los datos
incrustados en el HTML. Si YouTube cambia el formato de esa pagina, este
script puede dejar de encontrar las secciones y va a fallar a proposito
(en vez de subir un data.json vacio y romper la radio).
"""
import json
import re
import sys
import urllib.request
from datetime import datetime, timezone

PROFILE_URL = "https://music.youtube.com/@minatozakitty2778"
MAPPING_PATH = "radio/mapping.json"
OUTPUT_PATH = "radio/data.json"

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)


def fetch_html(url):
    req = urllib.request.Request(
        url,
        headers={"User-Agent": USER_AGENT, "Accept-Language": "es-ES,es;q=0.9"},
    )
    with urllib.request.urlopen(req, timeout=20) as r:
        return r.read().decode("utf-8", errors="ignore")


_JS_ESCAPE = re.compile(rb"\\x([0-9a-fA-F]{2})|\\(.)")


def _unescape(raw):
    """Decodifica los escapes de string de JS (\\xHH, \\\\, \\/, etc.) tal como
    los interpretaria el motor de JS, sin tocar el texto UTF-8 literal (tildes, ñ,
    emojis) que viene sin escapar."""

    def repl(m):
        hex_pair, other = m.group(1), m.group(2)
        if hex_pair is not None:
            return bytes([int(hex_pair, 16)])
        return other

    as_bytes = _JS_ESCAPE.sub(repl, raw.encode("utf-8"))
    return as_bytes.decode("utf-8")


def extract_data_blobs(html):
    """La pagina trae varios initialData.push({..., data: '...json escapado...'}).
    Devuelve la lista de esos JSON ya parseados."""
    blobs = []
    for m in re.finditer(r"data:\s*'((?:[^'\\]|\\.)*)'", html):
        try:
            blobs.append(json.loads(_unescape(m.group(1))))
        except (UnicodeDecodeError, json.JSONDecodeError):
            continue
    return blobs


def walk(node):
    if isinstance(node, dict):
        yield node
        for v in node.values():
            yield from walk(v)
    elif isinstance(node, list):
        for v in node:
            yield from walk(v)


def _song_item(item):
    """Si el item es una cancion con videoId y un ultimo dato numerico
    (la cuenta de reproducciones, en el idioma que sea), la devuelve parseada.
    Si no calza con esa forma, devuelve None."""
    renderer = item.get("musicResponsiveListItemRenderer")
    if not renderer:
        return None
    cols = renderer.get("flexColumns", [])
    if len(cols) < 2:
        return None
    title_runs = cols[0]["musicResponsiveListItemFlexColumnRenderer"]["text"].get("runs", [])
    if not title_runs:
        return None
    video_id = next(
        (
            run.get("navigationEndpoint", {}).get("watchEndpoint", {}).get("videoId")
            for run in title_runs
            if run.get("navigationEndpoint", {}).get("watchEndpoint", {}).get("videoId")
        ),
        None,
    )
    sub_runs = cols[1]["musicResponsiveListItemFlexColumnRenderer"]["text"].get("runs", [])
    if not video_id or not sub_runs or not re.search(r"\d", sub_runs[-1].get("text", "")):
        return None
    return {
        "title": title_runs[0]["text"],
        "artist": sub_runs[0]["text"],
        "plays": sub_runs[-1]["text"],
        "videoId": video_id,
    }


def find_songs(blobs):
    """Busca el primer musicShelfRenderer cuyos items sean todos 'canciones con
    reproducciones' segun la forma de _song_item. No depende del titulo de la
    seccion, que YouTube traduce distinto segun la region de quien pide la
    pagina (confirmado: 'Canciones que mas escuchas' en LatAm vs 'Canciones
    escuchadas en bucle' desde datacenters en EEUU)."""
    for blob in blobs:
        for node in walk(blob):
            shelf = node.get("musicShelfRenderer")
            if not shelf:
                continue
            contents = shelf.get("contents", [])
            if not contents:
                continue
            parsed = [_song_item(item) for item in contents]
            if all(parsed):
                return parsed
    return []


_ARTIST_SUBTITLE = re.compile(r"^\d+\s+\S+$")


def _thumbnail_url(renderer):
    thumbs = (
        renderer.get("thumbnailRenderer", {})
        .get("musicThumbnailRenderer", {})
        .get("thumbnail", {})
        .get("thumbnails", [])
    )
    if not thumbs:
        return ""
    return max(thumbs, key=lambda t: t.get("width", 0)).get("url", "")


def find_artists(blobs, known_artists):
    """Busca, entre todos los musicCarouselShelfRenderer cuyos items tengan
    forma de 'artista + una sola cifra de tiempo' (ej. '2 horas'), el que mas
    se solape con los artistas que ya salieron en find_songs(). Asi se
    distingue de otros carruseles (videos, playlists) sin depender de texto
    fijo en ningun idioma."""
    best_shelf, best_score = None, 0
    known_lower = {a.lower() for a in known_artists}
    for blob in blobs:
        for node in walk(blob):
            shelf = node.get("musicCarouselShelfRenderer")
            if not shelf:
                continue
            contents = shelf.get("contents", [])
            if not contents:
                continue
            parsed = []
            ok = True
            for item in contents:
                renderer = item.get("musicTwoRowItemRenderer")
                title_runs = renderer.get("title", {}).get("runs", []) if renderer else []
                subtitle_runs = renderer.get("subtitle", {}).get("runs", []) if renderer else []
                if not renderer or not title_runs or len(subtitle_runs) != 1:
                    ok = False
                    break
                subtitle_text = subtitle_runs[0].get("text", "")
                if not _ARTIST_SUBTITLE.match(subtitle_text):
                    ok = False
                    break
                parsed.append(
                    {
                        "artist": title_runs[0]["text"],
                        "time": subtitle_text,
                        "photo": _thumbnail_url(renderer),
                    }
                )
            if not ok:
                continue
            score = sum(1 for a in parsed if a["artist"].lower() in known_lower)
            if score > best_score:
                best_shelf, best_score = parsed, score
    return best_shelf or []


def plays_number(text):
    m = re.search(r"\d+", text)
    return int(m.group()) if m else 0


def main():
    html = fetch_html(PROFILE_URL)
    blobs = extract_data_blobs(html)

    scraped_songs = find_songs(blobs)
    if not scraped_songs:
        sys.exit(
            "error: no se encontro la seccion de canciones mas escuchadas "
            "(puede que YouTube haya cambiado el formato de la pagina). "
            "No se va a pisar radio/data.json."
        )
    scraped_artists = find_artists(blobs, [s["artist"] for s in scraped_songs])

    with open(MAPPING_PATH, encoding="utf-8") as f:
        mapping = json.load(f)

    # Todo lo que de verdad es top esta semana. Si ya tenes el mp3 subido y
    # registrado en mapping.json, se reproduce self-hosted; si no, se enlaza
    # directo al video oficial de YouTube (no hay audio propio que servir
    # todavia). En cuanto lo subas y lo mapees, pasa solo a self-hosted.
    songs = []
    for s in scraped_songs:
        m = mapping.get(s["videoId"])
        if m:
            songs.append(
                {
                    "title": s["title"],
                    "artist": s["artist"],
                    "plays": s["plays"],
                    "videoId": s["videoId"],
                    "src": m["src"],
                    "cover": m.get("cover", ""),
                    "external": False,
                }
            )
        else:
            songs.append(
                {
                    "title": s["title"],
                    "artist": s["artist"],
                    "plays": s["plays"],
                    "videoId": s["videoId"],
                    "src": f"https://www.youtube.com/watch?v={s['videoId']}",
                    "cover": "",
                    "external": True,
                }
            )

    # YouTube no siempre capitaliza igual al mismo artista entre secciones
    # (ej: "twenty one pilots" en canciones vs "Twenty One Pilots" en artistas),
    # asi que el cruce se hace en minusculas.
    songs_by_artist = {}
    for s in songs:
        songs_by_artist.setdefault(s["artist"].lower(), []).append(s)

    artists = []
    for a in scraped_artists:
        candidates = songs_by_artist.get(a["artist"].lower())
        if not candidates:
            continue
        best = max(candidates, key=lambda s: plays_number(s["plays"]))
        # La tapa siempre es la foto real del artista (asi se ve algo aunque
        # su cancion representativa todavia no tenga mp3 propio subido).
        artists.append(
            {
                "artist": a["artist"],
                "time": a["time"],
                "src": best["src"],
                "cover": a["photo"] or best["cover"],
                "external": best["external"],
            }
        )

    try:
        with open(OUTPUT_PATH, encoding="utf-8") as f:
            previous = json.load(f)
    except FileNotFoundError:
        previous = {}

    now = datetime.now(timezone.utc)
    meses = [
        "enero", "febrero", "marzo", "abril", "mayo", "junio",
        "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
    ]
    week_label = f"semana del {now.day} de {meses[now.month - 1]}"

    past_weeks = previous.get("pastWeeks", [])
    if previous.get("songs") or previous.get("artists"):
        past_weeks.insert(
            0,
            {
                "label": previous.get("weekLabel", "semana anterior"),
                "songs": previous.get("songs", []),
                "artists": previous.get("artists", []),
            },
        )
    past_weeks = past_weeks[:12]

    output = {
        "weekLabel": week_label,
        "generatedAt": now.isoformat(),
        "songs": songs,
        "artists": artists,
        "pastWeeks": past_weeks,
    }

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    sin_mp3_propio = sum(1 for s in songs if s["external"])
    print(f"listo: {len(songs)} canciones y {len(artists)} artistas en radio/data.json")
    if sin_mp3_propio:
        print(f"aviso: {sin_mp3_propio} cancion(es) enlazan a YouTube por no tener mp3 propio mapeado todavia")


if __name__ == "__main__":
    main()
