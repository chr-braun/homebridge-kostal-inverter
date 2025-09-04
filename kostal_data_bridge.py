#!/usr/bin/env python3
"""
Kostal Data Bridge - Python Script für echte Kostal-Wechselrichter Daten
Verbindet pykoplenti mit MQTT für Homebridge-Plugin
"""

import asyncio
import json
import logging
import time
import sys
import os
from datetime import datetime
from typing import Dict, Any

try:
    import paho.mqtt.client as mqtt
    from pykoplenti import ApiClient, AuthenticationError
except ImportError as e:
    print(f"❌ Fehlende Dependencies: {e}")
    print("📦 Installiere Dependencies mit: pip3 install -r requirements.txt")
    sys.exit(1)

# Konfiguration
KOSTAL_CONFIG = {
    "host": "192.168.1.100",  # IP-Adresse deines Kostal-Wechselrichters
    "username": "pvserver",   # Standard-Username für Kostal
    "password": "pvwr",       # Standard-Password für Kostal
}

MQTT_CONFIG = {
    "host": "localhost",      # MQTT-Broker (localhost wenn Mosquitto lokal läuft)
    "port": 1883,
    "username": None,         # Optional
    "password": None,         # Optional
    "client_id": "kostal-bridge"
}

# MQTT Topics (müssen mit deinem Homebridge-Plugin übereinstimmen)
MQTT_TOPICS = {
    "power": "kostal/inverter/power",
    "energy_today": "kostal/inverter/energy_today", 
    "energy_total": "kostal/inverter/energy_total",
    "status": "kostal/inverter/status",
    "temperature": "kostal/inverter/temperature",
    "voltage_ac": "kostal/inverter/voltage_ac",
    "frequency": "kostal/inverter/frequency",
    "voltage_dc1": "kostal/inverter/voltage_dc1",
    "voltage_dc2": "kostal/inverter/voltage_dc2",
    "current_dc1": "kostal/inverter/current_dc1",
    "current_dc2": "kostal/inverter/current_dc2",
    "power_dc1": "kostal/inverter/power_dc1",
    "power_dc2": "kostal/inverter/power_dc2",
}

# Logging konfigurieren
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class KostalDataBridge:
    def __init__(self):
        self.kostal_client = None
        self.mqtt_client = None
        self.running = False
        
    async def initialize_kostal(self):
        """Kostal API-Client initialisieren"""
        try:
            self.kostal_client = ApiClient(KOSTAL_CONFIG["host"])
            await self.kostal_client.login(KOSTAL_CONFIG["username"], KOSTAL_CONFIG["password"])
            logger.info(f"Erfolgreich mit Kostal-Wechselrichter verbunden: {KOSTAL_CONFIG['host']}")
            return True
        except AuthenticationError:
            logger.error("Authentifizierung fehlgeschlagen. Überprüfe Username/Password.")
            return False
        except Exception as e:
            logger.error(f"Fehler beim Verbinden mit Kostal: {e}")
            return False
    
    def initialize_mqtt(self):
        """MQTT-Client initialisieren"""
        self.mqtt_client = mqtt.Client(MQTT_CONFIG["client_id"])
        
        if MQTT_CONFIG["username"] and MQTT_CONFIG["password"]:
            self.mqtt_client.username_pw_set(MQTT_CONFIG["username"], MQTT_CONFIG["password"])
        
        self.mqtt_client.on_connect = self.on_mqtt_connect
        self.mqtt_client.on_disconnect = self.on_mqtt_disconnect
        
        try:
            self.mqtt_client.connect(MQTT_CONFIG["host"], MQTT_CONFIG["port"], 60)
            self.mqtt_client.loop_start()
            return True
        except Exception as e:
            logger.error(f"Fehler beim Verbinden mit MQTT: {e}")
            return False
    
    def on_mqtt_connect(self, client, userdata, flags, rc):
        if rc == 0:
            logger.info("Erfolgreich mit MQTT-Broker verbunden")
        else:
            logger.error(f"MQTT-Verbindung fehlgeschlagen: {rc}")
    
    def on_mqtt_disconnect(self, client, userdata, rc):
        logger.warning("MQTT-Verbindung getrennt")
    
    def publish_mqtt(self, topic: str, value: Any):
        """Wert über MQTT publizieren"""
        if self.mqtt_client and self.mqtt_client.is_connected():
            try:
                payload = str(value)
                self.mqtt_client.publish(topic, payload, qos=1, retain=True)
                logger.debug(f"MQTT: {topic} = {payload}")
            except Exception as e:
                logger.error(f"Fehler beim MQTT-Publish: {e}")
    
    async def get_kostal_data(self) -> Dict[str, Any]:
        """Daten vom Kostal-Wechselrichter abrufen"""
        if not self.kostal_client:
            return {}
        
        try:
            # Prozessdaten abrufen
            process_data = await self.kostal_client.get_process_data()
            
            # Daten extrahieren und mappen
            data = {}
            
            # AC-Leistung (Gesamtleistung)
            if 'P' in process_data:
                data['power'] = float(process_data['P'])
            
            # Tagesenergie
            if 'E-Total' in process_data:
                data['energy_today'] = float(process_data['E-Total'])
            
            # Gesamtenergie (kumulativ)
            if 'E-Total' in process_data:
                data['energy_total'] = float(process_data['E-Total'])
            
            # Wechselrichter-Temperatur
            if 'T-Inverter' in process_data:
                data['temperature'] = float(process_data['T-Inverter'])
            
            # AC-Spannung
            if 'U-AC' in process_data:
                data['voltage_ac'] = float(process_data['U-AC'])
            
            # Netzfrequenz
            if 'f-AC' in process_data:
                data['frequency'] = float(process_data['f-AC'])
            
            # DC-String 1 Daten
            if 'U-DC-1' in process_data:
                data['voltage_dc1'] = float(process_data['U-DC-1'])
            if 'I-DC-1' in process_data:
                data['current_dc1'] = float(process_data['I-DC-1'])
            if 'P-DC-1' in process_data:
                data['power_dc1'] = float(process_data['P-DC-1'])
            
            # DC-String 2 Daten
            if 'U-DC-2' in process_data:
                data['voltage_dc2'] = float(process_data['U-DC-2'])
            if 'I-DC-2' in process_data:
                data['current_dc2'] = float(process_data['I-DC-2'])
            if 'P-DC-2' in process_data:
                data['power_dc2'] = float(process_data['P-DC-2'])
            
            # Status bestimmen
            if data.get('power', 0) > 0:
                data['status'] = 1  # Online/Produziert
            else:
                data['status'] = 0  # Offline/Nicht produziert
            
            return data
            
        except Exception as e:
            logger.error(f"Fehler beim Abrufen der Kostal-Daten: {e}")
            return {}
    
    async def run_bridge(self):
        """Hauptschleife - Daten abrufen und über MQTT senden"""
        logger.info("Starte Kostal Data Bridge...")
        
        # Initialisierung
        if not await self.initialize_kostal():
            return
        
        if not self.initialize_mqtt():
            return
        
        self.running = True
        logger.info("Bridge läuft - sende Daten alle 30 Sekunden...")
        
        try:
            while self.running:
                # Daten vom Kostal-Wechselrichter abrufen
                data = await self.get_kostal_data()
                
                if data:
                    # Daten über MQTT senden
                    for key, value in data.items():
                        if key in MQTT_TOPICS:
                            self.publish_mqtt(MQTT_TOPICS[key], value)
                    
                    logger.info(f"Daten gesendet: {len(data)} Werte")
                else:
                    logger.warning("Keine Daten vom Kostal-Wechselrichter erhalten")
                
                # 30 Sekunden warten
                await asyncio.sleep(30)
                
        except KeyboardInterrupt:
            logger.info("Bridge wird beendet...")
        except Exception as e:
            logger.error(f"Unerwarteter Fehler: {e}")
        finally:
            self.cleanup()
    
    def cleanup(self):
        """Aufräumen beim Beenden"""
        self.running = False
        if self.mqtt_client:
            self.mqtt_client.disconnect()
        if self.kostal_client:
            asyncio.create_task(self.kostal_client.logout())
        logger.info("Bridge beendet")

def setup_config():
    """Interaktive Konfiguration"""
    print("🔧 Kostal Data Bridge Setup")
    print("==========================")
    print()
    
    # Kostal-Konfiguration
    print("📡 Kostal-Wechselrichter Konfiguration:")
    host = input(f"IP-Adresse [{KOSTAL_CONFIG['host']}]: ").strip() or KOSTAL_CONFIG['host']
    username = input(f"Username [{KOSTAL_CONFIG['username']}]: ").strip() or KOSTAL_CONFIG['username']
    password = input(f"Password [{KOSTAL_CONFIG['password']}]: ").strip() or KOSTAL_CONFIG['password']
    
    # MQTT-Konfiguration
    print("\n📡 MQTT-Broker Konfiguration:")
    mqtt_host = input(f"MQTT Host [{MQTT_CONFIG['host']}]: ").strip() or MQTT_CONFIG['host']
    mqtt_port = input(f"MQTT Port [{MQTT_CONFIG['port']}]: ").strip() or str(MQTT_CONFIG['port'])
    mqtt_username = input(f"MQTT Username (optional): ").strip()
    mqtt_password = input(f"MQTT Password (optional): ").strip()
    
    # Konfiguration speichern
    config = {
        "kostal": {
            "host": host,
            "username": username,
            "password": password
        },
        "mqtt": {
            "host": mqtt_host,
            "port": int(mqtt_port),
            "username": mqtt_username if mqtt_username else None,
            "password": mqtt_password if mqtt_password else None
        }
    }
    
    with open("kostal_config.json", "w") as f:
        json.dump(config, f, indent=2)
    
    print("\n✅ Konfiguration gespeichert in kostal_config.json")
    print("🚀 Starte die Bridge mit: python3 kostal_data_bridge.py")

def load_config():
    """Lade Konfiguration aus Datei"""
    if os.path.exists("kostal_config.json"):
        with open("kostal_config.json", "r") as f:
            config = json.load(f)
            return config["kostal"], config["mqtt"]
    return KOSTAL_CONFIG, MQTT_CONFIG

async def main():
    """Hauptfunktion"""
    # Konfiguration laden
    kostal_config, mqtt_config = load_config()
    
    # Globale Konfiguration aktualisieren
    global KOSTAL_CONFIG, MQTT_CONFIG
    KOSTAL_CONFIG.update(kostal_config)
    MQTT_CONFIG.update(mqtt_config)
    
    bridge = KostalDataBridge()
    await bridge.run_bridge()

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--setup":
        setup_config()
    elif len(sys.argv) > 1 and sys.argv[1] == "--get-data":
        # Einmalige Datenabfrage für Homebridge
        async def get_single_data():
            kostal_config, mqtt_config = load_config()
            global KOSTAL_CONFIG, MQTT_CONFIG
            KOSTAL_CONFIG.update(kostal_config)
            MQTT_CONFIG.update(mqtt_config)
            
            bridge = KostalDataBridge()
            if await bridge.initialize_kostal():
                data = await bridge.get_kostal_data()
                print(json.dumps(data))
            else:
                print(json.dumps({}))
        
        try:
            asyncio.run(get_single_data())
        except Exception as e:
            print(json.dumps({"error": str(e)}))
    else:
        print("Kostal Data Bridge für Homebridge-Plugin")
        print("========================================")
        print(f"Kostal Host: {KOSTAL_CONFIG['host']}")
        print(f"MQTT Broker: {MQTT_CONFIG['host']}:{MQTT_CONFIG['port']}")
        print("Drücke Ctrl+C zum Beenden")
        print()
        
        try:
            asyncio.run(main())
        except KeyboardInterrupt:
            print("\nBridge beendet.")
