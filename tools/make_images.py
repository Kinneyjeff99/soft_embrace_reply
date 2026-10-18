#!/usr/bin/env python3
"""Build dist/img/* from assets/product-images/*.webp and brand/logo-primary-FA.png, and write img/tint/released/collection into src/data.json.

  dist/img/<slug>-168.webp   square thumbnail for lists (56pt avatar @3x)
  dist/img/<slug>-320.webp   larger square for sheet headers, set illustrations, order lines
  dist/img/logo.webp         transparent wordmark (black art, inverted in dark mode by CSS)

Thumbnails are never inlined into index.html: they are separate files, lazy loaded, and the 168 set is precached by sw.js.
Idempotent: python3 tools/make_images.py"""
import json, pathlib, sys
from PIL import Image
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "dist/img"; OUT.mkdir(parents=True, exist_ok=True)
SRC = ROOT / "assets/product-images"

# photo slug -> product id (all 20), crop focus y (0 top .. 1 bottom) of the square window, so the garment shows and faces are mostly out
MAP = {
 "soft-halter-white": ("soft-halter-top-white", .50), "soft-halter-blue": ("soft-halter-top-blue", .50),
 "noir-dotty-top": ("noir-dotty-top", .50), "ivory-dot-blouse": ("ivory-dot-blouse", .52),
 "ivory-dot-midi-skirt": ("ivory-dot-midi-skirt", .50), "noir-midi-skirt": ("noir-midi-skirt", .50),
 "shimmer-top": ("shimmer-top", .62), "lace-top": ("lace-top", .50),
 "lace-skirt-cream": ("lace-skirt-cream", .50), "lace-skirt-black": ("lace-skirt-black", .50),
 "still-cami-white": ("still-cami-top-white", .62), "still-cami-taupe": ("still-cami-top-taupe", .50),
 "flowy-skirt-taupe": ("flowy-skirt-taupe", .55), "flowy-skirt-cream": ("flowy-skirt-cream", .55),
 "lace-trim-blouse-cream": ("lace-trim-blouse-cream", .50), "lace-trim-blouse-blue": ("lace-trim-blouse-blue", .50),
 "embroidery-pants": ("embroidery-pants", .50), "fleur-slip-blue": ("fleur-slip-dress-blue", .46),
 "fleur-slip-yellow": ("fleur-slip-dress-yellow", .46), "butter-top": ("butter-top", .45),
}
# release order (sheet row order, one number per product, higher = newer) and collection (collection is INFERRED from docs/ig-reference posts)
GROUPS = [  # (name, collection)
 ("Soft Halter Top", "Fall 25"), ("Noir Dotty Top", "Fall 25"), ("Ivory Dot Blouse", "Fall 25"), ("Ivory Dot Midi Skirt", "Fall 25"), ("Noir Midi Skirt", "Fall 25"),
 ("Shimmer Top", "Spring 26"), ("Lace Top", "Spring 26"), ("Lace Skirt", "Spring 26"),
 ("Still Cami Top", "Summer 26"), ("Flowy Skirt", "Summer 26"), ("Lace Trim Blouse", "Summer 26"), ("Embroidery Pants", "Summer 26"), ("Fleur Slip Dress", "Summer 26"), ("Butter Top", "Summer 26"),
]

def crop_square(im, fy):
    w, h = im.size; s = min(w, h)
    top = int(round((h - s) * fy)) if h > s else 0
    left = (w - s) // 2
    return im.crop((left, top, left + s, top + s))

def run():
    data = json.loads((ROOT / "src/data.json").read_text(encoding="utf-8"))
    byid = {p["id"]: p for p in data["products"]}
    assert sorted(v[0] for v in MAP.values()) == sorted(byid), "image map must cover all products exactly once"
    sizes = {}
    for slug, (pid, fy) in MAP.items():
        im = Image.open(SRC / f"{slug}.webp").convert("RGB")
        sq = crop_square(im, fy)
        for px, q in ((168, 66), (320, 62)):
            t = sq.resize((px, px), Image.LANCZOS)
            f = OUT / f"{slug}-{px}.webp"; t.save(f, "WEBP", quality=q, method=6); sizes[f.name] = f.stat().st_size
        small = sq.resize((1, 1), Image.BOX).getpixel((0, 0))
        p = byid[pid]; p["img"] = slug; p["tint"] = "#%02X%02X%02X" % small
    gi = {g[0]: (i + 1, g[1]) for i, g in enumerate(GROUPS)}
    for p in data["products"]:
        p["released"], p["collection"] = gi[p["name"]]
    (ROOT / "src/data.json").write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    # logo wordmark: crop the lettering under the monogram, darkness = coverage, black art on transparent
    src = Image.open(ROOT / "brand/logo-primary-FA.png").convert("RGBA")
    lum = src.convert("L"); cov = Image.composite(lum.point(lambda v: 255 - v), Image.new("L", src.size, 0), src.getchannel("A"))
    cov = cov.crop((0, 1950, cov.width, cov.height)); cov = cov.crop(cov.point(lambda v: 255 if v > 40 else 0).getbbox())
    H = 84; W = round(cov.width * H / cov.height)
    a = cov.resize((W, H), Image.LANCZOS)
    logo = Image.new("RGBA", (W, H), (0, 0, 0, 0)); logo.putalpha(a)
    logo.save(OUT / "logo.webp", "WEBP", lossless=False, quality=80, alpha_quality=80, method=6)
    sizes["logo.webp"] = (OUT / "logo.webp").stat().st_size
    print("logo", W, "x", H)
    tot168 = sum(v for k, v in sizes.items() if k.endswith("-168.webp")); tot320 = sum(v for k, v in sizes.items() if k.endswith("-320.webp"))
    print(f"168: {tot168/1024:.0f} KB ({tot168/20/1024:.1f} KB avg, max {max(v for k,v in sizes.items() if k.endswith('-168.webp'))/1024:.1f})  320: {tot320/1024:.0f} KB ({tot320/20/1024:.1f} avg)  logo {sizes['logo.webp']/1024:.1f} KB")

if __name__ == "__main__":
    run()
