#!/usr/bin/env python3
"""
Kostal Data Bridge - Python Script für echte Kostal-Wechselrichter Daten
Verbindet pykoplenti direkt mit Homebridge-Plugin
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
    from pykoplenti import ApiClient
except ImportError as e:
    print(f"❌ Fehlende Dependencies: {e}")
    print("📦 Installiere Dependencies mit: pip3 install pykoplenti")
    sys.exit(1)

# Konfiguration
KOSTAL_CONFIG = {
    "host": "192.168.178.71",  # IP-Adresse deines Kostal-Wechselrichters
    "username": "pvserver",   # Standard-Username für Kostal
    "password": "pny6F0y9tC7qXnQ",       # Dein echtes Passwort
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
        self.session = None

    async def initialize_kostal(self) -> bool:
        """Kostal-Wechselrichter initialisieren"""
        try:
            # Erstelle eine aiohttp-Session für pykoplenti mit SSL-Ignorierung
            import aiohttp
            
            # SSL-Verifikation deaktivieren für selbst-signierte Zertifikate
            connector = aiohttp.TCPConnector(ssl=False)
            self.session = aiohttp.ClientSession(connector=connector)
            
            # Korrekte pykoplenti-API-Verwendung: ApiClient(session, host)
            self.kostal_client = ApiClient(self.session, KOSTAL_CONFIG['host'])
            await self.kostal_client.login(KOSTAL_CONFIG['password'])
            logger.info(f"✅ Erfolgreich mit Kostal-Wechselrichter verbunden: {KOSTAL_CONFIG['host']}")
            return True
        except Exception as e:
            if "authentication" in str(e).lower() or "login" in str(e).lower():
                logger.error(f"❌ Authentifizierung fehlgeschlagen für {KOSTAL_CONFIG['host']}")
            else:
                logger.error(f"❌ Fehler beim Verbinden mit Kostal-Wechselrichter: {e}")
            return False

    async def get_inverter_info(self) -> Dict[str, Any]:
        """Wechselrichter-Informationen abrufen für Auto-Erkennung"""
        if not self.kostal_client:
            return {}
        
        try:
            # Geräteinformationen abrufen
            device_info = await self.kostal_client.get_process_data_values('devices:local', [
                'Inverter:State',
                'Inverter:SerialNumber',
                'Inverter:Model',
                'Inverter:Version',
                'Inverter:Type'
            ])
            
            device_local = device_info.get('devices:local', {})
            info = {}
            
            if 'Inverter:SerialNumber' in device_local:
                info['serial_number'] = device_local['Inverter:SerialNumber'].value
            if 'Inverter:Model' in device_local:
                info['model'] = device_local['Inverter:Model'].value
            if 'Inverter:Version' in device_local:
                info['version'] = device_local['Inverter:Version'].value
            if 'Inverter:Type' in device_local:
                info['type'] = device_local['Inverter:Type'].value
            
            return info
            
        except Exception as e:
            logger.error(f"❌ Fehler beim Abrufen der Wechselrichter-Info: {e}")
            return {}

    async def get_kostal_data(self) -> Dict[str, Any]:
        """Daten vom Kostal-Wechselrichter abrufen"""
        if not self.kostal_client:
            return {}
        
        try:
            # Prozessdaten abrufen mit korrekter pykoplenti-API
            process_data = await self.kostal_client.get_process_data_values('devices:local', [
                'Inverter:State',
                'Home_P',           # Hausverbrauch
                'P',                # Gesamtleistung des Wechselrichters
                'P_AC',             # AC-Leistung (Produktion)
                'P_DC',             # DC-Leistung (von Solarpanels)
                'E-Total',          # Gesamtenergie
                'E-Today',          # Heutige Energie
                'T-Inverter',       # Wechselrichter-Temperatur
                'U-AC',             # AC-Spannung
                'f-AC',             # Netzfrequenz
                'U-DC-1',           # DC-String 1 Spannung
                'I-DC-1',           # DC-String 1 Strom
                'P-DC-1',           # DC-String 1 Leistung
                'U-DC-2',           # DC-String 2 Spannung
                'I-DC-2',           # DC-String 2 Strom
                'P-DC-2',           # DC-String 2 Leistung
                'Inverter:State',   # Wechselrichter-Status
                'Grid_P',           # Netzleistung (positiv = Einspeisung, negativ = Bezug)
                'Battery_P'         # Batterieleistung
            ])
            
            # Daten extrahieren und mappen
            data = {}
            device_local = process_data.get('devices:local', {})
            
            # Wechselrichter-Status
            inverter_state = device_local.get('Inverter:State', {}).value if 'Inverter:State' in device_local else 0
            data['inverter_state'] = inverter_state
            
            # AC-Leistung (Produktion) - das ist die tatsächliche Solarproduktion
            if 'P_AC' in device_local:
                ac_power = float(device_local['P_AC'].value)
                data['ac_power'] = ac_power
                data['power'] = ac_power  # Für HomeKit: positive Werte = Produktion
            elif 'P' in device_local:
                # Fallback auf Gesamtleistung
                total_power = float(device_local['P'].value)
                data['total_power'] = total_power
                data['power'] = total_power
            else:
                # Wenn keine direkte Produktionsleistung verfügbar, verwende Grid_P
                if 'Grid_P' in device_local:
                    grid_power = float(device_local['Grid_P'].value)
                    data['power'] = -grid_power  # Umkehrung: negativ = Produktion, positiv = Verbrauch
            
            # DC-Leistung (von Solarpanels)
            if 'P_DC' in device_local:
                dc_power = float(device_local['P_DC'].value)
                data['dc_power'] = dc_power
            
            # Netzleistung (Grid_P: positiv = Bezug vom Netz, negativ = Einspeisung ins Netz)
            if 'Grid_P' in device_local:
                grid_power = float(device_local['Grid_P'].value)
                data['grid_power'] = grid_power
                data['is_producing'] = grid_power < 0  # Produziert wenn negativ (Einspeisung)
                data['is_consuming'] = grid_power > 0  # Verbraucht wenn positiv (Bezug)
            
            # Hausverbrauch
            if 'Home_P' in device_local:
                home_power = float(device_local['Home_P'].value)
                data['home_power'] = home_power
            
            # Batterieleistung
            if 'Battery_P' in device_local:
                battery_power = float(device_local['Battery_P'].value)
                data['battery_power'] = battery_power
            
            # Tagesenergie
            if 'E-Today' in device_local:
                data['energy_today'] = float(device_local['E-Today'].value)
            elif 'E-Total' in device_local:
                data['energy_today'] = float(device_local['E-Total'].value)
            
            # Gesamtenergie (kumulativ)
            if 'E-Total' in device_local:
                data['energy_total'] = float(device_local['E-Total'].value)
            
            # Wechselrichter-Temperatur
            if 'T-Inverter' in device_local:
                data['temperature'] = float(device_local['T-Inverter'].value)
            
            # AC-Spannung
            if 'U-AC' in device_local:
                data['voltage_ac'] = float(device_local['U-AC'].value)
            
            # Netzfrequenz
            if 'f-AC' in device_local:
                data['frequency'] = float(device_local['f-AC'].value)
            
            # DC-String 1 Daten
            if 'U-DC-1' in device_local:
                data['voltage_dc1'] = float(device_local['U-DC-1'].value)
            if 'I-DC-1' in device_local:
                data['current_dc1'] = float(device_local['I-DC-1'].value)
            if 'P-DC-1' in device_local:
                data['power_dc1'] = float(device_local['P-DC-1'].value)
            
            # DC-String 2 Daten
            if 'U-DC-2' in device_local:
                data['voltage_dc2'] = float(device_local['U-DC-2'].value)
            if 'I-DC-2' in device_local:
                data['current_dc2'] = float(device_local['I-DC-2'].value)
            if 'P-DC-2' in device_local:
                data['power_dc2'] = float(device_local['P-DC-2'].value)
            
            # Status bestimmen
            if data.get('is_producing', False) or data.get('power', 0) > 0:
                data['status'] = 1  # Online/Produziert
            else:
                data['status'] = 0  # Offline/Nicht produziert
            
            return data
            
        except Exception as e:
            logger.error(f"❌ Fehler beim Abrufen der Kostal-Daten: {e}")
            return {}

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
    
    # Konfiguration speichern
    config = {
        "kostal": {
            "host": host,
            "username": username,
            "password": password
        }
    }
    
    with open("kostal_config.json", "w") as f:
        json.dump(config, f, indent=2)
    
    print("\n✅ Konfiguration gespeichert in kostal_config.json")
    print("🚀 Starte die Bridge mit: python3 kostal_data_bridge.py")

def load_config():
    """Lade Konfiguration aus Homebridge-Konfiguration"""
    # Versuche Homebridge-Konfiguration zu laden
    homebridge_config_paths = [
        os.path.expanduser("~/.homebridge/config.json"),
        "/var/lib/homebridge/config.json",
        "/usr/local/etc/homebridge/config.json"
    ]
    
    for config_path in homebridge_config_paths:
        if os.path.exists(config_path):
            try:
                with open(config_path, "r") as f:
                    config = json.load(f)
                    # Suche nach unserer Plattform-Konfiguration
                    if "platforms" in config:
                        for platform in config["platforms"]:
                            if platform.get("platform") == "KostalInverter":
                                kostal_config = platform.get("kostal", {})
                                if kostal_config:
                                    logger.info(f"✅ Kostal-Konfiguration aus Homebridge geladen: {config_path}")
                                    return kostal_config
            except Exception as e:
                logger.warning(f"⚠️ Konnte Homebridge-Konfiguration nicht laden: {e}")
                continue
    
    # Fallback: lokale Konfigurationsdatei
    if os.path.exists("kostal_config.json"):
        with open("kostal_config.json", "r") as f:
            config = json.load(f)
            return config["kostal"]
    
    logger.warning("⚠️ Keine Kostal-Konfiguration gefunden, verwende Standard-Werte")
    return KOSTAL_CONFIG

async def main():
    """Hauptfunktion"""
    # Konfiguration laden
    kostal_config = load_config()
    
    # Globale Konfiguration aktualisieren
    global KOSTAL_CONFIG
    KOSTAL_CONFIG.update(kostal_config)
    
    bridge = KostalDataBridge()
    await bridge.run_bridge()

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--setup":
        setup_config()
    elif len(sys.argv) > 1 and sys.argv[1] == "--get-data":
        # Einmalige Datenabfrage für Homebridge
        async def get_single_data():
            kostal_config = load_config()
            global KOSTAL_CONFIG
            KOSTAL_CONFIG.update(kostal_config)
            
            bridge = KostalDataBridge()
            try:
                if await bridge.initialize_kostal():
                    data = await bridge.get_kostal_data()
                    print(json.dumps(data))
                else:
                    print(json.dumps({}))
            finally:
                # Session schließen
                if bridge.session:
                    await bridge.session.close()
        
        try:
            asyncio.run(get_single_data())
        except Exception as e:
            print(json.dumps({"error": str(e)}))
    elif len(sys.argv) > 1 and sys.argv[1] == "--detect":
        # Auto-Erkennung des Wechselrichter-Typs
        async def detect_inverter():
            kostal_config = load_config()
            global KOSTAL_CONFIG
            KOSTAL_CONFIG.update(kostal_config)
            
            bridge = KostalDataBridge()
            try:
                if await bridge.initialize_kostal():
                    info = await bridge.get_inverter_info()
                    print(json.dumps(info))
                else:
                    print(json.dumps({}))
            finally:
                # Session schließen
                if bridge.session:
                    await bridge.session.close()
        
        try:
            asyncio.run(detect_inverter())
        except Exception as e:
            print(json.dumps({"error": str(e)}))
    else:
        print("Kostal Data Bridge für Homebridge-Plugin")
        print("========================================")
        print(f"Kostal Host: {KOSTAL_CONFIG['host']}")
        print("Drücke Ctrl+C zum Beenden")
        print()
        
        try:
            asyncio.run(main())
        except KeyboardInterrupt:
            print("\nBridge beendet.")