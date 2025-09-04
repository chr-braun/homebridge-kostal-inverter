# 🔌 Kostal Real Data Guide

Anleitung zum Abrufen **echter Daten** von deinem Kostal-Wechselrichter über Python und Weiterleitung an das Homebridge-Plugin.

## 🎯 Was du bekommst

- **Echte Kostal-Daten** direkt vom Wechselrichter
- **Automatische MQTT-Weiterleitung** an dein Homebridge-Plugin
- **Alle wichtigen Solar-Daten**: Leistung, Energie, Spannung, Strom, Temperatur
- **Echtzeit-Updates** alle 30 Sekunden

## 📋 Voraussetzungen

- **Kostal-Wechselrichter** mit Netzwerk-Zugang
- **Python 3.7+** installiert
- **MQTT-Broker** (z.B. Mosquitto)
- **Homebridge** mit deinem Plugin

## 🚀 Schnellstart

### 1. Setup ausführen

```bash
# Script ausführbar machen
chmod +x setup_kostal_bridge.sh

# Setup ausführen
./setup_kostal_bridge.sh
```

### 2. Konfiguration anpassen

Bearbeite `kostal_data_bridge.py` und passe die Einstellungen an:

```python
KOSTAL_CONFIG = {
    "host": "192.168.1.100",  # ← IP deines Kostal-Wechselrichters
    "username": "pvserver",   # Standard-Username
    "password": "pvwr",       # Standard-Password
}

MQTT_CONFIG = {
    "host": "localhost",      # MQTT-Broker IP
    "port": 1883,
    "username": None,         # Optional
    "password": None,         # Optional
}
```

### 3. MQTT-Broker starten

```bash
# Mosquitto starten (macOS)
brew services start mosquitto

# Oder manuell
mosquitto -c /usr/local/etc/mosquitto/mosquitto.conf -d
```

### 4. Kostal Data Bridge starten

```bash
python3 kostal_data_bridge.py
```

### 5. Homebridge starten

```bash
homebridge -D
```

## 📊 Verfügbare Daten

Das Script sendet folgende Daten über MQTT:

| MQTT Topic | Beschreibung | Einheit | Beispiel |
|------------|--------------|---------|----------|
| `kostal/inverter/power` | AC-Leistung (Gesamt) | Watt | 2500 |
| `kostal/inverter/energy_today` | Tagesenergie | kWh | 12.5 |
| `kostal/inverter/energy_total` | Gesamtenergie | kWh | 15420.8 |
| `kostal/inverter/temperature` | Wechselrichter-Temp | °C | 45.2 |
| `kostal/inverter/voltage_ac` | AC-Spannung | Volt | 230.5 |
| `kostal/inverter/frequency` | Netzfrequenz | Hz | 50.02 |
| `kostal/inverter/voltage_dc1` | DC-Spannung String 1 | Volt | 350.2 |
| `kostal/inverter/voltage_dc2` | DC-Spannung String 2 | Volt | 348.7 |
| `kostal/inverter/current_dc1` | DC-Strom String 1 | Ampere | 3.2 |
| `kostal/inverter/current_dc2` | DC-Strom String 2 | Ampere | 3.1 |
| `kostal/inverter/power_dc1` | DC-Leistung String 1 | Watt | 1120 |
| `kostal/inverter/power_dc2` | DC-Leistung String 2 | Watt | 1080 |
| `kostal/inverter/status` | Online/Offline Status | 0/1 | 1 |

## 🔧 Erweiterte Konfiguration

### Kostal-Zugangsdaten finden

1. **IP-Adresse**: Finde die IP deines Kostal-Wechselrichters im Router oder über:
   ```bash
   nmap -sn 192.168.1.0/24 | grep -i kostal
   ```

2. **Zugangsdaten**: Standard-Werte sind meist:
   - Username: `pvserver`
   - Password: `pvwr`
   
   Falls diese nicht funktionieren, prüfe die Dokumentation deines Wechselrichters.

### MQTT-Broker konfigurieren

Für Produktionsumgebung:

```python
MQTT_CONFIG = {
    "host": "192.168.1.100",  # MQTT-Broker IP
    "port": 1883,
    "username": "mqtt_user",   # MQTT-Username
    "password": "mqtt_pass",   # MQTT-Password
    "client_id": "kostal-bridge"
}
```

### Update-Intervall ändern

In `kostal_data_bridge.py`:

```python
# 30 Sekunden warten
await asyncio.sleep(30)  # ← Ändere hier das Intervall
```

## 🐛 Fehlerbehebung

### Kostal-Verbindung fehlgeschlagen

```
Authentifizierung fehlgeschlagen. Überprüfe Username/Password.
```

**Lösung:**
1. Prüfe IP-Adresse des Wechselrichters
2. Teste Zugangsdaten im Browser: `http://192.168.1.100`
3. Prüfe Netzwerkverbindung

### MQTT-Verbindung fehlgeschlagen

```
Fehler beim Verbinden mit MQTT: [Errno 61] Connection refused
```

**Lösung:**
1. Starte MQTT-Broker: `brew services start mosquitto`
2. Prüfe MQTT-Konfiguration
3. Teste MQTT-Verbindung: `mosquitto_pub -h localhost -t test -m "hello"`

### Keine Daten vom Kostal

```
Keine Daten vom Kostal-Wechselrichter erhalten
```

**Lösung:**
1. Prüfe Kostal-Verbindung
2. Teste manuell: `python3 -c "from pykoplenti import ApiClient; print('Test')"`
3. Prüfe Wechselrichter-Status

## 📱 Homebridge-Plugin konfigurieren

Dein Homebridge-Plugin muss die MQTT-Topics abonnieren:

```json
{
  "platform": "KostalInverter",
  "name": "Kostal Solar",
  "mqtt": {
    "host": "localhost",
    "port": 1883,
    "topics": {
      "power": "kostal/inverter/power",
      "energy": "kostal/inverter/energy_today",
      "status": "kostal/inverter/status",
      "temperature": "kostal/inverter/temperature"
    }
  }
}
```

## 🔄 Automatischer Start

### Systemd Service (Linux)

Erstelle `/etc/systemd/system/kostal-bridge.service`:

```ini
[Unit]
Description=Kostal Data Bridge
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/homebridge-ahoy-dtu-clean
ExecStart=/usr/bin/python3 kostal_data_bridge.py
Restart=always

[Install]
WantedBy=multi-user.target
```

Aktivieren:
```bash
sudo systemctl enable kostal-bridge
sudo systemctl start kostal-bridge
```

### LaunchAgent (macOS)

Erstelle `~/Library/LaunchAgents/com.kostal.bridge.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.kostal.bridge</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/python3</string>
        <string>/Users/christianbraun/Sync_nextcloud/homebridge-ahoy-dtu-clean/kostal_data_bridge.py</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/Users/christianbraun/Sync_nextcloud/homebridge-ahoy-dtu-clean</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
</dict>
</plist>
```

Laden:
```bash
launchctl load ~/Library/LaunchAgents/com.kostal.bridge.plist
```

## 🎉 Fertig!

Du hast jetzt:
- ✅ Echte Kostal-Daten über Python
- ✅ Automatische MQTT-Weiterleitung
- ✅ Homebridge-Plugin mit echten Daten
- ✅ Echtzeit-Solar-Monitoring in HomeKit

**Dein Kostal-Wechselrichter ist jetzt vollständig in Apple Home integriert!** 🌞🏠
