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
        // Haupt-Energieerzeuger als Outlet Service
        this.mainService = this.accessory.getService(deviceName) ||
          this.accessory.addService(this.platform.Service.Outlet, deviceName, serviceId);
        
        this.mainService.setCharacteristic(this.platform.Characteristic.Name, deviceName);
        this.mainService.setCharacteristic(this.platform.Characteristic.On, false);
        this.mainService.setCharacteristic(this.platform.Characteristic.OutletInUse, false);
        break;

      case 'home_power':
        // Hausverbrauch als Outlet Service
        this.mainService = this.accessory.getService(deviceName) ||
          this.accessory.addService(this.platform.Service.Outlet, deviceName, serviceId);
        
        this.mainService.setCharacteristic(this.platform.Characteristic.Name, deviceName);
        this.mainService.setCharacteristic(this.platform.Characteristic.On, false);
        this.mainService.setCharacteristic(this.platform.Characteristic.OutletInUse, false);
        break;

      case 'grid_power':
        // Netzleistung als Outlet Service (positiv = Bezug, negativ = Einspeisung)
        this.mainService = this.accessory.getService(deviceName) ||
          this.accessory.addService(this.platform.Service.Outlet, deviceName, serviceId);
        
        this.mainService.setCharacteristic(this.platform.Characteristic.Name, deviceName);
        this.mainService.setCharacteristic(this.platform.Characteristic.On, false);
        this.mainService.setCharacteristic(this.platform.Characteristic.OutletInUse, false);
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
        // Haupt-Energieerzeuger (Solarproduktion)
        this.mainService.getCharacteristic(this.platform.Characteristic.On)
          .on('get', (callback) => {
            const power = this.currentValues.get('power') || 0;
            const isOn = power > 0;
            callback(null, isOn);
          });

        this.mainService.getCharacteristic(this.platform.Characteristic.OutletInUse)
          .on('get', (callback) => {
            const power = this.currentValues.get('power') || 0;
            const inUse = power > 0;
            callback(null, inUse);
          });
        break;

      case 'home_power':
        // Hausverbrauch
        this.mainService.getCharacteristic(this.platform.Characteristic.On)
          .on('get', (callback) => {
            const homePower = this.currentValues.get('home_power') || 0;
            const isOn = homePower > 0;
            callback(null, isOn);
          });

        this.mainService.getCharacteristic(this.platform.Characteristic.OutletInUse)
          .on('get', (callback) => {
            const homePower = this.currentValues.get('home_power') || 0;
            const inUse = homePower > 0;
            callback(null, inUse);
          });
        break;

      case 'grid_power':
        // Netzleistung (positiv = Bezug, negativ = Einspeisung)
        this.mainService.getCharacteristic(this.platform.Characteristic.On)
          .on('get', (callback) => {
            const gridPower = this.currentValues.get('grid_power') || 0;
            const isOn = Math.abs(gridPower) > 0;
            callback(null, isOn);
          });

        this.mainService.getCharacteristic(this.platform.Characteristic.OutletInUse)
          .on('get', (callback) => {
            const gridPower = this.currentValues.get('grid_power') || 0;
            const inUse = Math.abs(gridPower) > 0;
            callback(null, inUse);
          });
        break;

      case 'temperature':
        // Temperatur
        this.mainService.getCharacteristic(this.platform.Characteristic.CurrentTemperature)
          .on('get', (callback) => {
            const value = this.currentValues.get('temperature') || 20;
            callback(null, value);
          });
        break;

      case 'daily_energy':
        // Tagesenergie (kWh als Lux)
        this.mainService.getCharacteristic(this.platform.Characteristic.CurrentAmbientLightLevel)
          .on('get', (callback) => {
            const value = this.currentValues.get('energy_today') || 0;
            // kWh zu Lux konvertieren (1 kWh = 1000 Lux)
            const luxValue = Math.max(0.0001, value * 1000);
            callback(null, luxValue);
          });
        break;

      case 'status':
        // Status
        this.mainService.getCharacteristic(this.platform.Characteristic.ContactSensorState)
          .on('get', (callback) => {
            const status = this.currentValues.get('status') || 0;
            const state = status > 0 ? 
              this.platform.Characteristic.ContactSensorState.CONTACT_DETECTED :
              this.platform.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED;
            callback(null, state);
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
        // Haupt-Energieerzeuger (Solarproduktion)
        if (data.power !== undefined) {
          this.currentValues.set('power', data.power);
          const isOn = data.power > 0;
          this.mainService.updateCharacteristic(this.platform.Characteristic.On, isOn);
          this.mainService.updateCharacteristic(this.platform.Characteristic.OutletInUse, isOn);
        }
        break;

      case 'home_power':
        // Hausverbrauch
        if (data.home_power !== undefined) {
          this.currentValues.set('home_power', data.home_power);
          const isOn = data.home_power > 0;
          this.mainService.updateCharacteristic(this.platform.Characteristic.On, isOn);
          this.mainService.updateCharacteristic(this.platform.Characteristic.OutletInUse, isOn);
        }
        break;

      case 'grid_power':
        // Netzleistung (positiv = Bezug, negativ = Einspeisung)
        if (data.grid_power !== undefined) {
          this.currentValues.set('grid_power', data.grid_power);
          const isOn = Math.abs(data.grid_power) > 0;
          this.mainService.updateCharacteristic(this.platform.Characteristic.On, isOn);
          this.mainService.updateCharacteristic(this.platform.Characteristic.OutletInUse, isOn);
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
