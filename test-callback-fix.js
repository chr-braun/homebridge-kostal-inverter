#!/usr/bin/env node

console.log('🧪 Teste Callback-Fix lokal...');

// Simuliere HomeKit Characteristic
class MockCharacteristic {
  constructor(name) {
    this.name = name;
    this.handlers = [];
  }

  on(event, handler) {
    if (event === 'get') {
      this.handlers.push(handler);
    }
    return this;
  }

  // Simuliere mehrfache Aufrufe des Callbacks
  triggerGet() {
    console.log(`\n📡 Teste ${this.name}...`);
    
    this.handlers.forEach((handler, index) => {
      console.log(`  Handler ${index + 1}:`);
      
      let callbackCount = 0;
      const callback = (error, value) => {
        callbackCount++;
        console.log(`    Callback aufgerufen (${callbackCount}x):`, error ? `Error: ${error.message}` : `Value: ${value}`);
        
        if (callbackCount > 1) {
          console.log(`    ❌ PROBLEM: Callback wurde ${callbackCount}x aufgerufen!`);
        } else {
          console.log(`    ✅ OK: Callback wurde nur 1x aufgerufen`);
        }
      };

      try {
        handler(callback);
      } catch (error) {
        console.log(`    ❌ Handler Fehler:`, error.message);
      }
    });
  }
}

// Simuliere Platform
const mockPlatform = {
  Characteristic: {
    CurrentAmbientLightLevel: 'CurrentAmbientLightLevel',
    MotionDetected: 'MotionDetected',
    OccupancyDetected: 'OccupancyDetected',
    CurrentTemperature: 'CurrentTemperature',
    ContactSensorState: 'ContactSensorState'
  }
};

// Simuliere Accessory
class MockAccessory {
  constructor() {
    this.currentValues = new Map();
    this.currentValues.set('power', 1500);
    this.currentValues.set('home_power', 800);
    this.currentValues.set('grid_power', -200);
    this.currentValues.set('temperature', 25);
    this.currentValues.set('energy_today', 12.5);
    this.currentValues.set('status', 1);
    
    this.platform = mockPlatform;
    this.mainService = {
      getCharacteristic: (char) => new MockCharacteristic(char)
    };
    
    this.log = {
      error: (msg, error) => console.log(`    📝 Log: ${msg}`, error?.message || '')
    };
  }

  // Kopiere die Event Handler aus dem echten Code
  setupEventHandlers() {
    const deviceType = 'main';
    
    switch (deviceType) {
      case 'main':
        // Solarproduktion (Watt als Lux)
        this.mainService.getCharacteristic(this.platform.Characteristic.CurrentAmbientLightLevel)
          .on('get', (callback) => {
            // Sofortiger synchroner Callback um Race Conditions zu vermeiden
            setImmediate(() => {
              try {
                const power = this.currentValues.get('power') || 0;
                // Watt zu Lux konvertieren (1 W = 1 Lux)
                const luxValue = Math.max(0.0001, Math.abs(power));
                callback(null, luxValue);
              } catch (error) {
                this.log.error('Fehler beim Abrufen der Solarproduktion:', error);
                callback(error instanceof Error ? error : new Error(String(error)));
              }
            });
          });
        break;
    }
  }
}

// Teste das Plugin
console.log('🚀 Starte lokalen Test...\n');

const accessory = new MockAccessory();
accessory.setupEventHandlers();

// Teste mehrfache Aufrufe
console.log('🔄 Teste mehrfache Callback-Aufrufe...');
accessory.mainService.getCharacteristic('CurrentAmbientLightLevel').triggerGet();
accessory.mainService.getCharacteristic('CurrentAmbientLightLevel').triggerGet();
accessory.mainService.getCharacteristic('CurrentAmbientLightLevel').triggerGet();

console.log('\n✅ Lokaler Test abgeschlossen!');
console.log('💡 Wenn "Callback wurde nur 1x aufgerufen" angezeigt wird, ist der Fix erfolgreich!');
