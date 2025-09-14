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
                        values_list = [(pd.id, pd.value, pd.unit) for pd in collection if hasattr(pd, 'id')]
                        print(f"DEBUG: Module {module_id}: {values_list}", file=sys.stderr)
                        if not values_list:  # Wenn leer, teste Einzelwerte
                            print(f"DEBUG: Module {module_id} ist leer, teste Einzelwerte...", file=sys.stderr)
            
            # Korrekte Datenextraktion: Module einzeln abfragen und per Dictionary-Zugriff
            critical_data_map = {
                'devices:local': ['Dc_P', 'Grid_P', 'Home_P', 'HomeOwn_P', 'Inverter:State'],
                'devices:local:ac': ['P', 'Frequency', 'L1_U'],
                'devices:local:pv1': ['P', 'U', 'I'],
                'devices:local:pv2': ['P', 'U', 'I'],
                'scb:statistic:EnergyFlow': ['Statistic:Yield:Day', 'Statistic:Yield:Total', 'Statistic:CO2Saving:Day', 'Statistic:Autarky:Day', 'Statistic:OwnConsumptionRate:Day']
            }
            
            # Hole Werte modul-weise
            for module_id, data_ids in critical_data_map.items():
                try:
                    module_values = await self.client.get_process_data_values({module_id: data_ids})
                    collection = module_values.get(module_id)
                    
                    if collection:
                        for data_id in data_ids:
                            try:
                                data_point = collection[data_id]
                                value = float(data_point.value) if data_point.value is not None else 0
                                
                                # Mapping zu unserem Result-Format
                                if data_id == 'Dc_P':
                                    result['power'] = value
                                elif data_id == 'Grid_P':
                                    result['grid_power'] = value
                                elif data_id == 'Home_P':
                                    result['home_consumption'] = value
                                elif data_id == 'HomeOwn_P':
                                    result['home_own'] = value
                                elif data_id == 'Inverter:State':
                                    result['status'] = int(value)
                                elif data_id == 'P' and module_id == 'devices:local:ac':
                                    result['ac_power'] = value
                                elif data_id == 'Frequency':
                                    result['frequency'] = value
                                elif data_id == 'L1_U':
                                    result['voltage_ac'] = value
                                elif data_id == 'P' and module_id == 'devices:local:pv1':
                                    result['power_dc1'] = value
                                elif data_id == 'U' and module_id == 'devices:local:pv1':
                                    result['voltage_dc1'] = value
                                elif data_id == 'I' and module_id == 'devices:local:pv1':
                                    result['current_dc1'] = value
                                elif data_id == 'P' and module_id == 'devices:local:pv2':
                                    result['power_dc2'] = value
                                elif data_id == 'U' and module_id == 'devices:local:pv2':
                                    result['voltage_dc2'] = value
                                elif data_id == 'I' and module_id == 'devices:local:pv2':
                                    result['current_dc2'] = value
                                elif data_id == 'Statistic:Yield:Day':
                                    result['energy_today'] = value / 1000  # Wh zu kWh
                                elif data_id == 'Statistic:Yield:Total':
                                    result['energy_total'] = value / 1000  # Wh zu kWh
                                elif data_id == 'Statistic:CO2Saving:Day':
                                    result['co2_saving_today'] = value / 1000  # g zu kg
                                elif data_id == 'Statistic:Autarky:Day':
                                    result['autarky_today'] = value
                                elif data_id == 'Statistic:OwnConsumptionRate:Day':
                                    result['own_consumption_rate'] = value
                                
                                if len(sys.argv) > 1 and '--debug' in sys.argv:
                                    print(f"DEBUG: {module_id}:{data_id} = {value}", file=sys.stderr)
                                    
                            except KeyError:
                                if len(sys.argv) > 1 and '--debug' in sys.argv:
                                    print(f"DEBUG: {data_id} nicht verfügbar in {module_id}", file=sys.stderr)
                            except Exception as e:
                                if len(sys.argv) > 1 and '--debug' in sys.argv:
                                    print(f"DEBUG: Fehler bei {module_id}:{data_id}: {e}", file=sys.stderr)
                                
                except Exception as e:
                    if len(sys.argv) > 1 and '--debug' in sys.argv:
                        print(f"DEBUG: Modul {module_id} Fehler: {e}", file=sys.stderr)
            
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
