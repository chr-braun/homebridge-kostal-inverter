import { API, Logger, PlatformAccessory, Service, Characteristic } from 'homebridge';
import { KostalInverterPlatform } from './kostal-inverter-platform';

export class KostalInverterAccessory {
  private service: Service | undefined;
  private temperatureService: Service | undefined;
  private energyService: Service | undefined;
  private statusService: Service | undefined;
  private powerService: Service | undefined;
  private voltageService: Service | undefined;
  private currentService: Service | undefined;

  private currentValues: Map<string, number> = new Map();
  private readonly device: any;
  private readonly log: Logger;

  constructor(
    private readonly platform: KostalInverterPlatform,
    private readonly accessory: PlatformAccessory,
  ) {
    this.device = accessory.context.device;
    this.log = platform.log;

    // Accessory Information Service
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Kostal')
      .setCharacteristic(this.platform.Characteristic.Model, this.device.model || 'Solar Inverter')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, this.device.serialNumber)
      .setCharacteristic(this.platform.Characteristic.FirmwareRevision, '1.0.0');

    this.createServices();
    this.setupEventHandlers();
  }

  private createServices(): void {
    const deviceType = this.device.type;
    
    switch (deviceType) {
      case 'main':
        this.createMainInverterServices();
        break;
      case 'string':
        this.createStringServices();
        break;
      default:
        this.createGenericServices();
    }
  }

  private createMainInverterServices(): void {
    // Hauptleistung als Light Sensor (Lux = Watt)
    this.powerService = this.accessory.getService(this.platform.Service.LightSensor) ||
      this.accessory.addService(this.platform.Service.LightSensor, 'Solar Power', 'solar-power');
    
    this.powerService.setCharacteristic(this.platform.Characteristic.Name, 'Solar Power');
    this.powerService.setCharacteristic(this.platform.Characteristic.CurrentAmbientLightLevel, 0);

    // Temperatur Service
    this.temperatureService = this.accessory.getService(this.platform.Service.TemperatureSensor) ||
      this.accessory.addService(this.platform.Service.TemperatureSensor, 'Inverter Temperature', 'inverter-temp');
    
    this.temperatureService.setCharacteristic(this.platform.Characteristic.Name, 'Inverter Temperature');
    this.temperatureService.setCharacteristic(this.platform.Characteristic.CurrentTemperature, 20);

    // Energie als Humidity Sensor (Feuchtigkeit = kWh)
    this.energyService = this.accessory.getService(this.platform.Service.HumiditySensor) ||
      this.accessory.addService(this.platform.Service.HumiditySensor, 'Daily Energy', 'daily-energy');
    
    this.energyService.setCharacteristic(this.platform.Characteristic.Name, 'Daily Energy');
    this.energyService.setCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity, 0);

    // Status als Contact Sensor
    this.statusService = this.accessory.getService(this.platform.Service.ContactSensor) ||
      this.accessory.addService(this.platform.Service.ContactSensor, 'Inverter Status', 'inverter-status');
    
    this.statusService.setCharacteristic(this.platform.Characteristic.Name, 'Inverter Status');
    this.statusService.setCharacteristic(this.platform.Characteristic.ContactSensorState, 
      this.platform.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED);

    // AC-Spannung als Light Sensor
    this.voltageService = this.accessory.getService('AC Voltage') ||
      this.accessory.addService(this.platform.Service.LightSensor, 'AC Voltage', 'ac-voltage');
    
    this.voltageService.setCharacteristic(this.platform.Characteristic.Name, 'AC Voltage');
    this.voltageService.setCharacteristic(this.platform.Characteristic.CurrentAmbientLightLevel, 0);
  }

  private createStringServices(): void {
    const stringNumber = this.device.stringNumber;
    
    // DC-Spannung als Light Sensor
    this.voltageService = this.accessory.getService(this.platform.Service.LightSensor) ||
      this.accessory.addService(this.platform.Service.LightSensor, `String ${stringNumber} Voltage`, `string-${stringNumber}-voltage`);
    
    this.voltageService.setCharacteristic(this.platform.Characteristic.Name, `String ${stringNumber} Voltage`);
    this.voltageService.setCharacteristic(this.platform.Characteristic.CurrentAmbientLightLevel, 0);

    // DC-Strom als Light Sensor
    this.currentService = this.accessory.getService(`String ${stringNumber} Current`) ||
      this.accessory.addService(this.platform.Service.LightSensor, `String ${stringNumber} Current`, `string-${stringNumber}-current`);
    
    this.currentService.setCharacteristic(this.platform.Characteristic.Name, `String ${stringNumber} Current`);
    this.currentService.setCharacteristic(this.platform.Characteristic.CurrentAmbientLightLevel, 0);

    // DC-Leistung als Light Sensor
    this.powerService = this.accessory.getService(`String ${stringNumber} Power`) ||
      this.accessory.addService(this.platform.Service.LightSensor, `String ${stringNumber} Power`, `string-${stringNumber}-power`);
    
    this.powerService.setCharacteristic(this.platform.Characteristic.Name, `String ${stringNumber} Power`);
    this.powerService.setCharacteristic(this.platform.Characteristic.CurrentAmbientLightLevel, 0);
  }

  private createGenericServices(): void {
    // Fallback für unbekannte Gerätetypen
    this.powerService = this.accessory.getService(this.platform.Service.LightSensor) ||
      this.accessory.addService(this.platform.Service.LightSensor, 'Power', 'power');
    
    this.powerService.setCharacteristic(this.platform.Characteristic.Name, 'Power');
    this.powerService.setCharacteristic(this.platform.Characteristic.CurrentAmbientLightLevel, 0);
  }

  private setupEventHandlers(): void {
    // Event Handler für Characteristic-Updates
    this.powerService?.getCharacteristic(this.platform.Characteristic.CurrentAmbientLightLevel)
      .on('get', (callback) => {
        const value = this.currentValues.get('power') || 0;
        callback(null, value);
      });

    this.temperatureService?.getCharacteristic(this.platform.Characteristic.CurrentTemperature)
      .on('get', (callback) => {
        const value = this.currentValues.get('temperature') || 20;
        callback(null, value);
      });

    this.energyService?.getCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity)
      .on('get', (callback) => {
        const value = this.currentValues.get('energy_today') || 0;
        callback(null, value);
      });

    this.statusService?.getCharacteristic(this.platform.Characteristic.ContactSensorState)
      .on('get', (callback) => {
        const status = this.currentValues.get('status') || 0;
        const state = status > 0 ? 
          this.platform.Characteristic.ContactSensorState.CONTACT_DETECTED :
          this.platform.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED;
        callback(null, state);
      });

    this.voltageService?.getCharacteristic(this.platform.Characteristic.CurrentAmbientLightLevel)
      .on('get', (callback) => {
        const value = this.currentValues.get('voltage_ac') || this.currentValues.get(`voltage_dc${this.device.stringNumber}`) || 0;
        callback(null, value);
      });

    this.currentService?.getCharacteristic(this.platform.Characteristic.CurrentAmbientLightLevel)
      .on('get', (callback) => {
        const value = this.currentValues.get(`current_dc${this.device.stringNumber}`) || 0;
        callback(null, value);
      });
  }

  /**
   * Daten aktualisieren (wird von der Platform aufgerufen)
   */
  updateData(data: any): void {
    // Daten basierend auf Gerätetyp filtern
    const deviceType = this.device.type;
    
    if (deviceType === 'main') {
      // Hauptwechselrichter Daten
      if (data.power !== undefined) {
        this.currentValues.set('power', data.power);
        this.powerService?.updateCharacteristic(this.platform.Characteristic.CurrentAmbientLightLevel, data.power);
      }
      
      if (data.temperature !== undefined) {
        this.currentValues.set('temperature', data.temperature);
        this.temperatureService?.updateCharacteristic(this.platform.Characteristic.CurrentTemperature, data.temperature);
      }
      
      if (data.energy_today !== undefined) {
        this.currentValues.set('energy_today', data.energy_today);
        this.energyService?.updateCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity, data.energy_today);
      }
      
      if (data.status !== undefined) {
        this.currentValues.set('status', data.status);
        const state = data.status > 0 ? 
          this.platform.Characteristic.ContactSensorState.CONTACT_DETECTED :
          this.platform.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED;
        this.statusService?.updateCharacteristic(this.platform.Characteristic.ContactSensorState, state);
      }
      
      if (data.voltage_ac !== undefined) {
        this.currentValues.set('voltage_ac', data.voltage_ac);
        this.voltageService?.updateCharacteristic(this.platform.Characteristic.CurrentAmbientLightLevel, data.voltage_ac);
      }
      
    } else if (deviceType === 'string') {
      // String-Daten
      const stringNumber = this.device.stringNumber;
      
      if (data[`voltage_dc${stringNumber}`] !== undefined) {
        this.currentValues.set(`voltage_dc${stringNumber}`, data[`voltage_dc${stringNumber}`]);
        this.voltageService?.updateCharacteristic(this.platform.Characteristic.CurrentAmbientLightLevel, data[`voltage_dc${stringNumber}`]);
      }
      
      if (data[`current_dc${stringNumber}`] !== undefined) {
        this.currentValues.set(`current_dc${stringNumber}`, data[`current_dc${stringNumber}`]);
        this.currentService?.updateCharacteristic(this.platform.Characteristic.CurrentAmbientLightLevel, data[`current_dc${stringNumber}`]);
      }
      
      if (data[`power_dc${stringNumber}`] !== undefined) {
        this.currentValues.set(`power_dc${stringNumber}`, data[`power_dc${stringNumber}`]);
        this.powerService?.updateCharacteristic(this.platform.Characteristic.CurrentAmbientLightLevel, data[`power_dc${stringNumber}`]);
      }
    }
  }
}