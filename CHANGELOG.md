# Changelog

Alle wichtigen Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/),
und dieses Projekt folgt [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.4] - 2025-09-09

### Fixed
- Konfigurationsschema für Homebridge UI korrigiert
- `configSchema` in package.json hinzugefügt
- Plugin ist jetzt vollständig in der Homebridge UI konfigurierbar

## [1.0.3] - 2025-09-09

### Fixed
- Platform-Registrierung korrigiert (KostalInverter statt KostalSolarEnergyGenerator)
- Kompatibilität mit bestehenden Homebridge-Installationen wiederhergestellt
- Callback-Fehler weiterhin behoben mit setImmediate()

## [1.0.2] - 2025-09-09

### Fixed
- Callback-Fehler in allen Event Handlers behoben
- setImmediate() für alle Characteristics implementiert
- Verhindert Race Conditions und mehrfache Callback-Aufrufe
- Platform-Registrierung korrigiert (KostalSolarEnergyGenerator)
- Robuste Fehlerbehandlung in allen Event Handlers

## [1.0.1] - 2025-09-09

### Fixed
- Callback-Fehler in Event Handlers behoben
- Try-catch zu allen Event Handlers hinzugefügt
- Error-Typen korrekt behandelt
- Verhindert 'Callback already called' Fehler
- Verbesserte Fehlerbehandlung und Logging

## [1.0.0] - 2025-09-09

### Added
- **Kostal Solar Inverter Integration**: Direkte API-Integration mit Kostal Wechselrichtern
- **Echtzeit-Datenabfrage**: Automatisches Polling alle 30 Sekunden
- **HomeKit Motion Sensor**: Für Push-Benachrichtigungen bei Solarproduktion
- **Tägliche Solar-Berichte**: Automatische Berichte mit konfigurierbaren Zeiten
- **Mehrsprachige Unterstützung**: Deutsch, Englisch, Französisch, Italienisch, Chinesisch
- **Child Bridge Support**: Isolierte Ausführung für bessere Stabilität
- **Robuste Fehlerbehandlung**: Fallback auf simulierte Daten bei API-Fehlern
- **Umfassende Dokumentation**: Vollständige Setup- und Konfigurationsanleitung

### Features
- **Solarproduktion**: Anzeige als Ambient Light Level (Watt → Lux)
- **Hausverbrauch**: Anzeige als Motion Sensor (Verbrauch > 0)
- **Netzleistung**: Anzeige als Occupancy Sensor (Bezug/Einspeisung)
- **Wechselrichter Temperatur**: Temperatur-Sensor
- **Tagesenergie**: Anzeige als Ambient Light Level (kWh → Lux)
- **Wechselrichter Status**: Contact Sensor (Online/Offline)

### Technical
- **TypeScript**: Vollständig typisierte Implementierung
- **Homebridge Dynamic Platform**: Modulare Accessory-Erstellung
- **API-Integration**: Direkte HTTP-Kommunikation mit Kostal-Inverter
- **Cron-Scheduling**: Automatische tägliche Berichte
- **i18n-Support**: Mehrsprachige UI und Berichte
- **Error Recovery**: Automatische Wiederherstellung bei Fehlern

## [2.1.1] - 2025-09-09 (Deprecated)

### Fixed
- Callback-Fehler in Event Handlers behoben
- Try-catch zu allen Event Handlers hinzugefügt
- Error-Typen korrekt behandelt

## [2.1.0] - 2025-09-09 (Deprecated)

### Added
- Tägliche Solar-Berichte mit Push-Benachrichtigungen
- Mehrsprachige Unterstützung
- HomeKit Motion Sensor Integration

## [2.0.0] - 2025-09-09 (Deprecated)

### Added
- Umbenennung zu "Kostal Solar Energy Generator"
- Erweiterte API-Integration
- Verbesserte Fehlerbehandlung

## [1.3.0-dev.x] - 2025-09-09 (Deprecated)

### Development Versions
- Experimentelle Features
- Beta-Tests
- Entwicklung und Debugging

## [1.2.x] - 2025-09-09 (Deprecated)

### Legacy Versions
- Frühere Implementierungen
- Grundlegende Funktionalität

## [1.1.0] - 2025-09-09 (Deprecated)

### Legacy Versions
- Erste stabile Versionen
- Grundlegende Kostal-Integration

## [1.0.0-dev.x] - 2025-09-09 (Deprecated)

### Development Versions
- Erste Entwicklungsversionen
- Experimentelle Features
- Initiale Implementierung