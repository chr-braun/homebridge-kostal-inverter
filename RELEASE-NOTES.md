# Release Notes

## Version 1.0.4 - 2025-09-09

### 🎉 Hauptfeatures
- **Vollständige Homebridge UI Integration** - Plugin ist jetzt vollständig über die Homebridge UI konfigurierbar
- **Stabile Kostal-API-Integration** - Robuste Verbindung zu Kostal-Wechselrichtern
- **Tägliche Solar-Berichte** - Automatische Push-Benachrichtigungen mit Tagesenergie
- **Mehrsprachige Unterstützung** - Deutsch, Englisch, Französisch, Italienisch, Chinesisch

### 🔧 Technische Verbesserungen
- Konfigurationsschema für Homebridge UI korrigiert
- `configSchema` in package.json hinzugefügt
- Robuste Fehlerbehandlung mit setImmediate()
- Callback-Fehler vollständig behoben
- Platform-Registrierung optimiert

### 📱 HomeKit Integration
- **6 verschiedene Sensoren** für alle Kostal-Daten
- **Motion Sensor** für Push-Benachrichtigungen
- **Ambient Light Level** für Solarproduktion und Tagesenergie
- **Occupancy Sensor** für Netzleistung
- **Temperature Sensor** für Wechselrichter-Temperatur
- **Contact Sensor** für Online/Offline Status

### 🚀 Installation
```bash
npm install homebridge-kostal-inverter
```

### 📖 Dokumentation
- Vollständige README.md mit Setup-Anleitung
- Detaillierte CHANGELOG.md
- Konfigurationsbeispiele
- Troubleshooting-Guide

---

## Version 1.0.3 - 2025-09-09

### 🔧 Bugfixes
- Platform-Registrierung korrigiert (KostalInverter statt KostalSolarEnergyGenerator)
- Kompatibilität mit bestehenden Homebridge-Installationen wiederhergestellt
- Callback-Fehler weiterhin behoben mit setImmediate()

---

## Version 1.0.2 - 2025-09-09

### 🔧 Bugfixes
- Callback-Fehler in allen Event Handlers behoben
- setImmediate() für alle Characteristics implementiert
- Verhindert Race Conditions und mehrfache Callback-Aufrufe
- Platform-Registrierung korrigiert
- Robuste Fehlerbehandlung in allen Event Handlers

---

## Version 1.0.1 - 2025-09-09

### 🔧 Bugfixes
- Callback-Fehler in Event Handlers behoben
- Try-catch zu allen Event Handlers hinzugefügt
- Error-Typen korrekt behandelt
- Verhindert 'Callback already called' Fehler
- Verbesserte Fehlerbehandlung und Logging

---

## Version 1.0.0 - 2025-09-09

### 🎉 Erste stabile Version

#### ✨ Neue Features
- **Kostal Solar Inverter Integration** - Direkte API-Integration mit Kostal Wechselrichtern
- **Echtzeit-Datenabfrage** - Automatisches Polling alle 30 Sekunden
- **HomeKit Motion Sensor** - Für Push-Benachrichtigungen bei Solarproduktion
- **Tägliche Solar-Berichte** - Automatische Berichte mit konfigurierbaren Zeiten
- **Mehrsprachige Unterstützung** - Deutsch, Englisch, Französisch, Italienisch, Chinesisch
- **Child Bridge Support** - Isolierte Ausführung für bessere Stabilität
- **Robuste Fehlerbehandlung** - Fallback auf simulierte Daten bei API-Fehlern

#### 📱 HomeKit Sensoren
- **Solarproduktion** - Light Sensor (Watt als Lux)
- **Hausverbrauch** - Motion Sensor (Verbrauch > 0)
- **Netzleistung** - Occupancy Sensor (Bezug/Einspeisung)
- **Wechselrichter Temperatur** - Temperature Sensor
- **Tagesenergie** - Light Sensor (kWh als Lux)
- **Wechselrichter Status** - Contact Sensor (Online/Offline)

#### 🔧 Technische Details
- **TypeScript** - Vollständig typisierte Implementierung
- **Homebridge Dynamic Platform** - Modulare Accessory-Erstellung
- **API-Integration** - Direkte HTTP-Kommunikation mit Kostal-Inverter
- **Cron-Scheduling** - Automatische tägliche Berichte
- **i18n-Support** - Mehrsprachige UI und Berichte
- **Error Recovery** - Automatische Wiederherstellung bei Fehlern

---

## Installation & Setup

### Voraussetzungen
- Homebridge v1.6.0 oder höher
- Node.js v18.0.0 oder höher
- Kostal Wechselrichter mit Netzwerkzugang

### Installation
```bash
npm install homebridge-kostal-inverter
```

### Konfiguration
1. Homebridge UI öffnen
2. "Add Platform" → "Kostal Solar Energy Generator"
3. IP-Adresse und Login-Daten eingeben
4. Tägliche Berichte konfigurieren (optional)
5. Speichern und Homebridge neu starten

### HomeKit Integration
- QR-Code scannen oder PIN eingeben
- 6 Sensoren in HomeKit-App hinzufügen
- Sensoren in der Energie-Übersicht anzeigen
- Automatisierungen für energiebasierte Regeln einrichten

---

## Support & Community

- **GitHub Issues**: [Bug Reports & Feature Requests](https://github.com/chr-braun/homebridge-kostal-inverter/issues)
- **Documentation**: [README.md](https://github.com/chr-braun/homebridge-kostal-inverter/blob/main/README.md)
- **Changelog**: [CHANGELOG.md](https://github.com/chr-braun/homebridge-kostal-inverter/blob/main/CHANGELOG.md)

---

## License

MIT License - siehe [LICENSE](https://github.com/chr-braun/homebridge-kostal-inverter/blob/main/LICENSE) für Details.
