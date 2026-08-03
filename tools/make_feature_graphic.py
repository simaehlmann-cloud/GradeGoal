#!/usr/bin/env python3
"""
Erzeugt die Feature-Grafik fuer den Play Store.

Google verlangt genau 1024 x 500 Pixel, JPEG oder 24-Bit-PNG ohne
Transparenz. Die Grafik erscheint quer ueber dem Eintrag und wird auf
manchen Flaechen beschnitten - deshalb bleibt alles Wichtige mittig und
nichts Wesentliches liegt an den Raendern.

Aufruf: python3 tools/make_feature_graphic.py
"""

from PIL import Image, ImageDraw, ImageFont
import os

W, H = 1024, 500
SS = 3

BLUE_LIGHT = (58, 102, 232)
BLUE_DARK = (16, 26, 46)
WHITE = (255, 255, 255)
YELLOW = (255, 222, 89)
MUTED = (185, 198, 222)
INK = (18, 32, 58)

FONTS_BOLD = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
]
FONTS_REG = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
]


def font(size, bold=True):
    for p in (FONTS_BOLD if bold else FONTS_REG):
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    raise SystemExit("Keine passende Schriftart gefunden.")


def build(lite):
    src = "assets-lite" if lite else "assets"
    out = f"store/feature-graphic-{'lite' if lite else 'pro'}.png"
    os.makedirs("store", exist_ok=True)

    # Verlauf von links nach rechts
    img = Image.new("RGB", (W, H))
    px = img.load()
    for x in range(W):
        k = x / (W - 1)
        c = tuple(round(BLUE_LIGHT[i] + (BLUE_DARK[i] - BLUE_LIGHT[i]) * k) for i in range(3))
        for y in range(H):
            px[x, y] = c

    d = ImageDraw.Draw(img)

    # App-Symbol links, mit abgerundeten Ecken
    tile = 240
    icon = Image.open(f"{src}/icon-only.png").convert("RGBA").resize((tile, tile), Image.LANCZOS)
    mask = Image.new("L", (tile * SS, tile * SS), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, tile * SS - 1, tile * SS - 1],
                                           radius=int(tile * SS * 0.22), fill=255)
    icon.putalpha(mask.resize((tile, tile), Image.LANCZOS))
    img.paste(icon, (78, (H - tile) // 2), icon)

    x0 = 78 + tile + 62
    f_title = font(76)
    d.text((x0, 168), "GradeGoal", font=f_title, fill=WHITE)

    if lite:
        # Streifen direkt hinter dem Namen. Die Position wird aus dem
        # tatsaechlichen Titelende berechnet, nicht geschaetzt - sonst
        # ueberlappt es, sobald sich Schrift oder Groesse aendern.
        _, _, title_right, _ = d.textbbox((x0, 168), "GradeGoal", font=f_title)
        f_tag = font(30)
        l, t, r, b = d.textbbox((0, 0), "LITE", font=f_tag)
        tw, th = r - l, b - t
        bx, by = title_right + 22, 186
        d.rounded_rectangle([bx, by, bx + tw + 34, by + th + 22], radius=(th + 22) / 2, fill=YELLOW)
        d.text((bx + 17 - l, by + 11 - t), "LITE", font=f_tag, fill=INK)

    d.text((x0 + 3, 258), "Schulnoten & Grades", font=font(34, bold=False), fill=MUTED)
    d.text((x0 + 3, 312), "Noten eintragen. Ziele erreichen.", font=font(30), fill=YELLOW)

    img.save(out)
    print(f"{out}  {img.size[0]}x{img.size[1]}  {img.mode}")


if __name__ == "__main__":
    build(lite=False)
    build(lite=True)
