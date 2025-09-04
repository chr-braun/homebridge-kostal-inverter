# Homebridge Kostal Inverter Plugin

Ein Homebridge-Plugin für Kostal Solar-Wechselrichter mit direkter API-Integration und HomeKit Energy Generator-Unterstützung.

## 🚀 Features

- **Echte Kostal-API-Integration** - Direkte Verbindung zu deinem Kostal-Wechselrichter über pykoplenti
- **HomeKit Sensoren** - 6 verschiedene Sensoren für alle Kostal-Daten
- **GUI-Konfiguration** - Einfache Einrichtung über die Homebridge-UI
- **Echtzeitdaten** - Live-Daten von deinem Kostal-Wechselrichter
- **Child Bridge Support** - Läuft als separate Child Bridge für bessere Stabilität
- **Mehrsprachig** - Unterstützung für Deutsch, Englisch, Französisch, Italienisch und Chinesisch
- **Python-Integration** - Robuste Datenabfrage über Python-Script
- **Apple Home App Integration** - Sensoren werden in der Energie-Übersicht angezeigt
- **Automatisierungen** - Siri-Integration und energiebasierte Regeln möglich

## 🚀 Erste Schritte

### 1. Kostal-Wechselrichter vorbereiten
- **IP-Adresse finden**: Wechselrichter-Menü → Netzwerk → IP-Adresse notieren
- **Standard-Login**: `pvserver` / `pvwr` (oder deine eigenen Credentials)
- **Netzwerk testen**: `ping 192.168.178.71` (deine IP)

### 2. Plugin installieren
```bash
npm install homebridge-kostal-inverter@beta
```

### 3. Homebridge-UI konfigurieren
- Homebridge-UI öffnen
- "Add Platform" → "Kostal Solar Energy Generator"
- IP-Adresse und Login-Daten eingeben
- "Save" klicken

### 4. HomeKit verbinden
- QR-Code scannen oder PIN eingeben
- **6 Sensoren** in HomeKit-App hinzufügen
- Sensoren in der **Energie-Übersicht** anzeigen
- **Automatisierungen** für energiebasierte Regeln einrichten

## 📊 Unterstützte Sensoren

Das Plugin erstellt **6 verschiedene Sensoren** in HomeKit:

### 🔋 **Energie-Sensoren**
- **💡 Solarproduktion** - Light Sensor (Watt als Lux)
- **💡 Tagesenergie** - Light Sensor (kWh als Lux)
- **🏃 Hausverbrauch** - Motion Sensor (Bewegung = Verbrauch)
- **👥 Netzleistung** - Occupancy Sensor (Bezug/Einspeisung)

### 🌡️ **Status-Sensoren**
- **🌡️ Wechselrichter Temperatur** - Temperature Sensor (°C)
- **📡 Wechselrichter Status** - Contact Sensor (Online/Offline)

### 📈 **Daten-Mapping**
- **Solarproduktion**: Watt → Lux (1W = 1 Lux)
- **Hausverbrauch**: Verbrauch > 0 → Bewegung erkannt
- **Netzleistung**: Bezug/Einspeisung → Besetzung erkannt
- **Temperatur**: Direkt in °C
- **Tagesenergie**: kWh → Lux (1kWh = 1000 Lux)
- **Status**: Online/Offline → Kontakt geöffnet/geschlossen

## 🏠 HomeKit Integration

### **Sensoren in der Apple Home App**
Das Plugin erstellt **6 separate Sensoren**, die in der Apple Home App angezeigt werden:

1. **💡 Solarproduktion** - Zeigt aktuelle Solarproduktion in Watt (als Lux)
2. **🏃 Hausverbrauch** - Erkennt Verbrauch durch "Bewegung" (Motion Sensor)
3. **👥 Netzleistung** - Erkennt Bezug/Einspeisung durch "Besetzung" (Occupancy Sensor)
4. **🌡️ Wechselrichter Temperatur** - Temperatur in °C
5. **💡 Tagesenergie** - Heutige Energieproduktion in kWh (als Lux)
6. **📡 Wechselrichter Status** - Online/Offline Status

### **Automatisierungen möglich**
- **"Wenn Solarproduktion > 1000W"** → Heizung einschalten
- **"Wenn Hausverbrauch erkannt"** → Licht dimmen
- **"Wenn Temperatur > 60°C"** → Lüfter einschalten
- **"Wenn Status offline"** → Benachrichtigung senden

### **Siri-Integration**
- **"Hey Siri, wie ist die Solarproduktion?"**
- **"Hey Siri, ist der Wechselrichter online?"**
- **"Hey Siri, wie warm ist der Wechselrichter?"**

## 🔧 Installation

### Voraussetzungen

- **Node.js** v18.15.0 oder höher
- **Homebridge** v1.6.0 oder höher
- **Python** 3.7 oder höher
- **Kostal Plenticore** Wechselrichter (alle Modelle)
- **Netzwerkzugang** zum Kostal-Wechselrichter

### Schritt 1: Homebridge installieren

Falls noch nicht installiert:

```bash
# Homebridge global installieren
npm install -g homebridge homebridge-config-ui-x

# Homebridge als Service starten
sudo systemctl enable homebridge
sudo systemctl start homebridge
```

### Schritt 2: Plugin installieren

```bash
# Plugin aus NPM installieren
npm install homebridge-kostal-inverter@beta

# Oder für neueste Version
npm install homebridge-kostal-inverter@latest
```

### Schritt 3: Python-Dependencies installieren

Das Plugin installiert automatisch die benötigten Python-Pakete. Falls das fehlschlägt:

```bash
# Python-Pakete manuell installieren
pip3 install pykoplenti aiohttp

# Oder mit venv (empfohlen)
python3 -m venv venv
source venv/bin/activate
pip install pykoplenti aiohttp
```

### Schritt 4: Homebridge neu starten

```bash
# Homebridge neu starten
sudo systemctl restart homebridge

# Oder manuell
homebridge -D
```

## ⚙️ Konfiguration

### Über die Homebridge-UI

1. **Homebridge-UI öffnen**
   - Gehe zu `http://localhost:8581` (oder deine Homebridge-IP)
   - Melde dich mit deinen Homebridge-Credentials an

2. **Plugin hinzufügen**
   - Gehe zu "Plugins" → "Kostal Inverter"
   - Klicke auf "Add Platform"
   - Wähle "Kostal Solar Energy Generator"

3. **Kostal-Verbindung konfigurieren**
   - **IP-Adresse**: IP-Adresse deines Kostal-Wechselrichters (z.B. 192.168.178.71)
   - **Benutzername**: Standard `pvserver`
   - **Passwort**: Dein Kostal-Passwort
   - **Auto-Erkennung**: ✅ Aktiviert für automatische Modell-Erkennung

4. **Wechselrichter-Konfiguration**
   - **Generator Name**: Name in HomeKit (z.B. "Kostal Solar Generator")
   - **Modell**: Wird automatisch erkannt
   - **Seriennummer**: Wird automatisch erkannt
   - **Maximale Leistung**: 1000-50000 W (Standard: 10000 W)
   - **Maximale Tagesenergie**: 1-100 kWh (Standard: 20 kWh)

5. **Erweiterte Einstellungen**
   - **Abfrageintervall**: 10-300 Sekunden (Standard: 30s)
   - **Child Bridge**: ✅ Empfohlen für Stabilität
   - **Child Bridge Port**: 1000-65535 (Standard: 8581)
   - **Child Bridge Username**: Wird automatisch generiert
   - **Child Bridge PIN**: Format 123-45-678

6. **Speichern und starten**
   - Klicke auf "Save"
   - Homebridge startet automatisch neu
   - Plugin verbindet sich mit deinem Kostal-Wechselrichter

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
# Plugin neu verlinken
npm link

# Homebridge mit Plugin-Pfad starten
homebridge --plugin-path /path/to/plugin

# Oder Plugin neu installieren
npm uninstall homebridge-kostal-inverter
npm install homebridge-kostal-inverter@beta
```

### Python-Dependencies fehlen
```bash
# Python-Pakete installieren
pip3 install pykoplenti aiohttp

# Oder mit venv
python3 -m venv venv
source venv/bin/activate
pip install pykoplenti aiohttp
```

### Verbindungsfehler
- **IP-Adresse prüfen**: `ping 192.168.178.71`
- **Port prüfen**: `telnet 192.168.178.71 80`
- **HTTPS prüfen**: `curl -k https://192.168.178.71`
- **Benutzername/Passwort**: Standard `pvserver`/`pvwr`
- **Firewall**: Port 80/443 freigeben

### Keine Daten
- **Homebridge-Logs prüfen**: `homebridge -D`
- **Python-Script testen**: `python3 kostal_data_bridge.py --get-data`
- **Auto-Erkennung testen**: `python3 kostal_data_bridge.py --detect`
- **Wechselrichter-Status**: Ist der Wechselrichter online?

### Child Bridge Probleme
- **Port-Konflikt**: Anderen Port wählen
- **Username/PIN**: Werden automatisch generiert
- **Service-Status**: `sudo systemctl status homebridge`

### Häufige Fehler

#### "Custom UI threw an error"
- **Lösung**: Plugin auf neueste Version aktualisieren
- **Version**: `2.0.0-beta.6` oder höher

#### "updateData is not a function"
- **Lösung**: Plugin neu installieren
- **Version**: `2.0.0-beta.3` oder höher

#### "externally-managed-environment"
- **Lösung**: Python-Pakete mit `--user` installieren
- **Befehl**: `pip3 install --user pykoplenti aiohttp`

#### "Sensoren werden nicht angezeigt"
- **Lösung**: Homebridge neu starten
- **Prüfung**: In Home App → Sensoren Tab schauen
- **Version**: `2.0.0-beta.6` oder höher

#### "Automatisierungen funktionieren nicht"
- **Lösung**: Sensoren in Home App zuerst hinzufügen
- **Prüfung**: Sensoren müssen "Nicht unterstützt" Status haben

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
