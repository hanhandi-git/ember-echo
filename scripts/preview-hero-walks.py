#!/usr/bin/env python3
"""Preview the actual imported walk frames at native size, with fixed foot pivots."""
import json
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output/hero-previews/walk"
heroes = [look for look in json.loads((ROOT / "assets/heroes/manifest.json").read_text()) if look.get("walkSource")]
atlases = {look["id"]: Image.open(ROOT / look["sprite"]).convert("RGBA") for look in heroes}
rigs = json.loads((ROOT / "assets/heroes/walk/rigs.json").read_text())["heroes"]
OUT.mkdir(parents=True, exist_ok=True)
montage = []
individual = {look["id"]: [] for look in heroes}
for phase in range(12):
    sheet = Image.new("RGB", (576, 576), "#202532")
    for i, look in enumerate(heroes):
        cell = Image.new("RGB", (192, 192), "#202532")
        draw = ImageDraw.Draw(cell)
        draw.line((0, 180, 192, 180), fill="#4a5a6c")
        # Ground motion follows the planted foot's travel, showing foot sliding.
        ground_shift = phase / 12 * rigs[look["id"]]["stride"] * 4
        for marker in range(-1, 11):
            x = round((marker * 24 - ground_shift) % 192)
            draw.line((x, 184, x + 4, 184), fill="#748598")
        frame_id = look["clips"]["walk"][phase]
        x, y, w, h, ox, oy = look["frames"][str(frame_id)]
        crop = atlases[look["id"]].crop((x, y, x + w, y + h))
        cell.paste(crop, (96 + ox, 180 + oy), crop)
        draw.text((5, 3), look["id"], fill="#dfe8f6")
        individual[look["id"]].append(cell)
        sheet.paste(cell, (i % 3 * 192, i // 3 * 192))
    montage.append(sheet)
for look in heroes:
    images = individual[look["id"]]
    palette = images[0].quantize(colors=256)
    frames = [image.quantize(palette=palette, dither=Image.Dither.NONE) for image in images]
    frames[0].save(OUT / (look["id"] + "-walk.gif"), save_all=True, append_images=frames[1:],
                   duration=round(look["motion"]["walk"] / 12 * 1000), loop=0, disposal=2)
    contact = Image.new("RGB", (768, 576), "#202532")
    for i, image in enumerate(images):
        contact.paste(image, (i % 4 * 192, i // 4 * 192))
    contact.save(OUT / (look["id"] + "-contact.png"))
palette = montage[0].quantize(colors=256)
gif = [frame.quantize(palette=palette, dither=Image.Dither.NONE) for frame in montage]
gif[0].save(OUT / "all-heroes-walk.gif", save_all=True, append_images=gif[1:], duration=60, loop=0, disposal=2)
montage[0].save(OUT / "all-heroes-walk.png")
print(OUT / "all-heroes-walk.gif")
