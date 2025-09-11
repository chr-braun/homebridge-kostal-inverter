#!/usr/bin/env python3
"""
Kostal Data Bridge - Python Script für Kostal Wechselrichter Kommunikation
"""

import requests
import json
import sys
import time
import argparse
from datetime import datetime

class KostalDataBridge:
    def __init__(self, host, username="pvwr", password="pvwr"):
        self.host = host
        self.username = username
        self.password = password
        self.session = requests.Session()
        self.session.auth = (username, password)
        
    def get_data(self):
        """Holt Daten vom Kostal Wechselrichter"""
        try:
            # Kostal API Endpoint
            url = f"http://{self.host}/api/v1/status"
            
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            # Daten in das erwartete Format konvertieren
            result = {
                'timestamp': datetime.now().isoformat(),
                'power': data.get('power', 0),
                'energy_today': data.get('energy_today', 0),
                'energy_total': data.get('energy_total', 0),
                'temperature': data.get('temperature', 0),
                'voltage_ac': data.get('voltage_ac', 0),
                'frequency': data.get('frequency', 0),
                'status': data.get('status', 0),
                'voltage_dc1': data.get('voltage_dc1', 0),
                'current_dc1': data.get('current_dc1', 0),
                'power_dc1': data.get('power_dc1', 0),
                'voltage_dc2': data.get('voltage_dc2', 0),
                'current_dc2': data.get('current_dc2', 0),
                'power_dc2': data.get('power_dc2', 0)
            }
            
            return result
            
        except requests.exceptions.RequestException as e:
            print(f"Fehler bei der API-Anfrage: {e}", file=sys.stderr)
            return None
        except Exception as e:
            print(f"Unerwarteter Fehler: {e}", file=sys.stderr)
            return None

def main():
    parser = argparse.ArgumentParser(description='Kostal Data Bridge')
    parser.add_argument('--host', required=True, help='Kostal Wechselrichter IP')
    parser.add_argument('--username', default='pvwr', help='Benutzername')
    parser.add_argument('--password', default='pvwr', help='Passwort')
    parser.add_argument('--setup', action='store_true', help='Setup-Modus')
    
    args = parser.parse_args()
    
    if args.setup:
        print("Kostal Data Bridge Setup")
        print(f"Host: {args.host}")
        print(f"Username: {args.username}")
        print("Setup abgeschlossen!")
        return
    
    bridge = KostalDataBridge(args.host, args.username, args.password)
    
    while True:
        data = bridge.get_data()
        if data:
            print(json.dumps(data))
        else:
            print(json.dumps({'error': 'Failed to fetch data'}))
        
        time.sleep(30)  # Alle 30 Sekunden

if __name__ == "__main__":
    main()
