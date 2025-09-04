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

    // Accessory-Informationen setzen
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Kostal')
      .setCharacteristic(this.platform.Characteristic.Model, this.device.model || 'Solar Inverter')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, this.device.serialNumber)
      .setCharacteristic(this.platform.Characteristic.FirmwareRevision, '1.0.0');

    // Services basierend auf Gerätetyp erstellen
    this.createServices();

    // Event-Handler einrichten
    this.setupEventHandlers();
  }


  /**
   * Services basierend auf Gerätetyp erstellen
   */
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

  /**
   * Services für Hauptwechselrichter erstellen
   */
  private createMainInverterServices(): void {
    // Hauptservice (Light Sensor für Leistung)
    this.service = this.accessory.getService(this.platform.Service.LightSensor) ||
      this.accessory.addService(this.platform.Service.LightSensor, this.device.name, 'main');

    // Temperatur-Sensor
    this.temperatureService = this.accessory.getService(this.platform.Service.TemperatureSensor) ||
      this.accessory.addService(this.platform.Service.TemperatureSensor, `${this.device.name} Temperatur`, 'temperature');

    // Energie-Sensor (als Feuchtigkeitssensor für Prozentanzeige)
    this.energyService = this.accessory.getService(this.platform.Service.HumiditySensor) ||
      this.accessory.addService(this.platform.Service.HumiditySensor, `${this.device.name} Tagesenergie`, 'energy');

    // Status-Sensor
    this.statusService = this.accessory.getService(this.platform.Service.ContactSensor) ||
      this.accessory.addService(this.platform.Service.ContactSensor, `${this.device.name} Status`, 'status');

    // Leistung als Light Sensor (für genaue Watt-Anzeige)
    this.powerService = this.accessory.getService(this.platform.Service.LightSensor) ||
      this.accessory.addService(this.platform.Service.LightSensor, `${this.device.name} Leistung`, 'power');

    // Spannung als Light Sensor
    this.voltageService = this.accessory.getService(this.platform.Service.LightSensor) ||
      this.accessory.addService(this.platform.Service.LightSensor, `${this.device.name} Spannung`, 'voltage');
  }

  /**
   * Services für String erstellen
   */
  private createStringServices(): void {
    // String-Service (Light Sensor für Leistung)
    this.service = this.accessory.getService(this.platform.Service.LightSensor) ||
      this.accessory.addService(this.platform.Service.LightSensor, this.device.name, 'string');

    // Spannung als Light Sensor
    this.voltageService = this.accessory.getService(this.platform.Service.LightSensor) ||
      this.accessory.addService(this.platform.Service.LightSensor, `${this.device.name} Spannung`, 'voltage');

    // Strom als Light Sensor
    this.currentService = this.accessory.getService(this.platform.Service.LightSensor) ||
      this.accessory.addService(this.platform.Service.LightSensor, `${this.device.name} Strom`, 'current');
  }

  /**
   * Generische Services erstellen
   */
  private createGenericServices(): void {
    // Fallback: Light Sensor für alle Werte
    this.service = this.accessory.getService(this.platform.Service.LightSensor) ||
      this.accessory.addService(this.platform.Service.LightSensor, this.device.name, 'generic');
  }

  /**
   * Event-Handler einrichten
   */
  private setupEventHandlers(): void {
    // Hauptservice (Leistung)
    if (this.service) {
      this.service.getCharacteristic(this.platform.Characteristic.CurrentAmbientLightLevel)
        .onGet(this.getCurrentValue.bind(this, 'power'));
    }

    // Temperatur-Service
    if (this.temperatureService) {
      this.temperatureService.getCharacteristic(this.platform.Characteristic.CurrentTemperature)
        .onGet(this.getCurrentValue.bind(this, 'temperature'));
    }

    // Energie-Service (als Prozent)
    if (this.energyService) {
      this.energyService.getCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity)
        .onGet(this.getEnergyPercentage.bind(this));
    }

    // Status-Service
    if (this.statusService) {
      this.statusService.getCharacteristic(this.platform.Characteristic.ContactSensorState)
        .onGet(this.getStatusValue.bind(this));
    }

    // Leistung-Service
    if (this.powerService) {
      this.powerService.getCharacteristic(this.platform.Characteristic.CurrentAmbientLightLevel)
        .onGet(this.getCurrentValue.bind(this, 'power'));
    }

    // Spannung-Service
    if (this.voltageService) {
      this.voltageService.getCharacteristic(this.platform.Characteristic.CurrentAmbientLightLevel)
        .onGet(this.getCurrentValue.bind(this, 'voltage'));
    }

    // Strom-Service
    if (this.currentService) {
      this.currentService.getCharacteristic(this.platform.Characteristic.CurrentAmbientLightLevel)
        .onGet(this.getCurrentValue.bind(this, 'current'));
    }
  }

  /**
   * Aktuellen Wert abrufen
   */
  private getCurrentValue(valueType: string): number {
    const value = this.currentValues.get(valueType) || 0;
    this.log.debug(`${this.device.name} ${valueType}: ${value}`);
    return value;
  }

  /**
   * Energie als Prozent berechnen
   */
  private getEnergyPercentage(): number {
    const energyToday = this.currentValues.get('energy') || 0;
    const maxEnergyPerDay = this.device.maxEnergyPerDay || 20;
    const percentage = Math.min((energyToday / maxEnergyPerDay) * 100, 100);
    return Math.round(percentage * 10) / 10; // Auf eine Dezimalstelle runden
  }

  /**
   * Status-Wert abrufen
   */
  private getStatusValue(): number {
    const power = this.currentValues.get('power') || 0;
    // 0 = Contact Detected (Produziert), 1 = Contact Not Detected (Nicht produziert)
    return power > 0 ? 0 : 1;
  }

  /**
   * Wert aktualisieren
   */
  public updateValue(topic: string, value: number): void {
    // Finde den entsprechenden Wert basierend auf dem Topic
    const deviceTopics = this.device.topics || {};
    let valueType = '';

    for (const [key, topicValue] of Object.entries(deviceTopics)) {
      if (topicValue === topic) {
        valueType = key;
        break;
      }
    }

    // Fallback: Topic direkt als Werttyp verwenden
    if (!valueType) {
      if (topic.includes('power')) {
        valueType = 'power';
      } else if (topic.includes('energy')) {
        valueType = 'energy';
      } else if (topic.includes('temperature')) {
        valueType = 'temperature';
      } else if (topic.includes('voltage')) {
        valueType = 'voltage';
      } else if (topic.includes('current')) {
        valueType = 'current';
      } else if (topic.includes('status')) {
        valueType = 'status';
      }
    }

    if (valueType) {
      this.currentValues.set(valueType, value);
      this.log.debug(this.platform.i18n.t('accessory.updateValue', '{name} {type}: {value}')
        .replace('{name}', this.device.name)
        .replace('{type}', valueType)
        .replace('{value}', value.toString()));

      // HomeKit-Characteristics aktualisieren
      this.updateHomeKitValue(valueType, value);
    }
  }

  /**
   * HomeKit-Characteristic aktualisieren
   */
  private updateHomeKitValue(valueType: string, value: number): void {
    try {
      switch (valueType) {
        case 'power':
          if (this.service) {
            this.service.updateCharacteristic(this.platform.Characteristic.CurrentAmbientLightLevel, value);
          }
          if (this.powerService) {
            this.powerService.updateCharacteristic(this.platform.Characteristic.CurrentAmbientLightLevel, value);
          }
          break;

        case 'energy':
          if (this.energyService) {
            const percentage = this.getEnergyPercentage();
            this.energyService.updateCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity, percentage);
          }
          break;

        case 'temperature':
          if (this.temperatureService) {
            this.temperatureService.updateCharacteristic(this.platform.Characteristic.CurrentTemperature, value);
          }
          break;

        case 'voltage':
          if (this.voltageService) {
            this.voltageService.updateCharacteristic(this.platform.Characteristic.CurrentAmbientLightLevel, value);
          }
          break;

        case 'current':
          if (this.currentService) {
            this.currentService.updateCharacteristic(this.platform.Characteristic.CurrentAmbientLightLevel, value);
          }
          break;

        case 'status':
          if (this.statusService) {
            const statusValue = this.getStatusValue();
            this.statusService.updateCharacteristic(this.platform.Characteristic.ContactSensorState, statusValue);
          }
          break;
      }
    } catch (error) {
      this.log.error(`Fehler beim Aktualisieren der HomeKit-Characteristic für ${valueType}:`, error);
    }
  }
}
