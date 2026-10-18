#!/usr/bin/env python3
"""Round 5 (PICK = "B", Vanilla #F2E7AB + Jet logomark, 11.37:1): rebuild dist/icons/* from brand/logomark-FA.png on a LIGHT brand background and write shots/icon-preview.png (candidates at 180/60/29 px).
Candidates use brand colours only (Baby powder #FCFBF5, Vanilla #F2E7AB, Old Rose #CC8C87, its darker text variant #A84E47, Jet #2A2B2A, Dun #C5B9A8); no brown.
PICK is the chosen candidate key; the runner-up is named in docs/v2-report.md.  Usage: python3 tools/make_icons.py"""
import pathlib
from PIL import Image, ImageDraw, ImageFilter
ROOT = pathlib.Path(__file__).resolve().parent.parent
JET, BABY, VANILLA, ROSE, ROSED, DUN = (42, 43, 42), (252, 251, 245), (242, 231, 171), (204, 140, 135), (168, 78, 71), (197, 185, 168)
CAND = {  # key: (label, background, logomark colour)
    "A": ("A  Old Rose + Jet", ROSE, JET),
    "B": ("B  Vanilla + Jet", VANILLA, JET),
    "C": ("C  Baby powder + Rose dark", BABY, ROSED),
    "D": ("D  Old Rose + Baby powder", ROSE, BABY),
    "E": ("E  Vanilla + Rose dark", VANILLA, ROSED),
    "F": ("F  Dun + Jet", DUN, JET),
}
PICK = "B"
src = Image.open(ROOT / "brand/logomark-FA.png").convert("RGBA")
cov = Image.composite(src.convert("L").point(lambda v: 255 - v), Image.new("L", src.size, 0), src.getchannel("A"))
cov = cov.crop(cov.getbbox())
def mark(size, frac, bg, fg):
    """square icon; thin logomark lines are thickened a little at small sizes so they survive downscaling"""
    px = max(1, int(size * frac)); hi = px * 4
    m = cov.resize((hi, hi), Image.LANCZOS)
    k = 3 if size >= 50 else 5
    m = m.filter(ImageFilter.MaxFilter(k)).resize((px, px), Image.LANCZOS)
    im = Image.new("RGB", (size, size), bg)
    im.paste(Image.new("RGB", m.size, fg), ((size - px) // 2, (size - px) // 2), m)
    return im
def q(im, n=16): return im.quantize(colors=n, dither=Image.Dither.NONE)
def build(key):
    _, bg, fg = CAND[key]; out = ROOT / "dist/icons"
    ic = mark(180, .80, bg, fg)
    # baked 1 px inner edge rgba(42,43,42,.08) so the pale tile separates from a white wallpaper (iOS rounds the corners itself)
    ed = Image.new("RGB", ic.size, JET); m = Image.new("L", ic.size, 0); d = ImageDraw.Draw(m); d.rounded_rectangle((0, 0, 179, 179), radius=40, fill=20); d.rounded_rectangle((1, 1, 178, 178), radius=39, fill=0)
    ic.paste(ed, (0, 0), m); ic.save(out / "apple-touch-icon.png", optimize=True)
    q(mark(192, .86, bg, fg)).save(out / "icon-192.png", optimize=True)
    q(mark(512, .86, bg, fg)).save(out / "icon-512.png", optimize=True)
    q(mark(512, .62, bg, fg)).save(out / "icon-maskable-512.png", optimize=True)
    q(mark(64, .90, bg, fg)).save(out / "favicon.png", optimize=True)
    for w, h in ((1179, 2556), (1290, 2796)):
        im = Image.new("RGB", (w, h), bg); m = mark(int(w * .40), 1.0, bg, fg)
        im.paste(m, ((w - m.width) // 2, (h - m.height) // 2)); q(im).save(out / f"splash-{w}x{h}.png", optimize=True)
def sheet():
    cols = list(CAND); W = 1500; row = 250
    sh = Image.new("RGB", (W, 70 + row * len(cols)), (244, 242, 236)); d = ImageDraw.Draw(sh)
    d.text((24, 20), "Icon candidates: 180 (home screen), 60 (iPhone app icon in lists), 29 (Spotlight / settings), maskable 62%, on light and dark wallpaper", fill=JET)
    for i, k in enumerate(cols):
        lab, bg, fg = CAND[k]; y = 60 + i * row
        d.text((24, y), lab + ("   <- picked" if k == PICK else ""), fill=JET)
        x = 24
        for sz in (180, 120, 60, 29):
            ic = mark(sz, .80, bg, fg); r = Image.new("L", (sz, sz), 0); ImageDraw.Draw(r).rounded_rectangle((0, 0, sz - 1, sz - 1), radius=int(sz * .225), fill=255)
            sh.paste(ic, (x, y + 24), r); d.text((x, y + 24 + sz + 4), str(sz), fill=JET); x += sz + 28
        for wall, wx in (((250, 246, 238), 620), ((27, 28, 27), 860)):
            d.rectangle((wx, y + 20, wx + 220, y + 210), fill=wall)
            for sz, ox in ((60, 14), (29, 100)):
                ic = mark(sz, .80, bg, fg); r = Image.new("L", (sz, sz), 0); ImageDraw.Draw(r).rounded_rectangle((0, 0, sz - 1, sz - 1), radius=int(sz * .225), fill=255)
                sh.paste(ic, (wx + ox, y + 50), r)
        mk = mark(180, .62, bg, fg); mm = Image.new("L", (180, 180), 0); ImageDraw.Draw(mm).ellipse((0, 0, 179, 179), fill=255); sh.paste(mk, (1110, y + 24), mm)
        sp = mark(120, 1.0, bg, fg).resize((120, 120)); big = Image.new("RGB", (110, 200), bg); big.paste(mark(60, 1.0, bg, fg), (25, 70)); sh.paste(big, (1340, y + 14))
    sh.save(ROOT / "shots/icon-preview.png")
if __name__ == "__main__":
    build(PICK); sheet(); print("icons built from candidate", PICK, CAND[PICK][0])
