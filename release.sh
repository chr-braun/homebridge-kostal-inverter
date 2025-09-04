#!/bin/bash

echo "🚀 Homebridge Kostal Inverter - Release Script"
echo "=============================================="
echo ""

# Prüfe ob wir im richtigen Verzeichnis sind
if [ ! -f "package.json" ]; then
    echo "❌ Fehler: package.json nicht gefunden. Bitte führe das Script im Projektverzeichnis aus."
    exit 1
fi

# Lese aktuelle Version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "📦 Aktuelle Version: $CURRENT_VERSION"

# Prüfe ob git clean ist
if [ -n "$(git status --porcelain)" ]; then
    echo "❌ Fehler: Git working directory ist nicht clean. Bitte committe alle Änderungen."
    exit 1
fi

# Prüfe ob wir auf main branch sind
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "❌ Fehler: Du musst auf dem main branch sein. Aktuell: $CURRENT_BRANCH"
    exit 1
fi

# Build testen
echo ""
echo "🔨 Teste Build..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build fehlgeschlagen!"
    exit 1
fi

# Linter testen
echo ""
echo "🔍 Teste Linter..."
npm run lint
if [ $? -ne 0 ]; then
    echo "❌ Linter-Fehler gefunden!"
    exit 1
fi

# NPM pack testen
echo ""
echo "📦 Teste NPM Package..."
npm pack --dry-run
if [ $? -ne 0 ]; then
    echo "❌ NPM pack fehlgeschlagen!"
    exit 1
fi

# Git tag prüfen
if git rev-parse "v$CURRENT_VERSION" >/dev/null 2>&1; then
    echo "❌ Fehler: Tag v$CURRENT_VERSION existiert bereits!"
    exit 1
fi

# Bestätigung
echo ""
echo "✅ Alle Tests erfolgreich!"
echo ""
echo "📋 Release-Zusammenfassung:"
echo "  - Version: $CURRENT_VERSION"
echo "  - Branch: $CURRENT_BRANCH"
echo "  - Build: ✅"
echo "  - Linter: ✅"
echo "  - NPM Pack: ✅"
echo ""

read -p "🤔 Möchtest du das Release durchführen? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Release abgebrochen."
    exit 1
fi

# Git tag erstellen
echo ""
echo "🏷️  Erstelle Git Tag..."
git tag -a "v$CURRENT_VERSION" -m "Release v$CURRENT_VERSION"
if [ $? -ne 0 ]; then
    echo "❌ Git tag fehlgeschlagen!"
    exit 1
fi

# Git push
echo ""
echo "📤 Pushe zu GitHub..."
git push origin main --tags
if [ $? -ne 0 ]; then
    echo "❌ Git push fehlgeschlagen!"
    exit 1
fi

# NPM publish
echo ""
echo "📦 Publiziere zu NPM..."
npm publish
if [ $? -ne 0 ]; then
    echo "❌ NPM publish fehlgeschlagen!"
    exit 1
fi

echo ""
echo "🎉 Release erfolgreich!"
echo ""
echo "📋 Nächste Schritte:"
echo "  1. GitHub Release erstellen: https://github.com/chr-braun/homebridge-kostal-inverter/releases"
echo "  2. Release Notes schreiben"
echo "  3. Community informieren"
echo ""
echo "🔗 Links:"
echo "  - NPM: https://www.npmjs.com/package/homebridge-kostal-inverter"
echo "  - GitHub: https://github.com/chr-braun/homebridge-kostal-inverter"
echo ""
echo "✨ Viel Erfolg mit deinem Plugin!"
