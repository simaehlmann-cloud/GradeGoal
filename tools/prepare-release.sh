#!/usr/bin/env bash
#
# Bereitet das von Capacitor erzeugte Android-Projekt für ein signiertes
# Release vor. Muss NACH "npx cap add android" laufen.
#
# Warum ein Skript und kein fester Eintrag im Repo?
# Der Ordner android/ steht in .gitignore und wird bei jedem Build neu
# erzeugt. Alles, was dort dauerhaft stehen soll, muss also jedes Mal
# frisch hineingeschrieben werden.
#
# Aufruf: tools/prepare-release.sh <versionName> <versionCode>

set -euo pipefail

VERSION_NAME="${1:?versionName fehlt (z. B. 1.5.0)}"
VERSION_CODE="${2:?versionCode fehlt (z. B. 7)}"
GRADLE="android/app/build.gradle"

[ -f "$GRADLE" ] || { echo "FEHLER: $GRADLE nicht gefunden. Lief 'npx cap add android'?"; exit 1; }

# --- Versionsangaben setzen ---------------------------------------------
# Play akzeptiert jeden versionCode nur EINMAL je App-ID und verlangt,
# dass er bei jedem Upload steigt. Capacitor legt stumpf 1 an.
sed -i -E "s/versionCode [0-9]+/versionCode ${VERSION_CODE}/" "$GRADLE"
sed -i -E "s/versionName \"[^\"]*\"/versionName \"${VERSION_NAME}\"/" "$GRADLE"

# --- Signierung anhängen ------------------------------------------------
# Ein zweiter android { } Block ist zulässig: Gradle führt beide zusammen.
# Die Passwörter kommen aus der Umgebung, damit sie nirgends im Repo und
# in keinem Build-Protokoll landen.
cat >> "$GRADLE" <<'GRADLE_EOF'

// --- von tools/prepare-release.sh angefügt ---
android {
    signingConfigs {
        release {
            storeFile file(System.getenv("ANDROID_KEYSTORE_FILE") ?: "keystore.jks")
            storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD")
            keyAlias System.getenv("ANDROID_KEY_ALIAS")
            keyPassword System.getenv("ANDROID_KEY_PASSWORD")
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
        }
    }
}
GRADLE_EOF

# --- Gegenprobe ---------------------------------------------------------
# Ohne diese Prüfung würde ein fehlgeschlagenes sed still durchlaufen und
# erst die Play Console würde meckern - Stunden später.
echo "--- Ergebnis ---"
grep -E "applicationId|versionCode|versionName" "$GRADLE" | sed 's/^ *//'

grep -q "versionCode ${VERSION_CODE}" "$GRADLE" || { echo "FEHLER: versionCode wurde nicht gesetzt"; exit 1; }
grep -q "versionName \"${VERSION_NAME}\"" "$GRADLE" || { echo "FEHLER: versionName wurde nicht gesetzt"; exit 1; }
grep -q "signingConfigs.release" "$GRADLE" || { echo "FEHLER: Signierung wurde nicht angefügt"; exit 1; }

echo "Android-Projekt für Release vorbereitet: ${VERSION_NAME} (${VERSION_CODE})"
