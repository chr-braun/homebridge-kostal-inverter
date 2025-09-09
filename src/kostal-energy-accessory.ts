import { API, Logger, PlatformAccessory, Service, Characteristic } from 'homebridge';
import { KostalEnergyGenerator } from './kostal-energy-generator';

export class KostalEnergyAccessory {
  private mainService: Service | undefined;
  private currentValues: Map<string, number> = new Map();
  private readonly device: any;
  private readonly log: Logger;

  constructor(
    private readonly platform: KostalEnergyGenerator,
    private readonly accessory: PlatformAccessory,
  ) {
    this.device = accessory.context.device;
    this.log = platform.log;

    // Accessory Information Service
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Kostal')
      .setCharacteristic(this.platform.Characteristic.Model, this.device.model || 'Solar Energy Generator')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, this.device.serialNumber)
      .setCharacteristic(this.platform.Characteristic.FirmwareRevision, '2.0.0');

    this.createServices();
    this.setupEventHandlers();
  }

  private createServices(): void {
    const deviceType = this.device.type;
    const deviceName = this.device.name;
    const serviceId = `${deviceType}-${Date.now()}`;

    switch (deviceType) {
      case 'main':
        // Solarproduktion als Light Sensor (Watt als Lux)
        this.mainService = this.accessory.getService(deviceName) ||
          this.accessory.addService(this.platform.Service.LightSensor, deviceName, serviceId);
        
        this.mainService.setCharacteristic(this.platform.Characteristic.Name, deviceName);
        this.mainService.setCharacteristic(this.platform.Characteristic.CurrentAmbientLightLevel, 0.0001);
        break;

      case 'home_power':
        // Hausverbrauch als Motion Sensor (Bewegung = Verbrauch)
        this.mainService = this.accessory.getService(deviceName) ||
          this.accessory.addService(this.platform.Service.MotionSensor, deviceName, serviceId);
        
        this.mainService.setCharacteristic(this.platform.Characteristic.Name, deviceName);
        this.mainService.setCharacteristic(this.platform.Characteristic.MotionDetected, false);
        break;

      case 'grid_power':
        // Netzleistung als Occupancy Sensor (Bezug/Einspeisung)
        this.mainService = this.accessory.getService(deviceName) ||
          this.accessory.addService(this.platform.Service.OccupancySensor, deviceName, serviceId);
        
        this.mainService.setCharacteristic(this.platform.Characteristic.Name, deviceName);
        this.mainService.setCharacteristic(this.platform.Characteristic.OccupancyDetected, 
          this.platform.Characteristic.OccupancyDetected.OCCUPANCY_NOT_DETECTED);
        break;

      case 'temperature':
        // Temperatur als Temperature Sensor
        this.mainService = this.accessory.getService(deviceName) ||
          this.accessory.addService(this.platform.Service.TemperatureSensor, deviceName, serviceId);
        
        this.mainService.setCharacteristic(this.platform.Characteristic.Name, deviceName);
        this.mainService.setCharacteristic(this.platform.Characteristic.CurrentTemperature, 20);
        break;

      case 'daily_energy':
        // Tagesenergie als Light Sensor (kWh als Lux)
        this.mainService = this.accessory.getService(deviceName) ||
          this.accessory.addService(this.platform.Service.LightSensor, deviceName, serviceId);
        
        this.mainService.setCharacteristic(this.platform.Characteristic.Name, deviceName);
        this.mainService.setCharacteristic(this.platform.Characteristic.CurrentAmbientLightLevel, 0.0001);
        break;

      case 'status':
        // Status als Contact Sensor
        this.mainService = this.accessory.getService(deviceName) ||
          this.accessory.addService(this.platform.Service.ContactSensor, deviceName, serviceId);
        
        this.mainService.setCharacteristic(this.platform.Characteristic.Name, deviceName);
        this.mainService.setCharacteristic(this.platform.Characteristic.ContactSensorState, 
          this.platform.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED);
        break;

      default:
        this.log.warn(`Unbekannter Gerätetyp: ${deviceType}`);
    }
  }

  private setupEventHandlers(): void {
    if (!this.mainService) return;

    const deviceType = this.device.type;

    switch (deviceType) {
      case 'main':
        // Solarproduktion (Watt als Lux)
        this.mainService.getCharacteristic(this.platform.Characteristic.CurrentAmbientLightLevel)
          .on('get', (callback) => {
            let callbackCalled = false;
            const safeCallback = (error: any, value?: any) => {
              if (!callbackCalled) {
                callbackCalled = true;
                callback(error, value);
              }
            };
            
            try {
              const power = this.currentValues.get('power') || 0;
              // Watt zu Lux konvertieren (1 W = 1 Lux)
              const luxValue = Math.max(0.0001, Math.abs(power));
              safeCallback(null, luxValue);
            } catch (error) {
              this.log.error('Fehler beim Abrufen der Solarproduktion:', error);
              safeCallback(error instanceof Error ? error : new Error(String(error)));
            }
          });
        break;

      case 'home_power':
        // Hausverbrauch (Bewegung = Verbrauch)
        this.mainService.getCharacteristic(this.platform.Characteristic.MotionDetected)
          .on('get', (callback) => {
            let callbackCalled = false;
            const safeCallback = (error: any, value?: any) => {
              if (!callbackCalled) {
                callbackCalled = true;
                callback(error, value);
              }
            };
            
            try {
              const homePower = this.currentValues.get('home_power') || 0;
              const motionDetected = homePower > 0;
              safeCallback(null, motionDetected);
            } catch (error) {
              this.log.error('Fehler beim Abrufen des Hausverbrauchs:', error);
              safeCallback(error instanceof Error ? error : new Error(String(error)));
            }
          });
        break;

      case 'grid_power':
        // Netzleistung (Bezug/Einspeisung)
        this.mainService.getCharacteristic(this.platform.Characteristic.OccupancyDetected)
          .on('get', (callback) => {
            let callbackCalled = false;
            const safeCallback = (error: any, value?: any) => {
              if (!callbackCalled) {
                callbackCalled = true;
                callback(error, value);
              }
            };
            
            try {
              const gridPower = this.currentValues.get('grid_power') || 0;
              const occupancyDetected = Math.abs(gridPower) > 0;
              safeCallback(null, occupancyDetected ? 
                this.platform.Characteristic.OccupancyDetected.OCCUPANCY_DETECTED :
                this.platform.Characteristic.OccupancyDetected.OCCUPANCY_NOT_DETECTED);
            } catch (error) {
              this.log.error('Fehler beim Abrufen der Netzleistung:', error);
              safeCallback(error instanceof Error ? error : new Error(String(error)));
            }
          });
        break;

      case 'temperature':
        // Temperatur
        this.mainService.getCharacteristic(this.platform.Characteristic.CurrentTemperature)
          .on('get', (callback) => {
            let callbackCalled = false;
            const safeCallback = (error: any, value?: any) => {
              if (!callbackCalled) {
                callbackCalled = true;
                callback(error, value);
              }
            };
            
            try {
              const value = this.currentValues.get('temperature') || 20;
              safeCallback(null, value);
            } catch (error) {
              this.log.error('Fehler beim Abrufen der Temperatur:', error);
              safeCallback(error instanceof Error ? error : new Error(String(error)));
            }
          });
        break;

      case 'daily_energy':
        // Tagesenergie (kWh als Lux)
        this.mainService.getCharacteristic(this.platform.Characteristic.CurrentAmbientLightLevel)
          .on('get', (callback) => {
            let callbackCalled = false;
            const safeCallback = (error: any, value?: any) => {
              if (!callbackCalled) {
                callbackCalled = true;
                callback(error, value);
              }
            };
            
            try {
              const value = this.currentValues.get('energy_today') || 0;
              // kWh zu Lux konvertieren (1 kWh = 1000 Lux)
              const luxValue = Math.max(0.0001, value * 1000);
              safeCallback(null, luxValue);
            } catch (error) {
              this.log.error('Fehler beim Abrufen der Tagesenergie:', error);
              safeCallback(error instanceof Error ? error : new Error(String(error)));
            }
          });
        break;

      case 'status':
        // Status
        this.mainService.getCharacteristic(this.platform.Characteristic.ContactSensorState)
          .on('get', (callback) => {
            let callbackCalled = false;
            const safeCallback = (error: any, value?: any) => {
              if (!callbackCalled) {
                callbackCalled = true;
                callback(error, value);
              }
            };
            
            try {
              const status = this.currentValues.get('status') || 0;
              const state = status > 0 ? 
                this.platform.Characteristic.ContactSensorState.CONTACT_DETECTED :
                this.platform.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED;
              safeCallback(null, state);
            } catch (error) {
              this.log.error('Fehler beim Abrufen des Status:', error);
              safeCallback(error instanceof Error ? error : new Error(String(error)));
            }
          });
        break;
    }
  }

  /**
   * Daten aktualisieren (wird von der Platform aufgerufen)
   */
  updateData(data: any): void {
    if (!this.mainService) return;

    const deviceType = this.device.type;

    switch (deviceType) {
      case 'main':
        // Solarproduktion (Watt als Lux)
        if (data.power !== undefined) {
          this.currentValues.set('power', data.power);
          const luxValue = Math.max(0.0001, Math.abs(data.power));
          this.mainService.updateCharacteristic(this.platform.Characteristic.CurrentAmbientLightLevel, luxValue);
        }
        break;

      case 'home_power':
        // Hausverbrauch (Bewegung = Verbrauch)
        if (data.home_power !== undefined) {
          this.currentValues.set('home_power', data.home_power);
          const motionDetected = data.home_power > 0;
          this.mainService.updateCharacteristic(this.platform.Characteristic.MotionDetected, motionDetected);
        }
        break;

      case 'grid_power':
        // Netzleistung (Bezug/Einspeisung)
        if (data.grid_power !== undefined) {
          this.currentValues.set('grid_power', data.grid_power);
          const occupancyDetected = Math.abs(data.grid_power) > 0;
          this.mainService.updateCharacteristic(this.platform.Characteristic.OccupancyDetected, 
            occupancyDetected ? 
              this.platform.Characteristic.OccupancyDetected.OCCUPANCY_DETECTED :
              this.platform.Characteristic.OccupancyDetected.OCCUPANCY_NOT_DETECTED);
        }
        break;

      case 'temperature':
        // Temperatur
        if (data.temperature !== undefined) {
          this.currentValues.set('temperature', data.temperature);
          this.mainService.updateCharacteristic(this.platform.Characteristic.CurrentTemperature, data.temperature);
        }
        break;

      case 'daily_energy':
        // Tagesenergie (kWh als Lux)
        if (data.energy_today !== undefined) {
          this.currentValues.set('energy_today', data.energy_today);
          const luxValue = Math.max(0.0001, data.energy_today * 1000);
          this.mainService.updateCharacteristic(this.platform.Characteristic.CurrentAmbientLightLevel, luxValue);
        }
        break;

      case 'status':
        // Status
        if (data.status !== undefined) {
          this.currentValues.set('status', data.status);
          const state = data.status > 0 ? 
            this.platform.Characteristic.ContactSensorState.CONTACT_DETECTED :
            this.platform.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED;
          this.mainService.updateCharacteristic(this.platform.Characteristic.ContactSensorState, state);
        }
        break;
    }
  }
}
