#!/usr/bin/env python3
"""Extract the nine supplied action sheets. Requires Pillow; no network assets.

Rows are irregularly spaced. Connected components retain overhanging blades and
detached VFX instead of cutting the source into equal-width cells. Explicit splits
are used where two drawings touch in the supplied image.
"""
import base64
import hashlib
import json
from collections import deque
from collections import Counter
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets/heroes"
PREVIEW = ROOT / "output/hero-previews"
MOTION = json.loads((OUT / "motion.json").read_text())
WALKS = json.loads((OUT / "walk/manifest.json").read_text())

SHEETS = [
    ("yujinjianshi_yueguiyouxia_yuexiangjisi.png", [0, 170, 340, 518, 695, 855, 1024], [
        [72, 222, 363, 513, 672, 837, 1028, 1190, 1410],
        [104, 268, 417, 608, 764, 977, 1213, 1443],
        [65, 202, 354, 508, 642, 792, 982, 1170, 1380],
        [83, 220, 364, 535, 692, 853, 1028, 1172, 1368],
        [93, 252, 393, 553, 740, 879, 1040, 1194, 1362],
        [93, 247, 421, 590, 797, 1024, 1234, 1440],
    ], [
        ("laurel-ranger", "月桂游侠", "Laurel Ranger", "swordsman", "月桂长弓", "Laurel Bow", "#c7dc68", "bow", 0.94, 72),
        ("moon-priestess", "月相祭司", "Moon Priestess", "mage", "月相法杖", "Lunar Staff", "#bca3ff", "staff", 1.02, 62),
    ]),
    ("lumingfei_shangshanhuiliyi_chuyinweilai.png", [0, 169, 330, 482, 635, 820, 1024], [
        [75, 207, 337, 505, 750, 913, 1093, 1258, 1458],
        [67, 207, 339, 474, 616, 764, 942, 1074, 1244, 1429],
        [72, 198, 333, 480, 624, 762, 914, 1093, 1250, 1455],
        [72, 201, 345, 485, 617, 762, 937, 1103, 1229, 1427],
        [75, 193, 320, 488, 627, 790, 985, 1105, 1265, 1453],
        [71, 204, 327, 466, 621, 781, 928, 1092, 1260, 1440],
    ], [
        ("lu-mingfei", "路明非", "Lu Mingfei", "swordsman", "黑曜长剑", "Obsidian Sword", "#7ea2ff", "sword", 1.03, 68),
        ("erii", "上杉绘梨衣", "Uesugi Erii", "swordsman", "绯樱太刀", "Sakura Blade", "#ff7196", "katana", 1.08, 66),
        ("hatsune-miku", "初音未来", "Hatsune Miku", "mage", "未来音刃", "Resonance Blade", "#53dfee", "sword", 0.98, 72),
    ]),
    ("tianzhaoming_yueduming_xuzuozhinan.png", [0, 151, 304, 444, 594, 739, 916, 1089], [
        [73, 207, 352, 538, 779, 946, 1102, 1256],
        [123, 293, 530, 757, 969, 1198],
        [130, 281, 479, 671, 861, 1058, 1343],
        [80, 215, 366, 530, 742, 895, 1018, 1190, 1371],
        [80, 213, 317, 432, 552, 674, 819, 959, 1114, 1300],
        [78, 210, 350, 518, 721, 913, 1087, 1230, 1395],
        [75, 231, 365, 534, 736, 940, 1234],
    ], [
        ("amaterasu", "天照命", "Amaterasu", "swordsman", "日轮神剑", "Solar Blade", "#ffbb53", "sword", 1.15, 60),
        ("tsukuyomi", "月读命", "Tsukuyomi", "mage", "月读灵刃", "Moon Spirit Blade", "#a798ed", "katana", 1.04, 64),
        ("susanoo", "须佐之男", "Susanoo", "swordsman", "天丛云剑", "Cloudcutter", "#88b4ff", "sword", 1.18, 58),
    ]),
]


def components(image, top, bottom):
    w = image.width
    pixels = image.load()
    remaining = {y * w + x for y in range(top, bottom) for x in range(w) if max(pixels[x, y]) > 24}
    parts = []
    while remaining:
        start = min(remaining)
        remaining.remove(start)
        stack, part = [start], []
        while stack:
            at = stack.pop()
            part.append(at)
            x = at % w
            for near in (at - w, at + w, at - 1 if x else -1, at + 1 if x < w - 1 else -1):
                if near in remaining:
                    remaining.remove(near)
                    stack.append(near)
        if len(part) >= 3:
            parts.append(part)
    return parts


def extract_row(image, top, bottom, centers, splits=()):
    w = image.width
    owned = [[] for _ in centers]
    for part in components(image, top, bottom):
        # A few crescents touch the next drawing. Split only those components.
        groups = [part]
        for cut in splits:
            groups = [piece for group in groups for piece in
                      ([at for at in group if at % w < cut], [at for at in group if at % w >= cut]) if piece]
        for group in groups:
            cx = (min(at % w for at in group) + max(at % w for at in group)) / 2
            index = min(range(len(centers)), key=lambda i: abs(centers[i] - cx))
            owned[index].extend(group)
    result = []
    for center, points in zip(centers, owned):
        assert points, (top, center)
        xs, ys = [at % w for at in points], [at // w for at in points]
        box = (min(xs), min(ys), max(xs) + 1, max(ys) + 1)
        frame = Image.new("RGBA", (box[2] - box[0], box[3] - box[1]))
        target, source = frame.load(), image.load()
        for at in points:
            x, y = at % w, at // w
            target[x - box[0], y - box[1]] = (*source[x, y], 255)
        # The torso center is independent of the VFX extent; keep the feet grounded.
        result.append((frame, box, [center - box[0], box[3] - box[1]]))
    return result


def fill_internal_holes(image, color=(7, 7, 7, 255)):
    """Fill transparent pockets enclosed by a character silhouette; preserve outside alpha."""
    width, height = image.size
    alpha = image.getchannel("A")
    pixels = alpha.load()
    outside = set()
    queue = deque()
    for x in range(width):
        queue.extend([(x, 0), (x, height - 1)])
    for y in range(height):
        queue.extend([(0, y), (width - 1, y)])
    while queue:
        x, y = queue.popleft()
        if (x, y) in outside or x < 0 or y < 0 or x >= width or y >= height or pixels[x, y] != 0:
            continue
        outside.add((x, y))
        queue.extend(((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)))
    target = image.load()
    filled = 0
    for y in range(height):
        for x in range(width):
            if pixels[x, y] == 0 and (x, y) not in outside:
                target[x, y] = color
                filled += 1
    return filled


def fill_local_gaps(image, color=(7, 7, 7, 255)):
    """Close tiny anti-aliased gaps touching a solid costume cluster, without filling open space."""
    width, height = image.size
    pixels = image.load()
    filled = 0
    for _ in range(2):
        changes = []
        for y in range(1, height - 1):
            for x in range(1, width - 1):
                if pixels[x, y][3]:
                    continue
                neighbors = sum(1 for yy in range(y - 1, y + 2) for xx in range(x - 1, x + 2) if pixels[xx, yy][3])
                if neighbors >= 5:
                    changes.append((x, y))
        for x, y in changes:
            pixels[x, y] = color
        filled += len(changes)
    return filled


def append_dnf(manifest, code):
    """Keep the original DNF weapon-composited atlases and their lossless colors."""
    heroes = json.loads((OUT / "dnf-manifest.json").read_text())
    names = ["剑神佩剑", "血气巨剑", "剑皇佩剑", "元素法杖", "元素魔杖"]
    names_en = ["Blade Master's Sword", "Blood Greatsword", "Sword Master's Blade", "Elemental Staff", "Elemental Wand"]
    for i, look in enumerate(heroes):
        atlas = Image.open(ROOT / look["sprite"]).convert("RGBA")
        frames = {id_: atlas.crop((x, y, x + w, y + h)) for id_, (x, y, w, h, *_offset) in look["frames"].items()}
        counts = Counter(color for frame in frames.values() for color in frame.getdata() if color[3])
        colors = sorted(counts)
        color_ids = {color: n for n, color in enumerate(colors)}
        encoded = {}
        for id_, frame in frames.items():
            palette = sorted({color for color in frame.getdata() if color[3]})
            assert len(palette) < 256
            indices = {color: n for n, color in enumerate(palette)}
            data = bytes(indices[color] if color[3] else 255 for color in frame.getdata())
            encoded[id_] = dict(width=frame.width, height=frame.height, offset=look["frames"][id_][4:],
                                palette=[color_ids[color] for color in palette], pixels=base64.b64encode(data).decode())
            record = next(item for item in look["source"]["files"] if str(item["frame"]) == id_)
            assert hashlib.sha256(frame.tobytes()).hexdigest() == record["pixelSha256"], (look["id"], id_)
        clips = look["clips"]
        clips.update(enhanced=clips["attack3"], cleave=clips["attack3"], rush=clips["attack1"],
                     rise=clips["attack2"], guard=clips["cast"][:3], recover=[clips["attack1"][-1], clips["idle"][1], clips["idle"][0]],
                     awakening=clips["attack1"] + clips["attack2"] + clips["attack3"])
        if look["id"] in {"dnf-blade-master", "dnf-berserker"}:
            # Their original frame 0 carries the sword over the shoulder. Frame 2
            # keeps each costume and weapon while placing the grip beside the hand,
            # matching Sword Master's readable starting stance.
            clips["idle"] = [2, 2, 2, 2]
            clips["recover"] = [2, 2, 2]
        look["contacts"] = {kind: min(len(ids) - 1, max(1, len(ids) // 3)) for kind, ids in clips.items()}
        look["contacts"]["awakening"] = look["contacts"]["attack1"]
        look["motion"] = dict(idle=1.2, walk=.66, recovery=.12, weights={}, strikes={"awakening": [
            look["contacts"]["attack1"], len(clips["attack1"]) + look["contacts"]["attack2"],
            len(clips["attack1"]) + len(clips["attack2"]) + look["contacts"]["attack3"],
        ]})
        look["weapon"] = dict(id="hero:" + look["id"], name=names[i], nameEn=names_en[i], nameJa=names[i],
                              rigWeapon="sword" if i < 3 else "staff", dmgMul=1.15 if i == 1 else 1,
                              speed=58 if i == 1 else 64, dashCdMul=1,
                              attack=dict(kind="arc", range=72 if i == 1 else 68, radius=14, pierce=False))
        look.pop("fallback", None)
        look["role"] = "DNF · 自带武器 · " + names[i]
        code[look["id"]] = dict(colors=["#" + bytes(color).hex() for color in colors],
                                editable=[color_ids[color] for color, _ in counts.most_common(64)], frames=encoded)
        manifest.append(look)
        print(look["id"], len(frames), "original DNF frames")


def main():
    PREVIEW.mkdir(parents=True, exist_ok=True)
    manifest, code = [], {}
    for filename, boundaries, centers, heroes in SHEETS:
        image = Image.open(OUT / filename).convert("RGB")
        rows = []
        for i, (top, bottom, cx) in enumerate(zip(boundaries, boundaries[1:], centers)):
            splits = ((1208,) if filename.startswith("lumingfei") and i == 0 else
                      (1022, 1187) if filename.startswith("lumingfei") and i == 4 else
                      (700,) if filename.startswith("lumingfei") and i == 5 else
                      (438,) if filename.startswith("tianzhao") and i == 6 else ())
            row_image = image
            if filename.startswith("yujinjianshi") and i in (2, 3):
                # The last leaping archer extends below the rest of its row.
                row_image = image.copy()
                if i == 2:
                    ImageDraw.Draw(row_image).rectangle((0, bottom, 1250, 539), fill="black")
                    bottom = 540
                else:
                    ImageDraw.Draw(row_image).rectangle((1251, top, image.width, 539), fill="black")
            rows.append(extract_row(row_image, top, bottom, cx, splits))
        for index, (id_, label, name, job, weapon, weapon_en, accent, rig, power, speed) in enumerate(heroes):
            # Amaterasu has three rows; all other heroes have two.
            start = index * 2 + (1 if filename.startswith("tianzhao") and index else 0)
            count = 3 if filename.startswith("tianzhao") and index == 0 else 2
            selected = [entry for row in rows[start:start + count] for entry in row]
            # Source sheets are RGB with a near-black matte. Quantize each extracted
            # frame before packing so browser memory stays bounded while retaining
            # the supplied gradients and VFX colors.
            normalized = []
            for frame, box, anchor in selected:
                reduced = frame.convert("RGB").quantize(colors=255, method=Image.Quantize.MEDIANCUT).convert("RGBA")
                reduced.putalpha(frame.getchannel("A"))
                normalized.append((reduced, box, anchor))
            selected = normalized
            original_count = len(selected)
            editable_counts = Counter(color for frame, _, _ in selected for color in frame.getdata() if color[3])
            walk = WALKS[id_]
            walk_atlas = Image.open(ROOT / walk["path"]).convert("RGBA")
            for record in walk["frames"]:
                wx, wy, ww, wh = record["crop"]
                full = walk_atlas.crop((wx, wy, wx + ww, wy + wh))
                bbox = full.getbbox()
                assert bbox, (id_, "empty generated walk frame")
                crop = full.crop(bbox)
                reduced = crop.convert("RGB").quantize(colors=255, method=Image.Quantize.MEDIANCUT).convert("RGBA")
                reduced.putalpha(crop.getchannel("A"))
                selected.append((reduced, [wx + bbox[0], wy + bbox[1], wx + bbox[2], wy + bbox[3]],
                                 [walk["origin"][0] - bbox[0], walk["origin"][1] - bbox[1]]))
            choreography = MOTION[id_]
            clips, contacts = choreography["clips"], choreography["contacts"]
            clips["walk"] = list(range(original_count, len(selected)))
            choreography["motion"]["walk"] = walk["seconds"]
            choreography["motion"]["walkDistance"] = walk["seconds"] * speed
            choreography["motion"]["strikes"] = {"awakening": [contacts["attack1"],
                len(clips["attack1"]) + contacts["attack2"] - 1,
                len(clips["attack1"]) + len(clips["attack2"]) + contacts["attack3"] - 2]}
            atlas = Image.new("RGBA", (1024, 2048))
            x = y = shelf = 0
            frames, records, encoded = {}, [], {}
            all_colors = Counter(color for frame, _, _ in selected for color in frame.getdata() if color[3])
            # Share color values across frames; each frame uses compact byte indices.
            colors = sorted(all_colors)
            assert len(colors) < 65535
            indices = {color: i for i, color in enumerate(colors)}
            for frame_id, (frame, box, anchor) in enumerate(selected):
                w, h = frame.size
                if x + w > atlas.width:
                    x, y, shelf = 0, y + shelf + 1, 0
                assert y + h <= atlas.height
                atlas.paste(frame, (x, y))
                offset = [-anchor[0], -anchor[1]]
                frames[str(frame_id)] = [x, y, w, h, *offset]
                frame_colors = sorted({color for color in frame.getdata() if color[3]})
                frame_indices = {color: i for i, color in enumerate(frame_colors)}
                data = bytearray()
                for color in frame.getdata():
                    data.append(frame_indices[color] if color[3] else 255)
                encoded[str(frame_id)] = dict(width=w, height=h, offset=offset,
                                             palette=[indices[color] for color in frame_colors], pixels=base64.b64encode(data).decode())
                records.append(dict(frame=frame_id, crop=list(box), anchor=anchor,
                                    path=walk["path"] if frame_id >= original_count else filename,
                                    pixelSha256=hashlib.sha256(frame.tobytes()).hexdigest()))
                x += w + 1
                shelf = max(shelf, h)
            atlas = atlas.crop((0, 0, 1024, y + shelf))
            atlas.save(OUT / (id_ + ".png"), optimize=True)
            code[id_] = dict(colors=["#" + bytes(color).hex() for color in colors],
                             editable=[indices[color] for color, _ in editable_counts.most_common(64)], frames=encoded)
            manifest.append(dict(id=id_, label=label, name=name, classId=job, theme="heroes", accent=accent,
                                 role="自带武器 · " + weapon, sprite="assets/heroes/" + id_ + ".png", density=2.7,
                                 weapon=dict(id="hero:" + id_, name=weapon, nameEn=weapon_en, nameJa=weapon,
                                             rigWeapon=rig, dmgMul=power, speed=speed, dashCdMul=1,
                                             attack=dict(kind="projectile" if rig == "bow" else "arc", range=220 if rig == "bow" else 68,
                                                         radius=5 if rig == "bow" else 14, pierce=False)),
                                 clips=clips, frames=frames, contacts=contacts, motion=choreography["motion"],
                                 walkSource=dict(path=walk["path"], frames=clips["walk"], baseFrame=walk["sourceFrame"],
                                                 canvas=walk["canvas"], origin=walk["origin"], seconds=walk["seconds"],
                                                 method=walk["method"]),
                                 source=dict(path=filename, sha256=hashlib.sha256((OUT / filename).read_bytes()).hexdigest(),
                                             usage="Original action frames from user-supplied sheets; additional native pixel walk cycles from walk/rigs.json.", files=records)))
            preview = Image.new("RGB", (800, ((len(selected) + 5) // 6) * 170), "#202532")
            draw = ImageDraw.Draw(preview)
            for n, (frame, _, _) in enumerate(selected):
                small = frame.copy()
                small.thumbnail((128, 145), Image.Resampling.NEAREST)
                px, py = n % 6 * 133, n // 6 * 170
                preview.paste(small, (px + (133 - small.width) // 2, py + 150 - small.height), small)
                draw.text((px + 4, py + 153), str(n), fill="white")
            preview.save(PREVIEW / (id_ + ".png"))
            print(id_, len(selected), "frames;", len(colors), "palette colors")
    append_dnf(manifest, code)
    # Frame provenance (source sheets, hashes) is authoring metadata, not runtime
    # data — keep it beside the manifest so the runtime bundle stays slim.
    provenance = {look["id"]: look.pop("source") for look in manifest if look.get("source")}
    (OUT / "manifest-source.json").write_text(json.dumps(provenance, ensure_ascii=False, indent=2) + "\n")
    (OUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    data_dir = ROOT / "src/hero-data"
    data_dir.mkdir(exist_ok=True)
    for hero_id, payload in code.items():
        (data_dir / (hero_id + ".js")).write_text(
            "export default " + json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + ";\n")
    (data_dir / "index.js").write_text(
        "// Generated by scripts/import-hero-sheets.py; per-hero pixel data, loaded on demand.\n"
        "export const HERO_PIXEL_LOADERS = {\n"
        + "".join(f'  "{hero_id}": () => import("./{hero_id}.js"),\n' for hero_id in code)
        + "};\n")


if __name__ == "__main__":
    main()
