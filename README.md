# Homebridge Kostal Inverter Plugin

Ein Homebridge-Plugin für Kostal Solar-Wechselrichter mit direkter API-Integration und HomeKit Energy Generator-Unterstützung.

## 🚀 Features

- **Echte Kostal-API-Integration** - Direkte Verbindung zu deinem Kostal-Wechselrichter
- **HomeKit Energy Generator** - Korrekte Darstellung als Energieerzeuger in Apple HomeKit
- **GUI-Konfiguration** - Einfache Einrichtung über die Homebridge-UI
- **Auto-Erkennung** - Automatische Erkennung des Wechselrichter-Modells
- **Echtzeitdaten** - Live-Daten von deinem Kostal-Wechselrichter
- **Mehrsprachig** - Unterstützung für Deutsch, Englisch, Französisch, Italienisch und Chinesisch

## 📊 Unterstützte Daten

- **Leistung** - Aktuelle Produktion/Verbrauch
- **Netzleistung** - Bezug vom Netz oder Einspeisung
- **Hausverbrauch** - Dein aktueller Hausverbrauch
- **Tagesenergie** - Heutige Energieproduktion
- **Temperatur** - Wechselrichter-Temperatur
- **Status** - Online/Offline-Status
- **DC-String Daten** - Spannung, Strom und Leistung pro String

## 🔧 Installation

### Voraussetzungen

- Node.js v18.15.0 oder höher
- Homebridge v1.6.0 oder höher
- Python 3.7 oder höher
- Kostal Plenticore Wechselrichter

### Plugin installieren

```bash
npm install homebridge-kostal-inverter@beta
```

### Python-Dependencies installieren

Das Plugin installiert automatisch die benötigten Python-Pakete. Falls das fehlschlägt, führe manuell aus:

```bash
pip3 install pykoplenti aiohttp
```

## ⚙️ Konfiguration

### Über die Homebridge-UI

1. Öffne die Homebridge-UI
2. Gehe zu "Plugins" → "Kostal Inverter"
3. Klicke auf "Add Platform"
4. Konfiguriere deine Kostal-Verbindung:

#### Kostal-Verbindung
- **IP-Adresse**: IP-Adresse deines Kostal-Wechselrichters (z.B. 192.168.178.71)
- **Benutzername**: Standard `pvserver`
- **Passwort**: Dein Kostal-Passwort
- **Auto-Erkennung**: Aktiviert für automatische Modell-Erkennung

#### Wechselrichter-Konfiguration
- **Generator Name**: Name in HomeKit
- **Modell**: Wird automatisch erkannt
- **Seriennummer**: Wird automatisch erkannt
- **Maximale Leistung**: 1000-50000 W (Standard: 10000 W)
- **Maximale Tagesenergie**: 1-100 kWh (Standard: 20 kWh)

#### Erweiterte Einstellungen
- **Abfrageintervall**: 10-300 Sekunden (Standard: 30s)
- **Child Bridge**: Empfohlen für Stabilität
- **Child Bridge Port**: 1000-65535 (Standard: 8581)

### Manuelle Konfiguration

```json
{
  "platforms": [
    {
      "platform": "KostalInverter",
      "name": "Kostal Solar Energy Generator",
      "kostal": {
        "host": "192.168.178.71",
        "username": "pvserver",
        "password": "dein-passwort",
        "autoDetectModel": true
      },
      "inverter": {
        "name": "Kostal Plenticore",
        "maxPower": 10000,
        "maxEnergyPerDay": 20
      },
      "pollingInterval": 30,
      "childBridge": false
    }
  ]
}
```

## 🏠 HomeKit Integration

Das Plugin erstellt folgende HomeKit-Services:

### Energy Generator (Hauptgerät)
- **Outlet** - Hauptleistung (positiv = Produktion, negativ = Verbrauch)
- **TemperatureSensor** - Wechselrichter-Temperatur
- **HumiditySensor** - Tagesenergie (als Feuchtigkeit dargestellt)
- **ContactSensor** - Online/Offline-Status

### Zusätzliche Sensoren
- **LightSensor** - DC-String Spannungen und Ströme
- **Outlet** - DC-String Leistungen

## 🔍 Troubleshooting

### Plugin wird nicht gefunden
```bash
npm link
homebridge --plugin-path /path/to/plugin
```

### Python-Dependencies fehlen
```bash
pip3 install pykoplenti aiohttp
```

### Verbindungsfehler
- Überprüfe die IP-Adresse deines Wechselrichters
- Stelle sicher, dass der Wechselrichter erreichbar ist
- Überprüfe Benutzername und Passwort

### Keine Daten
- Überprüfe die Homebridge-Logs
- Teste die Verbindung mit: `python3 kostal_data_bridge.py --get-data`

## 📝 Logs

Das Plugin loggt detaillierte Informationen über:
- Verbindungsstatus zum Wechselrichter
- Abgerufene Daten
- Fehler und Warnungen
- Auto-Erkennung des Modells

## 🛠️ Entwicklung

### Projekt aufsetzen
```bash
git clone https://github.com/chr-braun/homebridge-kostal-inverter.git
cd homebridge-kostal-inverter
npm install
npm run build
```

### Testen
```bash
# Python-Script testen
python3 kostal_data_bridge.py --get-data

# Auto-Erkennung testen
python3 kostal_data_bridge.py --detect

# Homebridge testen
homebridge -D -C test-config.json
```

### Build
```bash
npm run build
```

## 📋 Unterstützte Wechselrichter

- Kostal Plenticore (alle Modelle)
- Kostal Piko (alle Modelle)
- Weitere Kostal-Modelle mit pykoplenti-Unterstützung

## 🤝 Beitragen

1. Fork das Repository
2. Erstelle einen Feature-Branch
3. Committe deine Änderungen
4. Push zum Branch
5. Erstelle einen Pull Request

## 📄 Lizenz

MIT License - siehe [LICENSE](LICENSE) für Details.

## 🙏 Danksagungen

- [pykoplenti](https://github.com/stegm/pykoplenti) - Python-Bibliothek für Kostal-Wechselrichter
- [Homebridge](https://homebridge.io/) - HomeKit-Bridge für Node.js
- [aiohttp](https://aiohttp.readthedocs.io/) - Asynchrone HTTP-Client/Server

## 📞 Support

Bei Problemen oder Fragen:
- Erstelle ein [Issue](https://github.com/chr-braun/homebridge-kostal-inverter/issues)
- Überprüfe die [Homebridge-Community](https://github.com/homebridge/homebridge)

---

**Entwickelt mit ❤️ für die Homebridge-Community**
