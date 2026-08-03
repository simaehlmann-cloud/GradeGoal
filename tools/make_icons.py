#!/usr/bin/env python3
"""
GradeGoal – Icon- und Splashscreen-Generator

Erzeugt alle Bilddateien aus einer Quelle, damit Lite und Pro garantiert
dieselbe Bildsprache haben und die Groessen stimmen.

Warum nicht einfach ein icon.png fuer alles?

1) iOS verbietet Transparenz und eigene abgerundete Ecken im App-Icon.
   Apple maskiert selbst; ein Icon mit Alphakanal wird beim Hochladen
   abgelehnt. Deshalb ist icon-only.png randlos und deckend.

2) Android nutzt seit API 26 adaptive Icons: Vorder- und Hintergrund sind
   getrennte Ebenen, und der Hersteller entscheidet ueber die Maske
   (Kreis, Squircle, Tropfen ...). Von der Flaeche bleiben nur die
   inneren rund 66 % sicher sichtbar. Wer ein fertiges Quadrat abgibt,
   bekommt beschnittene Ecken. Deshalb liegt die Zeichnung auf
   icon-foreground.png bewusst klein und mittig.

Aufruf:  python3 tools/make_icons.py
"""

from PIL import Image, ImageDraw, ImageFont
import os

OUT_PRO = "assets"
OUT_LITE = "assets-lite"

SS = 4          # Supersampling gegen Treppenstufen
ICON = 1024     # Pflichtgroesse fuer App-Store und Play Store
SPLASH = 2732   # Pflichtgroesse fuer Capacitor-Splashscreens

BLUE_LIGHT = (58, 102, 232)
BLUE_DARK = (22, 35, 59)
WHITE = (255, 255, 255)
YELLOW = (255, 222, 89)
DOT_CORE = (18, 32, 58)
BG_LIGHT = (238, 242, 247)
BG_DARK = (16, 24, 38)

FONT_CANDIDATES = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
]


def load_font(size):
    for p in FONT_CANDIDATES:
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    raise SystemExit("Keine fette Schriftart gefunden – bitte FONT_CANDIDATES ergänzen.")


def gradient(size, c1, c2):
    """Diagonaler Verlauf oben links -> unten rechts."""
    img = Image.new("RGB", (size, size))
    px = img.load()
    for y in range(size):
        for x in range(size):
            k = (x + y) / (2 * (size - 1))
            px[x, y] = (
                round(c1[0] + (c2[0] - c1[0]) * k),
                round(c1[1] + (c2[1] - c1[1]) * k),
                round(c1[2] + (c2[2] - c1[2]) * k),
            )
    return img


def centered_text(d, cx, cy, text, font, fill):
    l, t, r, b = d.textbbox((0, 0), text, font=font)
    d.text((cx - (r - l) / 2 - l, cy - (b - t) / 2 - t), text, font=font, fill=fill)


def star(d, cx, cy, r_out, fill):
    import math
    pts = []
    for i in range(10):
        r = r_out if i % 2 == 0 else r_out * 0.42
        a = -math.pi / 2 + i * math.pi / 5
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    d.polygon(pts, fill=fill)


def draw_artwork(size, lite, scale=1.0):
    """Zeichnung auf transparentem Grund, mittig, in der Breite `scale`."""
    S = size * SS
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    span = S * scale
    off = (S - span) / 2
    u = span / 64.0                      # Einheit aus dem SVG-Raster (viewBox 64)
    X = lambda v: off + v * u
    Y = lambda v: off + v * u

    # Der Lite-Streifen braucht Platz: Zeichnung etwas nach oben ruecken
    shift = -5.0 * u if lite else 0.0

    line = [(X(15), Y(46) + shift), (X(27), Y(36) + shift),
            (X(37), Y(42) + shift), (X(49), Y(26) + shift)]

    d.line(line, fill=WHITE, width=int(4.4 * u), joint="curve")
    for pt in line:                       # runde Enden von Hand
        r = 2.2 * u
        d.ellipse([pt[0] - r, pt[1] - r, pt[0] + r, pt[1] + r], fill=WHITE)

    # Messpunkte auf den ersten drei Knicken
    for pt in line[:3]:
        ro, ri = 2.9 * u, 1.35 * u
        d.ellipse([pt[0] - ro, pt[1] - ro, pt[0] + ro, pt[1] + ro], fill=WHITE)
        d.ellipse([pt[0] - ri, pt[1] - ri, pt[0] + ri, pt[1] + ri], fill=DOT_CORE)

    f_num = load_font(int(15 * u))
    centered_text(d, X(7.5), Y(48.5) + shift, "5", f_num, WHITE)
    centered_text(d, X(43), Y(17) + shift, "1", f_num, WHITE)
    star(d, X(54.5), Y(16) + shift, 8.0 * u, YELLOW)

    if lite:
        # Streifen mittig unten – innerhalb der sicheren Zone, damit ihn
        # keine Herstellermaske abschneidet.
        f_lite = load_font(int(13.0 * u))
        text = "LITE"
        l, t, r, b = d.textbbox((0, 0), text, font=f_lite)
        tw, th = r - l, b - t
        pad_x, pad_y = 4.2 * u, 2.3 * u
        cx, cy = S / 2, Y(53.0)
        box = [cx - tw / 2 - pad_x, cy - th / 2 - pad_y,
               cx + tw / 2 + pad_x, cy + th / 2 + pad_y]
        d.rounded_rectangle(box, radius=(box[3] - box[1]) / 2, fill=YELLOW)
        centered_text(d, cx, cy, text, f_lite, DOT_CORE)

    return img.resize((size, size), Image.LANCZOS)


SAFE = 66.0 / 108.0   # sichtbarer Anteil bei adaptiven Android-Icons


def fit_scale(lite, probe=512, start=0.62):
    """Groesstmoegliche Skalierung, bei der nichts aus der sicheren Zone ragt.

    Statt einen Wert zu raten wird einmal probeweise gezeichnet, der
    aeusserste sichtbare Punkt gemessen und daraus die exakte Skalierung
    abgeleitet. Das ist genau, weil die Zeichnung linear um die Mitte
    skaliert - und es bleibt richtig, wenn sich das Motiv spaeter aendert.
    """
    import math
    img = draw_artwork(probe, lite, scale=start)
    a = img.getchannel("A").load()
    c = (probe - 1) / 2
    worst = 0.0
    for y in range(probe):
        for x in range(probe):
            if a[x, y] > 24:
                d = math.hypot(x - c, y - c)
                if d > worst:
                    worst = d
    if worst == 0:
        return start
    return start * (probe * SAFE / 2) / worst * 0.985   # kleine Sicherheitsreserve


def rounded_mask(size, radius_ratio=0.22):
    m = Image.new("L", (size * SS, size * SS), 0)
    ImageDraw.Draw(m).rounded_rectangle(
        [0, 0, size * SS - 1, size * SS - 1],
        radius=int(size * SS * radius_ratio), fill=255)
    return m.resize((size, size), Image.LANCZOS)


def build(out_dir, lite):
    os.makedirs(out_dir, exist_ok=True)
    bg = gradient(ICON, BLUE_LIGHT, BLUE_DARK)

    # --- Android adaptiv: zwei Ebenen ---
    # Hintergrund randlos, damit jede Maske Farbe bis zum Rand findet.
    bg.save(f"{out_dir}/icon-background.png")
    # Vordergrund klein und mittig: nur die inneren ~66 % sind sicher.
    fs = fit_scale(lite)
    print(f"  Vordergrund-Skalierung {fs:.3f}")
    draw_artwork(ICON, lite, scale=fs).save(f"{out_dir}/icon-foreground.png")

    # --- iOS und Rueckfallebene: deckend, randlos, ohne Alphakanal ---
    flat = bg.copy()
    flat.paste(draw_artwork(ICON, lite, scale=0.80), (0, 0), draw_artwork(ICON, lite, scale=0.80))
    flat.convert("RGB").save(f"{out_dir}/icon-only.png")
    flat.convert("RGB").save(f"{out_dir}/icon.png")

    # --- Vorschau mit abgerundeten Ecken (nur zum Anschauen, nicht fuer Stores) ---
    prev = flat.convert("RGBA")
    prev.putalpha(rounded_mask(ICON))
    prev.save(f"{out_dir}/preview-rounded.png")

    # --- Splashscreens ---
    art = draw_artwork(SPLASH, lite, scale=0.20)
    for name, colour in (("splash.png", BG_LIGHT), ("splash-dark.png", BG_DARK)):
        sp = Image.new("RGB", (SPLASH, SPLASH), colour)
        badge = Image.new("RGBA", (SPLASH, SPLASH), (0, 0, 0, 0))
        tile = int(SPLASH * 0.26)
        icon = flat.convert("RGBA").resize((tile, tile), Image.LANCZOS)
        icon.putalpha(rounded_mask(tile))
        badge.paste(icon, ((SPLASH - tile) // 2, (SPLASH - tile) // 2), icon)
        sp.paste(badge, (0, 0), badge)
        sp.save(f"{out_dir}/{name}")
    del art

    print(f"{out_dir}: fertig ({'Lite' if lite else 'Pro'})")


if __name__ == "__main__":
    build(OUT_PRO, lite=False)
    build(OUT_LITE, lite=True)
