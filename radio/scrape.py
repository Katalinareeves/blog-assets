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

SONGS_HEADER = "Canciones que más escuchas"
ARTISTS_HEADER = "Tus artistas favoritos"

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


def _shelf_title(shelf):
    header = shelf.get("header", {})
    for renderer in header.values():
        runs = (renderer.get("title") or {}).get("runs") or []
        if runs:
            return runs[0].get("text", "")
    runs = (shelf.get("title") or {}).get("runs") or []
    return runs[0]["text"] if runs else ""


def find_shelf(blobs, header_text):
    for blob in blobs:
        for node in walk(blob):
            shelf = node.get("musicShelfRenderer") or node.get("musicCarouselShelfRenderer")
            if shelf and header_text in _shelf_title(shelf):
                return shelf
    return None


def parse_songs(shelf):
    songs = []
    for item in shelf.get("contents", []):
        renderer = item.get("musicResponsiveListItemRenderer")
        if not renderer:
            continue
        cols = renderer.get("flexColumns", [])
        if len(cols) < 2:
            continue
        title_runs = cols[0]["musicResponsiveListItemFlexColumnRenderer"]["text"]["runs"]
        title = title_runs[0]["text"]
        video_id = next(
            (
                run.get("navigationEndpoint", {}).get("watchEndpoint", {}).get("videoId")
                for run in title_runs
                if run.get("navigationEndpoint", {}).get("watchEndpoint", {}).get("videoId")
            ),
            None,
        )
        sub_runs = cols[1]["musicResponsiveListItemFlexColumnRenderer"]["text"]["runs"]
        artist = sub_runs[0]["text"] if sub_runs else ""
        plays_text = sub_runs[-1]["text"] if sub_runs else ""
        if not video_id or "reproduc" not in plays_text:
            continue
        songs.append({"title": title, "artist": artist, "plays": plays_text, "videoId": video_id})
    return songs


def parse_artists(shelf):
    artists = []
    for item in shelf.get("contents", []):
        renderer = item.get("musicTwoRowItemRenderer")
        if not renderer:
            continue
        title_runs = renderer.get("title", {}).get("runs", [])
        subtitle_runs = renderer.get("subtitle", {}).get("runs", [])
        if not title_runs or not subtitle_runs:
            continue
        artists.append({"artist": title_runs[0]["text"], "time": subtitle_runs[0]["text"]})
    return artists


def plays_number(text):
    m = re.search(r"\d+", text)
    return int(m.group()) if m else 0


def main():
    html = fetch_html(PROFILE_URL)
    blobs = extract_data_blobs(html)

    songs_shelf = find_shelf(blobs, SONGS_HEADER)
    artists_shelf = find_shelf(blobs, ARTISTS_HEADER)

    scraped_songs = parse_songs(songs_shelf) if songs_shelf else []
    scraped_artists = parse_artists(artists_shelf) if artists_shelf else []

    if not scraped_songs:
        sys.exit(
            "error: no se encontro la seccion 'Canciones que mas escuchas' "
            "(puede que YouTube haya cambiado el formato de la pagina). "
            "No se va a pisar radio/data.json."
        )

    with open(MAPPING_PATH, encoding="utf-8") as f:
        mapping = json.load(f)

    songs = []
    for s in scraped_songs:
        m = mapping.get(s["videoId"])
        if not m:
            continue
        songs.append(
            {
                "title": s["title"],
                "artist": s["artist"],
                "plays": s["plays"],
                "videoId": s["videoId"],
                "src": m["src"],
                "cover": m.get("cover", ""),
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
        artists.append(
            {
                "artist": a["artist"],
                "time": a["time"],
                "src": best["src"],
                "cover": best["cover"],
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

    print(f"listo: {len(songs)} canciones y {len(artists)} artistas mapeados esta semana")
    if len(songs) < len(scraped_songs):
        faltantes = len(scraped_songs) - len(songs)
        print(f"aviso: {faltantes} cancion(es) del top no estan en mapping.json todavia")


if __name__ == "__main__":
    main()
