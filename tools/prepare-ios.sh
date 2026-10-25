#!/usr/bin/env bash
#
# Bereitet das von Capacitor erzeugte iOS-Projekt für TestFlight vor.
# Muss NACH "npx cap add ios" und "npx cap sync ios" laufen.
#
# Wie bei Android steht ios/ in .gitignore und wird bei jedem Build neu
# erzeugt. Alles, was im Projekt dauerhaft stehen soll, schreibt dieses
# Skript jedes Mal frisch hinein.
#
# Aufruf: tools/prepare-ios.sh <Version> <Build-Nummer>

set -euo pipefail

VERSION="${1:?Version fehlt (z. B. 1.8.0)}"
BUILD="${2:?Build-Nummer fehlt (z. B. 12)}"
PLIST="ios/App/App/Info.plist"
PB=/usr/libexec/PlistBuddy

[ -f "$PLIST" ] || { echo "FEHLER: $PLIST nicht gefunden. Lief 'npx cap add ios'?"; exit 1; }

# Setzt einen Eintrag – egal, ob er schon existiert.
put() {
  local key="$1" type="$2" value="$3"
  $PB -c "Delete :$key" "$PLIST" >/dev/null 2>&1 || true
  $PB -c "Add :$key $type $value" "$PLIST"
}

# --- Versionen --------------------------------------------------------
# App Store Connect nimmt jede Build-Nummer je Version nur EINMAL an.
put CFBundleShortVersionString string "$VERSION"
put CFBundleVersion string "$BUILD"

# --- Name auf dem Homescreen -------------------------------------------
put CFBundleDisplayName string "GradeGoal"

# --- Exportkontrolle ----------------------------------------------------
# Die App nutzt keine eigene Verschlüsselung (nur die des Systems).
# Ohne diesen Eintrag fragt App Store Connect bei JEDEM Build nach und
# der Build bleibt in TestFlight bis zur Antwort gesperrt.
put ITSAppUsesNonExemptEncryption bool false

# --- Teilen-Menü: „Bild sichern“ ----------------------------------------
# Exportierte Diagramme lassen sich im Teilen-Menü in Fotos sichern.
# Fehlt diese Begründung, beendet iOS die App beim Tippen darauf.
put NSPhotoLibraryAddUsageDescription string "GradeGoal speichert ein exportiertes Diagramm nur dann in deinen Fotos, wenn du das im Teilen-Menü auswählst. / GradeGoal only saves an exported chart to Photos when you choose that in the share sheet."

# --- Gegenprobe ---------------------------------------------------------
echo "--- Info.plist ---"
for k in CFBundleIdentifier CFBundleShortVersionString CFBundleVersion CFBundleDisplayName ITSAppUsesNonExemptEncryption; do
  printf '%-32s %s\n' "$k" "$($PB -c "Print :$k" "$PLIST" 2>/dev/null || echo '(aus Build-Einstellungen)')"
done

[ "$($PB -c 'Print :CFBundleShortVersionString' "$PLIST")" = "$VERSION" ] || { echo "FEHLER: Version nicht gesetzt"; exit 1; }
[ "$($PB -c 'Print :CFBundleVersion' "$PLIST")" = "$BUILD" ] || { echo "FEHLER: Build-Nummer nicht gesetzt"; exit 1; }

echo "iOS-Projekt vorbereitet: $VERSION ($BUILD)"
