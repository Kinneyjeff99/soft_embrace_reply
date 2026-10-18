#!/usr/bin/env python3
"""Rebuild dist/icons/* and the 18px header mask from brand/logomark-FA.png: Jet (#2A2B2A) background, Baby powder (#FCFBF5) logomark.
Also writes shots/icon-preview.png (contact sheet) and prints the base64 PNG used as the header logomark mask."""
import base64, io, pathlib
from PIL import Image, ImageDraw
ROOT = pathlib.Path(__file__).resolve().parent.parent
JET, BABY = (42, 43, 42), (252, 251, 245)
src = Image.open(ROOT / "brand/logomark-FA.png").convert("RGBA")
alpha = src.getchannel("A")
# the PNG is black art on transparent: use darkness as coverage (alpha is the full circle bbox)
lum = src.convert("L")
cov = Image.eval(lum, lambda v: 255 - v)
cov = Image.composite(cov, Image.new("L", src.size, 0), alpha)
cov = cov.crop(cov.getbbox())
def mark(size, frac, bg=JET, fg=BABY):
    im = Image.new("RGB", (size, size), bg)
    m = cov.resize((int(size * frac),) * 2, Image.LANCZOS)
    layer = Image.new("RGB", m.size, fg)
    im.paste(layer, ((size - m.width) // 2, (size - m.height) // 2), m)
    return im
out = ROOT / "dist/icons"
def q(im, n=16): return im.quantize(colors=n, dither=Image.Dither.NONE)
mark(180, .80).save(out / "apple-touch-icon.png", optimize=True)
q(mark(192, .86)).save(out / "icon-192.png", optimize=True)
q(mark(512, .86)).save(out / "icon-512.png", optimize=True)
q(mark(512, .62)).save(out / "icon-maskable-512.png", optimize=True)
q(mark(64, .90)).save(out / "favicon.png", optimize=True)
for w, h in ((1179, 2556), (1290, 2796)):
    im = Image.new("RGB", (w, h), JET); m = mark(int(w * .40), 1.0)
    im.paste(m, ((w - m.width) // 2, (h - m.height) // 2)); q(im).save(out / f"splash-{w}x{h}.png", optimize=True)
# header logomark: alpha mask, coloured by CSS (36px = 18px @2x)
a = cov.resize((36, 36), Image.LANCZOS); mk = Image.new("LA", (36, 36), (0, 0)); mk.putalpha(a)
b = io.BytesIO(); Image.merge("RGBA", (Image.new("L", (36, 36), 0),) * 3 + (a,)).save(b, "PNG", optimize=True)
print("header logomark mask (base64 PNG, paste into .logo in src/app.css):", base64.b64encode(b.getvalue()).decode()[:40], "...")
# contact sheet
sheet = Image.new("RGB", (1500, 880), (236, 234, 228)); d = ImageDraw.Draw(sheet); x = 30
for sz, lab in ((180, "180 home screen"), (120, "120"), (60, "60"), (29, "29 spotlight")):
    sheet.paste(mark(sz, .80).convert("RGB"), (x, 40)); d.text((x, 40 + sz + 8), lab, fill=JET); x += sz + 40
sheet.paste(mark(180, .62), (x, 40)); d.text((x, 228), "maskable 62%", fill=JET); x += 220
sheet.paste(mark(64, .9), (x, 40)); d.text((x, 112), "favicon 64", fill=JET)
sp = Image.open(out / "splash-1179x2556.png").convert("RGB").resize((236, 512)); sheet.paste(sp, (30, 300)); d.text((30, 830), "splash", fill=JET)
dark = Image.new("RGB", (400, 220), (27, 28, 27)); sheet.paste(dark, (300, 300))
sheet.paste(mark(180, .80), (320, 320)); sheet.paste(mark(60, .8), (540, 320)); d.text((300, 530), "on dark wallpaper", fill=BABY)
sheet.save(ROOT / "shots/icon-preview.png")
