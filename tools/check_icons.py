#!/usr/bin/env python3
"""
Prueft die erzeugten Bilddateien gegen die Vorgaben der Stores.

Der wichtigste Test ist der letzte: bei adaptiven Android-Icons darf
sichtbare Zeichnung nur innerhalb des inneren Kreises liegen (66 von
108 Einheiten Durchmesser). Alles darueber hinaus schneidet die Maske
des Herstellers ab - und zwar unterschiedlich je Geraet.
"""
from PIL import Image
import math, os, sys

SAFE = 66.0 / 108.0          # sichtbarer Anteil bei adaptiven Icons
fails = []

def check(cond, msg):
    print(("  OK   " if cond else "  FEHL ") + msg)
    if not cond:
        fails.append(msg)

for d in ("assets", "assets-lite"):
    print(f"\n=== {d} ===")
    if not os.path.isdir(d):
        fails.append(f"{d} fehlt"); continue

    for name, size in (("icon-only.png", 1024), ("icon.png", 1024),
                       ("icon-background.png", 1024), ("icon-foreground.png", 1024),
                       ("splash.png", 2732), ("splash-dark.png", 2732)):
        p = os.path.join(d, name)
        if not os.path.exists(p):
            check(False, f"{name} fehlt"); continue
        im = Image.open(p)
        check(im.size == (size, size), f"{name} ist {im.size[0]}x{im.size[1]} (erwartet {size})")

    # iOS verbietet Transparenz im App-Icon
    for name in ("icon-only.png", "icon.png"):
        im = Image.open(os.path.join(d, name))
        check(im.mode == "RGB", f"{name} ohne Alphakanal (App Store lehnt sonst ab), ist {im.mode}")

    # Hintergrundebene muss randlos decken
    bg = Image.open(os.path.join(d, "icon-background.png")).convert("RGBA")
    check(bg.getchannel("A").getextrema() == (255, 255), "icon-background.png deckt bis zum Rand")

    # Vordergrund: alles Sichtbare innerhalb der sicheren Zone?
    fg = Image.open(os.path.join(d, "icon-foreground.png")).convert("RGBA")
    W = fg.size[0]
    a = fg.getchannel("A")
    cx = cy = (W - 1) / 2
    r_safe = W * SAFE / 2
    worst = 0.0
    px = a.load()
    step = 2
    for y in range(0, W, step):
        for x in range(0, W, step):
            if px[x, y] > 24:
                dist = math.hypot(x - cx, y - cy)
                worst = max(worst, dist)
    check(worst <= r_safe,
          f"Zeichnung bleibt in der sicheren Zone "
          f"(genutzt {worst/(W/2)*100:.1f} % vom Radius, erlaubt {SAFE*100:.1f} %)")

print("\n" + ("Alle Prüfungen bestanden" if not fails else f"{len(fails)} Problem(e)"))
sys.exit(1 if fails else 0)
