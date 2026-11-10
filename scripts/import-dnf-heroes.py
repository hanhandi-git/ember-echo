"""Losslessly pack the user's local DNF reference frames; never resample source pixels."""
import argparse
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--source', type=Path, default=ROOT.parent / 'dnf_art_refs/spriters_resource')
args = parser.parse_args()
SWORD = {
    'idle': [0, 1, 2, 1], 'walk': list(range(101, 110)),
    'attack1': [2, 3, 4, 5, 6, 7], 'attack2': [12, 13, 14, 15, 16, 17],
    'attack3': [32, 33, 34, 35, 36, 37, 38], 'cast': [75, 80, 81, 82, 83, 89],
    'hurt': [89, 90, 91], 'dead': [96, 97, 98, 99, 100],
}
FEMALE_SWORD = {
    'idle': [0, 1, 2, 3, 4, 3, 2, 1], 'walk': list(range(13, 23)),
    'attack1': [23, 24, 25, 26, 27], 'attack2': [50, 51, 52, 53, 54],
    'attack3': [58, 59, 60, 61, 62, 63], 'cast': [121, 122, 123, 124, 125, 126],
    'hurt': [136, 137, 138, 139], 'dead': [140, 141, 142, 143],
}
FEMALE_MAGE = {
    'idle': list(range(10, 18)), 'walk': list(range(2, 10)),
    'attack1': [70, 71, 72, 73, 74], 'attack2': [70, 71, 72, 73, 74],
    'attack3': [48, 49, 50, 51, 52], 'cast': [48, 49, 50, 51, 52],
    'hurt': [62, 63, 64], 'dead': [29, 30, 31, 32, 33],
}
MALE_MAGE = {
    'idle': list(range(0, 9)), 'walk': list(range(18, 28)),
    'attack1': [90, 91, 92, 93, 94], 'attack2': [90, 91, 92, 93, 94],
    'attack3': [150, 151, 152, 153, 154], 'cast': [150, 151, 152, 153, 154],
    'hurt': [172, 173, 174], 'dead': [176, 177, 178, 179],
}
PICKS = [
    ('dnf-blade-master', '剑神', 'Blade Master', 'swordsman', '03_时装_二觉/Male Slayer (Blade Master, Weapon)__206524/A Type', SWORD, (119, 202), '#e6cb9e'),
    ('dnf-berserker', '帝血弑天', 'Berserker', 'swordsman', '03_时装_二觉/Male Slayer (Berserker, Weapon)__206522/A Type', SWORD, (125, 215), '#ed6262'),
    ('dnf-sword-master', '剑皇', 'Sword Master', 'swordsman', '03_时装_二觉/Female Slayer (Sword Master, Weapon)__206533/A Type', FEMALE_SWORD, (167, 207), '#e8c6ad'),
    ('dnf-elementalist', '元素师', 'Elementalist', 'mage', '01_角色职业_一觉/Female Mage (Elementalist, Weapon)__198255/A Type', FEMALE_MAGE, (112, 158), '#77e3dd'),
    ('dnf-elemental-bomber', '元素爆破师', 'Elemental Bomber', 'mage', '01_角色职业_一觉/Male Mage (Elemental Bomber, Weapon)__198233/A Type', MALE_MAGE, (95, 173), '#c897f4'),
]
metadata = []
preview = Image.new('RGBA', (1200, 400), '#22212e')
draw = ImageDraw.Draw(preview)
for index, (id_, label, name, job, source, clips, anchor, accent) in enumerate(PICKS):
    frames = sorted(set(n for clip in clips.values() for n in clip))
    atlas = Image.new('RGBA', (1024, 1024))
    x = y = row_h = 0
    regions = {}
    records = []
    for n in frames:
        path = args.source / source / f'{n:03d}.png'
        im = Image.open(path).convert('RGBA')
        box = im.getbbox()
        sprite = im.crop(box)
        if x + sprite.width > atlas.width:
            x = 0
            y += row_h + 1
            row_h = 0
        if y + sprite.height > atlas.height:
            raise ValueError(f'{id_}: atlas too small')
        # paste, not alpha_composite: preserve even semitransparent RGBA exactly.
        atlas.paste(sprite, (x, y))
        assert atlas.crop((x, y, x + sprite.width, y + sprite.height)).tobytes() == sprite.tobytes()
        regions[str(n)] = [x, y, sprite.width, sprite.height, box[0] - anchor[0], box[1] - anchor[1]]
        records.append({'frame': n, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(), 'pixelSha256': hashlib.sha256(bytes(channel for pixel in sprite.getdata() for channel in (pixel if pixel[3] else (0, 0, 0, 0)))).hexdigest(), 'crop': list(box)})
        x += sprite.width + 1
        row_h = max(row_h, sprite.height)
    atlas = atlas.crop((0, 0, 1024, y + row_h))
    atlas.save(ROOT / f'assets/heroes/{id_}.png', optimize=True)
    asset_id = source.split('__')[1].split('/')[0]
    metadata.append({
        'id': id_, 'label': label, 'name': name, 'classId': job, 'theme': 'dnf', 'accent': accent,
        'role': 'DNF · ' + ('二觉剑士' if job == 'swordsman' else '元素法师'),
        'sprite': f'assets/heroes/{id_}.png', 'density': 2, 'fallback': 'ember-duelist' if job == 'swordsman' else 'moon-oracle',
        'clips': clips, 'frames': regions,
        'source': {'path': source, 'url': f'https://www.spriters-resource.com/pc_computer/dungeonfighteronline/asset/{asset_id}/',
                   'copyright': 'NEOPLE / NEXON', 'usage': 'Local noncommercial reference prototype; not MIT licensed.',
                   'anchor': list(anchor), 'files': records},
    })
    idle = clips['idle'][0]
    im = Image.open(args.source / source / f'{idle:03d}.png').convert('RGBA')
    im = im.crop(im.getbbox())
    im = im.resize((im.width * 2, im.height * 2), Image.Resampling.NEAREST)
    preview.alpha_composite(im, (index * 240 + (240 - im.width) // 2, 350 - im.height))
    draw.text((index * 240 + 10, 365), name, fill=accent)
    print(f'{id_}: {len(frames)} lossless frames, {atlas.width}x{atlas.height}')
(ROOT / 'assets/heroes/manifest.json').write_text(json.dumps(metadata, ensure_ascii=False, separators=(',', ':')) + '\n')
preview.save(ROOT / 'docs/heroes-preview.png')

# Readable, code-owned pixel source. Keep this separate from hand edits in hero-wardrobe.js.
code = ["// Generated losslessly by scripts/import-dnf-heroes.py. Edit palette hex values or frame pixel rows.\n",
        "// Two hex digits identify a palette entry; .. is transparent. Trailing empty cells may be omitted.\n",
        "export const HERO_PIXEL_DATA = {\n"]
for look in metadata:
    image = Image.open(ROOT / look['sprite']).convert('RGBA')
    colors = sorted({pixel for pixel in image.getdata() if pixel[3]})
    palette = {f'{i:02x}': '#' + ''.join(f'{c:02x}' for c in rgba) for i, rgba in enumerate(colors)}
    indices = {rgba: f'{i:02x}' for i, rgba in enumerate(colors)}
    code.append('  ' + json.dumps(look['id']) + ': {\n    palette: ' + json.dumps(palette, separators=(',', ':')) + ',\n    frames: {\n')
    for key, (x, y, w, h, dx, dy) in look['frames'].items():
        crop = image.crop((x, y, x + w, y + h))
        rows = [''.join(indices[crop.getpixel((c, r))] if crop.getpixel((c, r))[3] else '..' for c in range(w)).rstrip('.') for r in range(h)]
        code.append(f'      "{key}": {{ width: {w}, height: {h}, offset: [{dx},{dy}], layers: [{{ id: "body", rows: [\n')
        code.extend('        ' + json.dumps(row) + ',\n' for row in rows)
        code.append('      ] }] },\n')
    code.append('    },\n  },\n')
code.append('};\n')
(ROOT / 'src/hero-pixel-data.js').write_text(''.join(code))
print('Code pixel data:', (ROOT / 'src/hero-pixel-data.js').stat().st_size, 'bytes')
