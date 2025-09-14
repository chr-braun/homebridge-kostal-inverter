# Homebridge Kostal Inverter

[![npm version](https://badge.fury.io/js/homebridge-kostal-inverter.svg)](https://badge.fury.io/js/homebridge-kostal-inverter)
[![Downloads](https://img.shields.io/npm/dm/homebridge-kostal-inverter.svg)](https://www.npmjs.com/package/homebridge-kostal-inverter)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Ein professionelles Homebridge-Plugin für Kostal-Solarwechselrichter mit direkter API-Integration, mehrsprachiger Benutzeroberfläche und Child Bridge-Unterstützung.

## 🚀 Features

- **🔌 Direkte Kostal API-Integration** - Direkte Kommunikation mit Kostal Plenticore Wechselrichtern
- **📊 Umfassendes Daten-Monitoring** - 25+ HomeKit Accessories für alle Solar-Datenpunkte
- **🌍 Mehrsprachige UI** - Deutsch, Englisch, Französisch, Italienisch, Chinesisch
- **🔌 Child Bridge** - Kann als separate Bridge laufen für bessere Stabilität
- **📈 Echtzeit Solar-Analytics** - Live DC/AC-Leistung, Energieproduktion und Effizienz-Metriken
- **🏠 HomeKit-Integration** - Temperatur-, Licht-, Feuchtigkeits- und Bewegungs-Sensoren
- **🐍 Python Bridge** - Robuste Python-Script für Kostal API-Kommunikation
- **📱 Tägliche Berichte** - Konfigurierbare Tagesabschluss-Zusammenfassungen

## 📋 Voraussetzungen

- **Node.js** 16.0.0 oder höher
- **Homebridge** 1.6.0 oder höher
- **Kostal Plenticore Wechselrichter** mit Netzwerk-Zugang
- **Python 3.7+** für Kostal API-Integration

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
  "kostal": {
    "host": "192.168.1.100",
    "username": "pvserver",
    "password": "your_password"
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
  "kostal": {
    "host": "192.168.1.100",
    "username": "pvserver",
    "password": "your_password"
  },
  "language": "de",
  "childBridge": true,
  "childBridgePort": 8581,
  "updateInterval": 60,
  "debug": false,
  "dailyReports": {
    "enabled": true,
    "deliveryMethod": "motion",
    "time": "sunset",
    "language": "de"
  }
}
```

## 🌍 Unterstützte Sprachen

- 🇩🇪 **Deutsch** (de)
- 🇺🇸 **Englisch** (en)
- 🇫🇷 **Französisch** (fr)
- 🇮🇹 **Italienisch** (it)
- 🇨🇳 **Chinesisch** (zh)

## 📊 Überwachte Datenpunkte

Das Plugin überwacht folgende Daten direkt von Ihrem Kostal Plenticore Wechselrichter:

### Leistung & Energie
- **DC-Leistung** - String 1 & 2 Leistung in Watt
- **AC-Leistung** - Ausgangsleistung in Watt
- **Netzleistung** - Einspeisung/Bezug in Watt
- **Hausverbrauch** - Aktueller Verbrauch in Watt
- **Eigenverbrauch** - Selbst genutzte Solar-Energie in Watt

### Energie & Statistiken
- **Tagesertrag** - Heutige Energieproduktion in kWh
- **Gesamtertrag** - Gesamte Energieproduktion in kWh
- **Autarkie heute** - Selbstversorgungsgrad in %
- **Eigenverbrauchsrate** - Anteil selbst genutzter Energie in %

### Technische Werte
- **DC-Spannungen** - String 1 & 2 Spannungen in Volt
- **AC-Spannung** - Ausgangsspannung in Volt
- **Netzfrequenz** - Netzspannungsfrequenz in Hz
- **Wechselrichter-Temperatur** - Gerätetemperatur in °C
- **Wechselrichter-Status** - Betriebsstatus (MPP, Standby, etc.)

## 🏠 HomeKit-Integration

Das Plugin erstellt 25+ HomeKit Accessories für alle Solar-Datenpunkte:

### Sensoren
- **Light Sensor** - DC/AC-Leistung, String-Leistungen
- **Temperature Sensor** - Wechselrichter-Temperatur
- **Humidity Sensor** - Energie-Statistiken (Tagesertrag, Autarkie, etc.)
- **Motion Sensor** - Wechselrichter-Status, tägliche Berichte
- **Contact Sensor** - Online/Offline-Status

### Datenpunkte
- **Leistung**: DC-Leistung, AC-Leistung, Netzleistung, Hausverbrauch, Eigenverbrauch
- **Energie**: Tagesertrag, Gesamtertrag, Autarkie, Eigenverbrauchsrate
- **Spannungen**: DC-Spannungen (String 1/2), AC-Spannung
- **Technisch**: Netzfrequenz, Wechselrichter-Status, CO2-Einsparung

## 🔌 Child Bridge

Aktivieren Sie die Child Bridge-Funktion für bessere Stabilität:

```json
{
  "childBridge": true,
  "childBridgePort": 8581
}
```

**Vorteile der Child Bridge:**
- Bessere Stabilität bei vielen Accessories
- Isolierte Fehlerbehandlung
- Automatische PIN-Generierung
- Separate Bridge-Konfiguration

## 🔗 Direkte Kostal API-Integration

Das Plugin kommuniziert direkt mit deinem Kostal Plenticore Wechselrichter über die REST-API:

```bash
# 1. Plugin installieren
npm install -g homebridge-kostal-inverter

# 2. Python-Dependencies installieren
bash install-python-deps.sh

# 3. Kostal-Wechselrichter konfigurieren
npm run setup-kostal

# 4. Homebridge starten
homebridge -D
```

**Vorteile der direkten API-Integration:**
- ✅ Kein MQTT-Broker erforderlich
- ✅ Direkte Kommunikation mit Kostal-Wechselrichter
- ✅ Automatische Datenabfrage alle 60 Sekunden
- ✅ Unterstützt alle Kostal Plenticore Modelle
- ✅ Echtzeit-Daten ohne Verzögerung
- ✅ Robuste Fehlerbehandlung

**Python-Dependencies Installation:**
- Automatisch bei `npm install` (kann fehlschlagen auf manchen Systemen)
- Manuell mit `bash install-python-deps.sh`
- Oder direkt: `pip3 install pykoplenti`

**Troubleshooting:**
- Bei "externally-managed-environment" Fehler: `pip3 install --user pykoplenti`
- Bei Permission-Fehlern: `sudo pip3 install pykoplenti`
- Bei Verbindungsproblemen: Überprüfe IP-Adresse und Credentials

## 🐛 Fehlerbehebung

### Häufige Probleme

1. **Kostal API-Verbindung fehlgeschlagen**
   - Überprüfen Sie IP-Adresse und Credentials
   - Prüfen Sie Netzwerkverbindung zum Wechselrichter
   - Testen Sie mit: `python3 kostal_data_bridge.py --host IP --username USER --password PASS`

2. **Keine Daten angezeigt**
   - Überprüfen Sie Python-Installation: `python3 --version`
   - Installieren Sie pykoplenti: `pip3 install pykoplenti`
   - Aktivieren Sie Debug-Modus

3. **HomeKit-Geräte nicht sichtbar**
   - Starten Sie Homebridge neu
   - Überprüfen Sie Konfiguration
   - Cache wird automatisch bei jedem Start gelöscht

4. **Python-Dependencies Probleme**
   - `pip3 install --user pykoplenti` (für externally-managed-environment)
   - `sudo pip3 install pykoplenti` (für Permission-Fehler)
   - `bash install-python-deps.sh` (automatische Installation)

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

*Version 1.4.0 - Vollständig funktionsfähig mit direkter Kostal API-Integration*