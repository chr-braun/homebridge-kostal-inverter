#!/usr/bin/env python3
"""
Kostal Data Bridge - Python Script für Kostal Wechselrichter Kommunikation
Verwendet pykoplenti für professionelle Kostal-API-Integration
"""

import asyncio
import json
import sys
import time
import argparse
from datetime import datetime
import aiohttp
from pykoplenti import ExtendedApiClient

class KostalDataBridge:
    def __init__(self, host, username="pvserver", password="pvwr"):
        self.host = host
        self.username = username
        self.password = password
        self.client = None
        self.session = None
        
    async def get_data(self):
        """Holt Daten vom Kostal Wechselrichter mit pykoplenti"""
        try:
            # Erstelle aiohttp Session
            self.session = aiohttp.ClientSession()
            
            # Erstelle ExtendedApiClient
            self.client = ExtendedApiClient(self.session, self.host)
            
            # Login zum Wechselrichter (key = password)
            await self.client.login(key=self.password)
            
            # Hole alle verfügbaren Process Data (neuer Ansatz)
            process_data_map = await self.client.get_process_data()
            
            # Debug: Zeige verfügbare Process Data Map
            if len(sys.argv) > 1 and '--debug' in sys.argv:
                print(f"DEBUG: Process Data Map: {dict(process_data_map)}", file=sys.stderr)
            
            if not process_data_map:
                print("Keine Process Data verfügbar", file=sys.stderr)
                # Fallback: Grundlegende Struktur zurückgeben
                return {
                    'timestamp': datetime.now().isoformat(),
                    'power': 0,
                    'energy_today': 0,
                    'energy_total': 0,
                    'temperature': 0,
                    'voltage_ac': 0,
                    'frequency': 0,
                    'status': 0,
                    'voltage_dc1': 0,
                    'current_dc1': 0,
                    'power_dc1': 0,
                    'voltage_dc2': 0,
                    'current_dc2': 0,
                    'power_dc2': 0,
                    'ac_power': 0,
                    'grid_power': 0,
                    'battery_soc': 0,
                    'home_consumption': 0
                }
            
            # Hole die aktuellen Werte für alle Module (korrigiert)
            # get_process_data_values erwartet einzelne Module oder spezifische IDs
            all_values = {}
            for module_id, process_ids in process_data_map.items():
                if process_ids:  # Nur Module mit Daten
                    try:
                        module_values = await self.client.get_process_data_values(module_id)
                        all_values[module_id] = module_values[module_id]
                    except Exception as e:
                        if len(sys.argv) > 1 and '--debug' in sys.argv:
                            print(f"DEBUG: Fehler bei Modul {module_id}: {e}", file=sys.stderr)
            
            # Initialisiere Ergebnis-Dictionary mit allen Kostal-Werten
            result = {
                'timestamp': datetime.now().isoformat(),
                # Hauptleistungsdaten
                'power': 0,                    # DC-Gesamtleistung
                'ac_power': 0,                 # AC-Gesamtleistung
                'grid_power': 0,               # Netzleistung (negativ = Einspeisung)
                'home_consumption': 0,         # Hausverbrauch
                'home_own': 0,                 # Eigenverbrauch Solar
                
                # Energiedaten
                'energy_today': 0,             # Tagesertrag in kWh
                'energy_total': 0,             # Gesamtertrag in kWh
                
                # PV-String 1
                'voltage_dc1': 0,              # String 1 Spannung
                'current_dc1': 0,              # String 1 Strom
                'power_dc1': 0,                # String 1 Leistung
                
                # PV-String 2
                'voltage_dc2': 0,              # String 2 Spannung
                'current_dc2': 0,              # String 2 Strom
                'power_dc2': 0,                # String 2 Leistung
                
                # AC-Daten
                'voltage_ac': 0,               # AC-Spannung
                'frequency': 0,                # Netzfrequenz
                
                # Statistiken
                'co2_saving_today': 0,         # CO2-Einsparung heute in kg
                'autarky_today': 0,            # Autarkie heute in %
                'own_consumption_rate': 0,     # Eigenverbrauchsrate in %
                
                # System
                'status': 0                    # Inverter State
            }
            
            # Debug: Zeige verfügbare Werte
            if len(sys.argv) > 1 and '--debug' in sys.argv:
                print(f"DEBUG: All Values Type: {type(all_values)}", file=sys.stderr)
                for module_id, collection in all_values.items():
                    print(f"DEBUG: Module {module_id} Type: {type(collection)}", file=sys.stderr)
                    if hasattr(collection, '__iter__'):
                        print(f"DEBUG: Module {module_id}: {[(pd.id, pd.value, pd.unit) for pd in collection if hasattr(pd, 'id')]}", file=sys.stderr)
            
            # Extrahiere Werte aus allen Modulen
            for module_id, process_data_collection in all_values.items():
                if not process_data_collection:  # Leere Collections überspringen
                    continue
                for data_point in process_data_collection:
                    if not hasattr(data_point, 'value') or not hasattr(data_point, 'id'):
                        continue
                    value = float(data_point.value) if data_point.value is not None else 0
                    data_id = data_point.id.lower()
                    
                    # Präzises Mapping basierend auf echten Kostal-CamelCase-IDs
                    if data_id == 'inverter:state':
                        result['status'] = int(value)  # Inverter State (6 = MPP/Betrieb)
                    elif data_id == 'dc_p':
                        result['power'] = value  # DC-Gesamtleistung
                    elif data_id == 'p' and module_id == 'devices:local:ac':
                        result['ac_power'] = value  # AC-Gesamtleistung
                    elif data_id == 'grid_p':
                        result['grid_power'] = value  # Netzleistung (negativ = Einspeisung)
                    elif data_id == 'home_p':
                        result['home_consumption'] = value  # Hausverbrauch
                    elif data_id == 'homeown_p':
                        result['home_own'] = value  # Eigenverbrauch Solar
                    elif data_id == 'frequency':
                        result['frequency'] = value  # Netzfrequenz
                    
                    # PV-String 1 (devices:local:pv1)
                    elif data_id == 'u' and module_id == 'devices:local:pv1':
                        result['voltage_dc1'] = value  # String 1 Spannung
                    elif data_id == 'i' and module_id == 'devices:local:pv1':
                        result['current_dc1'] = value  # String 1 Strom
                    elif data_id == 'p' and module_id == 'devices:local:pv1':
                        result['power_dc1'] = value  # String 1 Leistung
                    
                    # PV-String 2 (devices:local:pv2)
                    elif data_id == 'u' and module_id == 'devices:local:pv2':
                        result['voltage_dc2'] = value  # String 2 Spannung
                    elif data_id == 'i' and module_id == 'devices:local:pv2':
                        result['current_dc2'] = value  # String 2 Strom
                    elif data_id == 'p' and module_id == 'devices:local:pv2':
                        result['power_dc2'] = value  # String 2 Leistung
                    
                    # AC-Daten (devices:local:ac)
                    elif data_id == 'l1_u' and module_id == 'devices:local:ac':
                        result['voltage_ac'] = value  # AC-Spannung L1
                    
                    # Energiestatistiken (scb:statistic:EnergyFlow)
                    elif data_id == 'statistic:yield:day':
                        result['energy_today'] = value / 1000  # Tagesertrag Wh zu kWh
                    elif data_id == 'statistic:yield:total':
                        result['energy_total'] = value / 1000  # Gesamtertrag Wh zu kWh
                    elif data_id == 'statistic:co2saving:day':
                        result['co2_saving_today'] = value / 1000  # CO2-Einsparung heute in kg
                    elif data_id == 'statistic:autarky:day':
                        result['autarky_today'] = value  # Autarkie heute in %
                    elif data_id == 'statistic:ownconsumptionrate:day':
                        result['own_consumption_rate'] = value  # Eigenverbrauchsrate in %
                    
                    # Debug: Zeige unbekannte IDs
                    elif len(sys.argv) > 1 and '--debug' in sys.argv:
                        print(f"DEBUG: Unbekannte ID: {data_id} = {value} (Modul: {module_id})", file=sys.stderr)
            
            return result
            
        except Exception as e:
            error_msg = str(e)
            print(f"Fehler beim Abrufen der Kostal-Daten: {e}", file=sys.stderr)
            
            # Spezielle Behandlung für bekannte Fehler
            if 'user locked' in error_msg.lower():
                print("HINWEIS: User ist gesperrt. Warte 5 Minuten oder logge dich über das Web-Interface aus.", file=sys.stderr)
            elif 'authentication failed' in error_msg.lower():
                print("HINWEIS: Authentifizierung fehlgeschlagen. Prüfe Username/Password.", file=sys.stderr)
            
            return {
                'error': 'Failed to fetch data',
                'error_detail': error_msg,
                'timestamp': datetime.now().isoformat(),
                # Fallback-Daten für Tests
                'power': 0,
                'ac_power': 0,
                'grid_power': 0,
                'home_consumption': 0,
                'home_own': 0,
                'energy_today': 0,
                'energy_total': 0,
                'voltage_dc1': 0,
                'current_dc1': 0,
                'power_dc1': 0,
                'voltage_dc2': 0,
                'current_dc2': 0,
                'power_dc2': 0,
                'voltage_ac': 0,
                'frequency': 0,
                'co2_saving_today': 0,
                'autarky_today': 0,
                'own_consumption_rate': 0,
                'status': 0
            }
        finally:
            # Ordnungsgemäße Session-Cleanup
            try:
                if self.client:
                    await self.client.logout()
            except Exception as e:
                if len(sys.argv) > 1 and '--debug' in sys.argv:
                    print(f"DEBUG: Logout-Fehler: {e}", file=sys.stderr)
            
            try:
                if self.session and not self.session.closed:
                    await self.session.close()
                    await asyncio.sleep(0.1)  # Kurz warten für ordnungsgemäße Cleanup
            except Exception as e:
                if len(sys.argv) > 1 and '--debug' in sys.argv:
                    print(f"DEBUG: Session-Close-Fehler: {e}", file=sys.stderr)

def main():
    parser = argparse.ArgumentParser(description='Kostal Data Bridge')
    parser.add_argument('--host', help='Kostal Wechselrichter IP')
    parser.add_argument('--username', default='pvserver', help='Benutzername')
    parser.add_argument('--password', default='pvwr', help='Passwort')
    parser.add_argument('--setup', action='store_true', help='Setup-Modus')
    parser.add_argument('--test', action='store_true', help='Test-Modus')
    parser.add_argument('--output', choices=['json', 'human'], default='json', help='Ausgabeformat')
    parser.add_argument('--once', action='store_true', help='Nur einmal ausführen (für Homebridge)')
    parser.add_argument('--debug', action='store_true', help='Debug-Modus')
    
    args = parser.parse_args()
    
    if args.test:
        print("✅ Python-Script verfügbar")
        return
    
    if args.setup:
        print("Kostal Data Bridge Setup")
        if args.host:
            print(f"Host: {args.host}")
            print(f"Username: {args.username}")
        print("Setup abgeschlossen!")
        return
        
    if not args.host:
        print("Fehler: --host ist erforderlich", file=sys.stderr)
        sys.exit(1)
    
    bridge = KostalDataBridge(args.host, args.username, args.password)
    
    async def run_bridge():
        if args.once:
            # Nur einmal ausführen (für Homebridge)
            data = await bridge.get_data()
            if data:
                if args.output == 'json':
                    print(json.dumps(data))
                else:
                    if 'error' in data:
                        print(f"Fehler: {data.get('error_detail', data.get('error'))}")
                    else:
                        print(f"Power: {data['power']}W, Energy today: {data['energy_today']}kWh")
            else:
                print(json.dumps({'error': 'Failed to fetch data'}))
        else:
            # Kontinuierlich laufen
            while True:
                data = await bridge.get_data()
                if data:
                    if args.output == 'json':
                        print(json.dumps(data))
                    else:
                        print(f"Power: {data['power']}W, Energy today: {data['energy_today']}kWh")
                else:
                    print(json.dumps({'error': 'Failed to fetch data'}))
                
                await asyncio.sleep(30)  # Alle 30 Sekunden
    
    # Führe async function aus
    asyncio.run(run_bridge())

if __name__ == "__main__":
    main()
