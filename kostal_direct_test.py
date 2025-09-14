#!/usr/bin/env python3
"""
Direkter Test der Kostal-API ohne pykoplenti
"""

import asyncio
import aiohttp
import json
import sys

async def direct_kostal_test():
    """Teste direkte API-Aufrufe an den Kostal-Wechselrichter"""
    
    # Kostal API Basis-URL
    base_url = "http://192.168.178.71"
    
    async with aiohttp.ClientSession() as session:
        try:
            # 1. Auth-Start mit Nonce
            auth_start_url = f"{base_url}/api/v1/auth/start"
            auth_data = {
                "username": "pvserver",
                "password": "xucqa9-hexsaX-vyfqyr",
                "nonce": "12345678901234567890123456789012"  # 32-char nonce
            }
            
            print("🔑 Teste Authentifizierung...")
            async with session.post(auth_start_url, json=auth_data) as response:
                auth_result = await response.json()
                print(f"Auth Response: {response.status} - {auth_result}")
                
                if response.status == 200:
                    # 2. Teste verfügbare Endpunkte
                    endpoints = [
                        "/api/v1/measurements",
                        "/api/v1/processdata", 
                        "/api/v1/measurements/live",
                        "/api/v1/info/system",
                        "/api/v1/info/version"
                    ]
                    
                    for endpoint in endpoints:
                        try:
                            url = f"{base_url}{endpoint}"
                            print(f"\n📊 Teste Endpunkt: {endpoint}")
                            async with session.get(url) as ep_response:
                                if ep_response.status == 200:
                                    data = await ep_response.json()
                                    print(f"✅ {endpoint}: {json.dumps(data, indent=2)[:200]}...")
                                else:
                                    print(f"❌ {endpoint}: {ep_response.status}")
                        except Exception as e:
                            print(f"❌ {endpoint}: Fehler - {e}")
                
        except Exception as e:
            print(f"❌ Verbindungsfehler: {e}")

if __name__ == "__main__":
    asyncio.run(direct_kostal_test())

