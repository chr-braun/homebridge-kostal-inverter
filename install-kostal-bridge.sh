#!/bin/bash

echo "🔧 Kostal Data Bridge Installation"
echo "=================================="
echo ""

# Prüfe Python3
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 ist nicht installiert. Bitte installiere Python3 zuerst."
    exit 1
fi

echo "✅ Python3 gefunden: $(python3 --version)"

# Prüfe pip3
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 ist nicht installiert. Bitte installiere pip3 zuerst."
    exit 1
fi

echo "✅ pip3 gefunden"

# Python Dependencies installieren
echo ""
echo "📦 Installiere Python-Dependencies..."
pip3 install -r requirements.txt

if [ $? -eq 0 ]; then
    echo "✅ Dependencies erfolgreich installiert"
else
    echo "❌ Fehler beim Installieren der Dependencies"
    exit 1
fi

# MQTT Broker prüfen
echo ""
echo "🔍 Prüfe MQTT-Broker..."
if command -v mosquitto &> /dev/null; then
    echo "✅ Mosquitto MQTT-Broker gefunden"
else
    echo "⚠️  Mosquitto nicht gefunden. Installiere es mit:"
    echo "   brew install mosquitto  # macOS"
    echo "   sudo apt install mosquitto  # Ubuntu/Debian"
fi

# Script ausführbar machen
chmod +x kostal_data_bridge.py

echo ""
echo "🎉 Installation abgeschlossen!"
echo ""
echo "📝 Nächste Schritte:"
echo "1. Konfiguriere die Bridge:"
echo "   npm run setup-kostal"
echo ""
echo "2. Starte die Bridge:"
echo "   npm run start-kostal"
echo ""
echo "3. Starte Homebridge:"
echo "   homebridge -D"
echo ""
echo "🔗 Die Bridge sendet echte Kostal-Daten über MQTT an dein Homebridge-Plugin!"
