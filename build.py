#!/usr/bin/env python3
"""Inline src/app.css, src/compose.js, src/app.js and src/data.json into dist/index.html and write dist/manifest.webmanifest."""
import json, re, pathlib, gzip, hashlib, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parent
SRC, DIST = ROOT / "src", ROOT / "dist"
DIST.mkdir(exist_ok=True)
# product photos + logo are separate files in dist/img (never inlined). Regenerated when missing or older than their sources.
IMG = DIST / "img"
srcs = list((ROOT / "assets/product-images").glob("*.webp")) + [ROOT / "brand/logo-primary-FA.png", ROOT / "tools/make_images.py"]
if not (IMG / "logo.webp").exists() or max(p.stat().st_mtime for p in srcs) > (IMG / "logo.webp").stat().st_mtime:
    subprocess.run([sys.executable, str(ROOT / "tools/make_images.py")], check=True)

def min_css(s):
    s = re.sub(r"/\*.*?\*/", "", s, flags=re.S)
    s = re.sub(r"\s*([{};,>])\s*", r"\1", s)          # tighten around punctuation
    s = s.replace(";}", "}")
    s = re.sub(r"\n+", "\n", s)
    return re.sub(r"[ \t]{2,}", " ", s).strip()

# --- offline JS minifier (no npm/esbuild/terser available in the build sandbox) -----------------
# Tokenises just enough to be safe: strings, template literals, regex literals and comments are
# recognised, so only real code whitespace/comments are touched. Identifiers are not renamed.
_IDENT = re.compile(r"[A-Za-z0-9_$]")
_TIGHT = set(",;{}()[]=:&|")            # no space needed on either side of these
_RX_PREV = set("(,=:[!&|?{};+-*%<>~^") # a '/' after one of these starts a regex literal
_RX_WORDS = ("return", "typeof", "case", "in", "of", "void", "delete", "throw", "else", "do")

def min_js(src):
    out, i, n = [], 0, len(src)
    def last():
        return out[-1][-1] if out and out[-1] else ""
    def prev_word():
        j = len(out) - 1
        w = ""
        while j >= 0 and re.fullmatch(r"[A-Za-z]+", out[j] or "x1"):
            w = out[j] + w
            j -= 1
        return w
    while i < n:
        c = src[i]
        if c in "'\"":                                     # string literal
            j = i + 1
            while src[j] != c:
                j += 2 if src[j] == "\\" else 1
            out.append(src[i:j + 1]); i = j + 1
        elif c == "`":                                    # template literal (kept verbatim)
            j = i + 1
            while src[j] != "`":
                j += 2 if src[j] == "\\" else 1
            out.append(src[i:j + 1]); i = j + 1
        elif c == "/" and src[i + 1:i + 2] == "/":        # line comment
            while i < n and src[i] != "\n":
                i += 1
        elif c == "/" and src[i + 1:i + 2] == "*":        # block comment
            i = src.index("*/", i + 2) + 2
            if last() and _IDENT.match(last()) and i < n and _IDENT.match(src[i]):
                out.append(" ")
        elif c == "/":                                    # regex literal or division
            tail = "".join(out)[-12:]
            lc = last()
            is_rx = (not lc) or lc in _RX_PREV or any(re.search(r"(^|[^A-Za-z0-9_$])" + w + r"$", tail) for w in _RX_WORDS)
            if is_rx:
                j, cls = i + 1, False
                while cls or src[j] != "/":
                    if src[j] == "\\": j += 1
                    elif src[j] == "[": cls = True
                    elif src[j] == "]": cls = False
                    j += 1
                j += 1
                while j < n and src[j].isalpha(): j += 1
                out.append(src[i:j]); i = j
            else:
                out.append("/"); i += 1
        elif c in " \t\r\n":                               # whitespace run
            j, nl = i, False
            while j < n and src[j] in " \t\r\n":
                nl = nl or src[j] == "\n"; j += 1
            nxt = src[j] if j < n else ""
            lc = last()
            if not lc or not nxt:
                pass
            elif nl:
                # keep a newline unless it is provably redundant
                if not (lc in "{([,;" or nxt == "}"):
                    out.append("\n")
            elif lc in _TIGHT or nxt in _TIGHT:
                pass
            elif _IDENT.match(lc) and _IDENT.match(nxt) or True:
                out.append(" ")
            i = j
        else:
            out.append(c); i += 1
    return "".join(out)

html = (SRC / "index.src.html").read_text(encoding="utf-8")
data = json.dumps(json.loads((SRC / "data.json").read_text(encoding="utf-8")), ensure_ascii=False, separators=(",", ":"))
data = data.replace("</", "<\\/").replace("<!--", "<\\!--")
js = min_js((SRC / "compose.js").read_text(encoding="utf-8") + "\n" + (SRC / "app.js").read_text(encoding="utf-8")).replace("</script", "<\\/script")
css = min_css((SRC / "app.css").read_text(encoding="utf-8"))
for k, v in (("/*__CSS__*/", css), ("__DATA__", data), ("/*__JS__*/", js)):
    assert k in html, k
    html = html.replace(k, v, 1) if k != "__DATA__" else html.replace(k, v, 1)
(DIST / "index.html").write_text(html, encoding="utf-8")

manifest = {
    "name": "Soft Embrace CS", "short_name": "Soft Embrace", "description": "Soạn nhanh tin nhắn tư vấn Instagram cho Soft Embrace",
    "start_url": "./?source=pwa", "scope": "./", "display": "standalone", "orientation": "portrait",
    "background_color": "#F2E7AB", "theme_color": "#FCFBF5", "lang": "vi",
    "icons": [
        {"src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any"},
        {"src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any"},
        {"src": "icons/apple-touch-icon.png", "sizes": "180x180", "type": "image/png"},
        {"src": "icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"},
    ],
}
(DIST / "manifest.webmanifest").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")

# --- service worker: cache-first app shell, cache name = content hash (bumps automatically) --------
PHOTOS = sorted("img/" + p.name for p in IMG.glob("*.webp"))   # 20 x 168, 20 x 320, logo: precached so the app works offline with photos
SHELL = ["./", "index.html", "manifest.webmanifest", "icons/favicon.png", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png"] + PHOTOS
h = hashlib.sha1()
for rel in ["index.html", "manifest.webmanifest"] + [p for p in SHELL if p.startswith("icons/") or p.startswith("img/")]:
    h.update((DIST / rel).read_bytes())
SW = """/* Soft Embrace CS service worker (generated by build.py). All URLs are relative to this file, so it works from any hosted path. */
const CACHE = 'se-v5-%s';
const SHELL = %s;
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(SHELL.map(u => c.add(new Request(u, { cache: 'reload' }))))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('se-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(caches.match(r, { ignoreSearch: true }).then(hit => hit || fetch(r).catch(() => r.mode === 'navigate' ? caches.match('index.html') : Response.error())));
});
""" % (h.hexdigest()[:10], json.dumps(SHELL))
(DIST / "sw.js").write_text(SW, encoding="utf-8")

raw = (DIST / "index.html").read_bytes()
img_kb = sum((DIST / p).stat().st_size for p in PHOTOS) / 1024
print(f"dist/img: {len(PHOTOS)} files, {img_kb:.0f} KB precached")
print(f"dist/index.html  raw {len(raw)/1024:.1f} KB  gzip {len(gzip.compress(raw, 9))/1024:.1f} KB  (css {len(css)/1024:.1f} KB, js {len(js)/1024:.1f} KB, data {len(data)/1024:.1f} KB)")
