#!/usr/bin/env python3
"""Importa SOLO recursos públicos permitidos de minatozakitty.neocities.org."""
import pathlib, urllib.request, urllib.error, sys, re
BASE = "https://minatozakitty.neocities.org/"
ROOT = pathlib.Path("site")
manifest = pathlib.Path("scripts/ciudad_public_paths.txt")
required = {"index.html", "scenes/universidad/index.html"}
missing = []
downloaded = []
for raw in manifest.read_text(encoding="utf-8").splitlines():
    path = raw.strip()
    if not path or path.startswith("#"): continue
    if path.startswith("/") or ".." in pathlib.PurePosixPath(path).parts or "\\" in path:
        raise SystemExit("Ruta insegura: " + path)
    if re.search(r"(^|/)(jardin|el-jardin|private|privado)(/|$)", path, re.I):
        raise SystemExit("Ruta privada prohibida: " + path)
    url = BASE + "/".join(urllib.parse.quote(p) for p in path.split("/"))
    request = urllib.request.Request(url, headers={"User-Agent": "LaCiudad-GitHub-Import/1.0"})
    try:
        with urllib.request.urlopen(request, timeout=25) as resp:
            blob = resp.read(2_500_001)
            ctype = resp.headers.get("Content-Type", "")
            if len(blob) > 2_500_000 or "text/html" in ctype and not path.endswith(".html"):
                raise ValueError("Respuesta inesperada: "+path)
    except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError, ValueError) as ex:
        missing.append((path, str(ex)))
        continue
    dest=ROOT/path
    dest.parent.mkdir(parents=True,exist_ok=True)
    dest.write_bytes(blob)
    downloaded.append(path)
print("Importados:",len(downloaded),"No encontrados:",len(missing))
for path,error in missing: print("omitido",path,error[:120])
for item in required:
    if item not in downloaded: raise SystemExit("Falta archivo obligatorio: "+item)
if len(downloaded) < 15: raise SystemExit("Demasiados archivos ausentes, abortando")
