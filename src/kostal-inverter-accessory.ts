import { API, Logger, PlatformAccessory, Service, Characteristic } from 'homebridge';
import { KostalInverterPlatform } from './kostal-inverter-platform';

export class KostalInverterAccessory {
  private powerService: Service | undefined;
  private temperatureService: Service | undefined;
  private energyService: Service | undefined;
  private statusService: Service | undefined;
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
    // Hauptleistung als Outlet Service (Solar Power Generator)
    this.powerService = this.accessory.getService('Solar Power Generator') ||
      this.accessory.addService(this.platform.Service.Outlet, 'Solar Power Generator', 'solar-power');
    
    this.powerService.setCharacteristic(this.platform.Characteristic.Name, 'Solar Power Generator');
    this.powerService.setCharacteristic(this.platform.Characteristic.On, false);
    this.powerService.setCharacteristic(this.platform.Characteristic.OutletInUse, false);

    // Temperatur Service
    this.temperatureService = this.accessory.getService('Inverter Temperature') ||
      this.accessory.addService(this.platform.Service.TemperatureSensor, 'Inverter Temperature', 'inverter-temp');
    
    this.temperatureService.setCharacteristic(this.platform.Characteristic.Name, 'Inverter Temperature');
    this.temperatureService.setCharacteristic(this.platform.Characteristic.CurrentTemperature, 20);

    // Tagesenergie als Temperature Sensor (kWh als °C)
    this.energyService = this.accessory.getService('Daily Energy Production') ||
      this.accessory.addService(this.platform.Service.TemperatureSensor, 'Daily Energy Production', 'daily-energy');
    
    this.energyService.setCharacteristic(this.platform.Characteristic.Name, 'Daily Energy Production');
    this.energyService.setCharacteristic(this.platform.Characteristic.CurrentTemperature, 0);

    // Status als Contact Sensor
    this.statusService = this.accessory.getService('Inverter Status') ||
      this.accessory.addService(this.platform.Service.ContactSensor, 'Inverter Status', 'inverter-status');
    
    this.statusService.setCharacteristic(this.platform.Characteristic.Name, 'Inverter Status');
    this.statusService.setCharacteristic(this.platform.Characteristic.ContactSensorState, 
      this.platform.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED);

    // AC-Spannung als Temperature Sensor (Volt als °C)
    this.voltageService = this.accessory.getService('AC Voltage') ||
      this.accessory.addService(this.platform.Service.TemperatureSensor, 'AC Voltage', 'ac-voltage');
    
    this.voltageService.setCharacteristic(this.platform.Characteristic.Name, 'AC Voltage');
    this.voltageService.setCharacteristic(this.platform.Characteristic.CurrentTemperature, 0);
  }

  private createStringServices(): void {
    const stringNumber = this.device.stringNumber;
    
    // DC-Spannung als Temperature Sensor (Volt als °C)
    this.voltageService = this.accessory.getService(`String ${stringNumber} DC Voltage`) ||
      this.accessory.addService(this.platform.Service.TemperatureSensor, `String ${stringNumber} DC Voltage`, `string-${stringNumber}-voltage-${Date.now()}`);
    
    this.voltageService.setCharacteristic(this.platform.Characteristic.Name, `String ${stringNumber} DC Voltage`);
    this.voltageService.setCharacteristic(this.platform.Characteristic.CurrentTemperature, 0);

    // DC-Strom als Temperature Sensor (Ampere als °C)
    this.currentService = this.accessory.getService(`String ${stringNumber} DC Current`) ||
      this.accessory.addService(this.platform.Service.TemperatureSensor, `String ${stringNumber} DC Current`, `string-${stringNumber}-current-${Date.now()}`);
    
    this.currentService.setCharacteristic(this.platform.Characteristic.Name, `String ${stringNumber} DC Current`);
    this.currentService.setCharacteristic(this.platform.Characteristic.CurrentTemperature, 0);

    // DC-Leistung als Outlet Service
    this.powerService = this.accessory.getService(`String ${stringNumber} DC Power`) ||
      this.accessory.addService(this.platform.Service.Outlet, `String ${stringNumber} DC Power`, `string-${stringNumber}-power-${Date.now()}`);
    
    this.powerService.setCharacteristic(this.platform.Characteristic.Name, `String ${stringNumber} DC Power`);
    this.powerService.setCharacteristic(this.platform.Characteristic.On, false);
    this.powerService.setCharacteristic(this.platform.Characteristic.OutletInUse, false);
  }

  private createGenericServices(): void {
    // Fallback für unbekannte Gerätetypen
    this.powerService = this.accessory.getService('Power Generator') ||
      this.accessory.addService(this.platform.Service.Outlet, 'Power Generator', 'power');
    
    this.powerService.setCharacteristic(this.platform.Characteristic.Name, 'Power Generator');
    this.powerService.setCharacteristic(this.platform.Characteristic.On, false);
    this.powerService.setCharacteristic(this.platform.Characteristic.OutletInUse, false);
  }

  private setupEventHandlers(): void {
    // Event Handler für Outlet Services
    this.powerService?.getCharacteristic(this.platform.Characteristic.On)
      .on('get', (callback) => {
        const power = this.currentValues.get('power') || 0;
        const isOn = power > 0;
        callback(null, isOn);
      });

    this.powerService?.getCharacteristic(this.platform.Characteristic.OutletInUse)
      .on('get', (callback) => {
        const power = this.currentValues.get('power') || 0;
        const inUse = power > 0;
        callback(null, inUse);
      });

    // Event Handler für Temperatur
    this.temperatureService?.getCharacteristic(this.platform.Characteristic.CurrentTemperature)
      .on('get', (callback) => {
        const value = this.currentValues.get('temperature') || 20;
        callback(null, value);
      });

    // Event Handler für Energie (Temperature Sensor)
    this.energyService?.getCharacteristic(this.platform.Characteristic.CurrentTemperature)
      .on('get', (callback) => {
        const value = this.currentValues.get('energy_today') || 0;
        // kWh zu °C konvertieren (1 kWh = 1°C)
        const tempValue = value;
        callback(null, tempValue);
      });

    // Event Handler für Status
    this.statusService?.getCharacteristic(this.platform.Characteristic.ContactSensorState)
      .on('get', (callback) => {
        const status = this.currentValues.get('status') || 0;
        const state = status > 0 ? 
          this.platform.Characteristic.ContactSensorState.CONTACT_DETECTED :
          this.platform.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED;
        callback(null, state);
      });

    // Event Handler für Spannung (Temperature Sensor)
    this.voltageService?.getCharacteristic(this.platform.Characteristic.CurrentTemperature)
      .on('get', (callback) => {
        const value = this.currentValues.get('voltage_ac') || this.currentValues.get(`voltage_dc${this.device.stringNumber}`) || 0;
        // Volt zu °C konvertieren (1 V = 1°C)
        const tempValue = value;
        callback(null, tempValue);
      });

    // Event Handler für Strom (Temperature Sensor)
    this.currentService?.getCharacteristic(this.platform.Characteristic.CurrentTemperature)
      .on('get', (callback) => {
        const value = this.currentValues.get(`current_dc${this.device.stringNumber}`) || 0;
        // Ampere zu °C konvertieren (1 A = 1°C)
        const tempValue = value;
        callback(null, tempValue);
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
        const isOn = data.power > 0;
        this.powerService?.updateCharacteristic(this.platform.Characteristic.On, isOn);
        this.powerService?.updateCharacteristic(this.platform.Characteristic.OutletInUse, isOn);
      }
      
      if (data.temperature !== undefined) {
        this.currentValues.set('temperature', data.temperature);
        this.temperatureService?.updateCharacteristic(this.platform.Characteristic.CurrentTemperature, data.temperature);
      }
      
      if (data.energy_today !== undefined) {
        this.currentValues.set('energy_today', data.energy_today);
        // kWh zu °C konvertieren (1 kWh = 1°C)
        const tempValue = data.energy_today;
        this.energyService?.updateCharacteristic(this.platform.Characteristic.CurrentTemperature, tempValue);
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
        const tempValue = data.voltage_ac;
        this.voltageService?.updateCharacteristic(this.platform.Characteristic.CurrentTemperature, tempValue);
      }
      
    } else if (deviceType === 'string') {
      // String-Daten
      const stringNumber = this.device.stringNumber;
      
      if (data[`voltage_dc${stringNumber}`] !== undefined) {
        this.currentValues.set(`voltage_dc${stringNumber}`, data[`voltage_dc${stringNumber}`]);
        const tempValue = data[`voltage_dc${stringNumber}`];
        this.voltageService?.updateCharacteristic(this.platform.Characteristic.CurrentTemperature, tempValue);
      }
      
      if (data[`current_dc${stringNumber}`] !== undefined) {
        this.currentValues.set(`current_dc${stringNumber}`, data[`current_dc${stringNumber}`]);
        const tempValue = data[`current_dc${stringNumber}`];
        this.currentService?.updateCharacteristic(this.platform.Characteristic.CurrentTemperature, tempValue);
      }
      
      if (data[`power_dc${stringNumber}`] !== undefined) {
        this.currentValues.set(`power_dc${stringNumber}`, data[`power_dc${stringNumber}`]);
        const isOn = data[`power_dc${stringNumber}`] > 0;
        this.powerService?.updateCharacteristic(this.platform.Characteristic.On, isOn);
        this.powerService?.updateCharacteristic(this.platform.Characteristic.OutletInUse, isOn);
      }
    }
  }
}