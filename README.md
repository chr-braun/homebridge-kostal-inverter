# Homebridge Kostal Inverter

[![npm version](https://badge.fury.io/js/homebridge-kostal-inverter.svg)](https://badge.fury.io/js/homebridge-kostal-inverter)
[![Downloads](https://img.shields.io/npm/dm/homebridge-kostal-inverter.svg)](https://www.npmjs.com/package/homebridge-kostal-inverter)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Ein professionelles Homebridge-Plugin für Kostal-Solarwechselrichter mit MQTT-Integration, mehrsprachiger Benutzeroberfläche und Child Bridge-Unterstützung.

## 🚀 Features

- **⚡ Kostal-Wechselrichter Integration** - Vollständige Unterstützung für alle Kostal-Modelle
- **📡 MQTT-Protokoll** - Echtzeit-Datenübertragung über MQTT
- **🌍 Mehrsprachige UI** - Deutsch, Englisch, Französisch, Italienisch, Chinesisch
- **🔌 Child Bridge** - Kann als separate Bridge laufen für bessere Stabilität
- **📊 Energie-Monitoring** - Überwachung von Leistung, Energie und Status
- **🏠 HomeKit-Integration** - Nahtlose Integration in Apple Home
- **🔧 Konfigurierbare Topics** - Flexible MQTT-Topic-Konfiguration
- **📱 Real-time Updates** - Live-Daten alle 30 Sekunden

## 📋 Voraussetzungen

- **Node.js** 18.0.0 oder höher
- **Homebridge** 1.6.0 oder höher
- **Kostal-Wechselrichter** mit Netzwerk-Zugang
- **MQTT-Broker** (z.B. Mosquitto)

## 🔧 Installation

### Über Homebridge UI (Empfohlen)

1. Öffne die Homebridge UI
2. Gehe zu "Plugins"
3. Suche nach "Kostal Inverter"
4. Klicke auf "Installieren"

### Über NPM

```bash
npm install -g homebridge-kostal-inverter
```

## ⚙️ Konfiguration

### Basis-Konfiguration

```json
{
  "platform": "KostalInverter",
  "name": "Kostal Solar",
  "mqtt": {
    "host": "192.168.1.100",
    "port": 1883,
    "username": "your_username",
    "password": "your_password",
    "clientId": "homebridge-kostal"
  },
  "inverter": {
    "name": "Kostal Piko",
    "model": "Piko 10.0",
    "serialNumber": "123456789"
  },
  "language": "de",
  "childBridge": false
}
```

### Erweiterte Konfiguration

```json
{
  "platform": "KostalInverter",
  "name": "Kostal Solar",
  "mqtt": {
    "host": "192.168.1.100",
    "port": 1883,
    "username": "your_username",
    "password": "your_password",
    "clientId": "homebridge-kostal",
    "topics": {
      "power": "kostal/inverter/power",
      "energy": "kostal/inverter/energy_today",
      "status": "kostal/inverter/status",
      "temperature": "kostal/inverter/temperature",
      "voltage": "kostal/inverter/voltage_ac",
      "frequency": "kostal/inverter/frequency"
    }
  },
  "inverter": {
    "name": "Kostal Piko",
    "model": "Piko 10.0",
    "serialNumber": "123456789",
    "maxPower": 10000,
    "maxEnergyPerDay": 20,
    "strings": 2
  },
  "language": "de",
  "childBridge": false,
  "updateInterval": 30,
  "debug": false
}
```

## 🌍 Unterstützte Sprachen

- 🇩🇪 **Deutsch** (de)
- 🇺🇸 **Englisch** (en)
- 🇫🇷 **Französisch** (fr)
- 🇮🇹 **Italienisch** (it)
- 🇨🇳 **Chinesisch** (zh)

## 📊 MQTT-Topics

Das Plugin erwartet folgende MQTT-Topics von Ihrem Kostal-Wechselrichter:

### Leistung
- `kostal/inverter/power` - Aktuelle AC-Leistung in Watt
- `kostal/inverter/power_dc1` - DC-Leistung String 1
- `kostal/inverter/power_dc2` - DC-Leistung String 2

### Energie
- `kostal/inverter/energy_today` - Tagesenergie in kWh
- `kostal/inverter/energy_total` - Gesamtenergie in kWh

### Status & Messwerte
- `kostal/inverter/status` - Wechselrichter-Status (0/1)
- `kostal/inverter/temperature` - Temperatur in °C
- `kostal/inverter/voltage_ac` - AC-Spannung in Volt
- `kostal/inverter/frequency` - Netzfrequenz in Hz

## 🏠 HomeKit-Integration

Das Plugin erstellt folgende HomeKit-Geräte:

- **Light Sensor** - Zeigt aktuelle Leistung als "Lux"-Wert
- **Temperature Sensor** - Wechselrichter-Temperatur
- **Humidity Sensor** - Tagesenergie als Prozent
- **Contact Sensor** - Online/Offline-Status

## 🔌 Child Bridge

Aktivieren Sie die Child Bridge-Funktion für bessere Stabilität:

```json
{
  "childBridge": true,
  "childBridgePort": 8581
}
```

## 🔗 Echte Kostal-Daten

Das Plugin enthält ein integriertes Python-Script für echte Kostal-Daten:

```bash
# 1. Python-Dependencies installieren (automatisch bei npm install)
npm install

# 2. Kostal-Bridge konfigurieren
npm run setup-kostal

# 3. Kostal Data Bridge starten
npm run start-kostal

# 4. Homebridge starten (in separatem Terminal)
homebridge -D
```

**Automatische Installation:**
- Python-Dependencies werden automatisch bei `npm install` installiert
- Interaktive Konfiguration mit `npm run setup-kostal`
- Einfacher Start mit `npm run start-kostal`

Siehe [KOSTAL-REAL-DATA-GUIDE.md](KOSTAL-REAL-DATA-GUIDE.md) für Details.

## 🐛 Fehlerbehebung

### Häufige Probleme

1. **MQTT-Verbindung fehlgeschlagen**
   - Überprüfen Sie MQTT-Broker-Einstellungen
   - Prüfen Sie Netzwerkverbindung

2. **Keine Daten angezeigt**
   - Überprüfen Sie MQTT-Topics
   - Aktivieren Sie Debug-Modus

3. **HomeKit-Geräte nicht sichtbar**
   - Starten Sie Homebridge neu
   - Überprüfen Sie Konfiguration

### Debug-Modus

```json
{
  "debug": true
}
```

## 🤝 Beitragen

Wir freuen uns über Beiträge! Bitte lesen Sie unsere [Contributing Guidelines](CONTRIBUTING.md).

## 📝 Changelog

Siehe [CHANGELOG.md](CHANGELOG.md) für alle Änderungen.

## 📄 Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert. Siehe [LICENSE](LICENSE) für Details.

## 🙏 Danksagungen

- Kostal für die Bereitstellung der Wechselrichter-Protokolle
- Homebridge-Community für die Unterstützung
- Alle Mitwirkenden und Tester

## 📞 Support

- **GitHub Issues**: [Probleme melden](https://github.com/chr-braun/homebridge-kostal-inverter/issues)
- **Discussions**: [Diskussionen](https://github.com/chr-braun/homebridge-kostal-inverter/discussions)
- **Wiki**: [Dokumentation](https://github.com/chr-braun/homebridge-kostal-inverter/wiki)

---

**Entwickelt mit ❤️ für die Homebridge-Community**

*Version 1.0.0 - Vollständig funktionsfähig und produktionsbereit*