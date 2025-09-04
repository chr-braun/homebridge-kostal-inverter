#!/bin/bash

echo "🔧 Kostal Data Bridge Setup"
echo "=========================="
echo ""

# Python3 prüfen
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 ist nicht installiert. Bitte installiere Python3 zuerst."
    exit 1
fi

echo "✅ Python3 gefunden: $(python3 --version)"

# pip prüfen
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

# MQTT Broker prüfen (Mosquitto)
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
echo "🎉 Setup abgeschlossen!"
echo ""
echo "📝 Nächste Schritte:"
echo "1. Bearbeite kostal_data_bridge.py und passe die Konfiguration an:"
echo "   - KOSTAL_CONFIG: IP-Adresse deines Kostal-Wechselrichters"
echo "   - MQTT_CONFIG: MQTT-Broker-Einstellungen"
echo ""
echo "2. Starte den MQTT-Broker (falls nicht läuft):"
echo "   mosquitto -c /usr/local/etc/mosquitto/mosquitto.conf -d"
echo ""
echo "3. Starte die Kostal Data Bridge:"
echo "   python3 kostal_data_bridge.py"
echo ""
echo "4. Starte Homebridge mit deinem Plugin:"
echo "   homebridge -D"
echo ""
echo "🔗 Die Bridge sendet echte Kostal-Daten über MQTT an dein Homebridge-Plugin!"
