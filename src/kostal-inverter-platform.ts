import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';
import { KostalInverterAccessory } from './kostal-inverter-accessory';
import * as mqtt from 'mqtt';
import { I18nManager } from './i18n';

export class KostalInverterPlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;
  public readonly accessories: PlatformAccessory[] = [];
  public readonly i18n: I18nManager;

  private mqttClient: mqtt.MqttClient | null = null;
  private deviceData: Map<string, any> = new Map();

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.i18n = new I18nManager(config.language || 'de');
    
    this.log.info(this.i18n.t('platform.initialized', 'Kostal Inverter Platform initialisiert'));

    // Homebridge Event Handlers
    this.api.on('didFinishLaunching', () => {
      this.log.debug('Homebridge startete - initialisiere Kostal Inverter');
      this.initializeMQTT();
      this.discoverDevices();
    });

    this.api.on('shutdown', () => {
      this.cleanup();
    });
  }

  /**
   * MQTT-Verbindung initialisieren
   */
  private initializeMQTT(): void {
    const mqttConfig = this.config.mqtt || {};
    
    if (!mqttConfig.host) {
      this.log.error(this.i18n.t('platform.error.mqttHostMissing', 'MQTT Host ist nicht konfiguriert'));
      return;
    }

    const mqttOptions: mqtt.IClientOptions = {
      host: mqttConfig.host,
      port: mqttConfig.port || 1883,
      clientId: mqttConfig.clientId || 'homebridge-kostal',
      clean: true,
      reconnectPeriod: 5000,
      connectTimeout: 30000,
    };

    // Authentifizierung falls konfiguriert
    if (mqttConfig.username && mqttConfig.password) {
      mqttOptions.username = mqttConfig.username;
      mqttOptions.password = mqttConfig.password;
    }

    this.mqttClient = mqtt.connect(mqttOptions);

    this.mqttClient.on('connect', () => {
      this.log.info(this.i18n.t('mqtt.connected', 'MQTT verbunden'));
      this.subscribeToTopics();
    });

    this.mqttClient.on('error', (error) => {
      this.log.error('MQTT Fehler:', error);
    });

    this.mqttClient.on('close', () => {
      this.log.warn(this.i18n.t('mqtt.disconnected', 'MQTT-Verbindung getrennt'));
    });

    this.mqttClient.on('message', (topic, message) => {
      this.handleMQTTMessage(topic, message.toString());
    });
  }

  /**
   * MQTT-Topics abonnieren
   */
  private subscribeToTopics(): void {
    if (!this.mqttClient) return;

    const topics = this.config.mqtt?.topics || {
      power: 'kostal/inverter/power',
      energy: 'kostal/inverter/energy_today',
      status: 'kostal/inverter/status',
      temperature: 'kostal/inverter/temperature',
      voltage: 'kostal/inverter/voltage_ac',
      frequency: 'kostal/inverter/frequency'
    };

    // Hauptwechselrichter Topics
    const mainTopics = [
      topics.power,
      topics.energy,
      topics.status,
      topics.temperature,
      topics.voltage,
      topics.frequency
    ];

    // String Topics (falls konfiguriert)
    const stringCount = this.config.inverter?.strings || 0;
    for (let i = 1; i <= stringCount; i++) {
      mainTopics.push(`kostal/inverter/power_dc${i}`);
      mainTopics.push(`kostal/inverter/voltage_dc${i}`);
      mainTopics.push(`kostal/inverter/current_dc${i}`);
    }

    // Topics abonnieren
    mainTopics.forEach(topic => {
      this.mqttClient!.subscribe(topic, (err) => {
        if (err) {
          this.log.error(this.i18n.t('mqtt.subscribeError', 'Fehler beim Abonnieren von {topic}').replace('{topic}', topic), err);
        } else {
          this.log.debug(this.i18n.t('mqtt.subscribeSuccess', 'Abonniert: {topic}').replace('{topic}', topic));
        }
      });
    });
  }

  /**
   * MQTT-Nachrichten verarbeiten
   */
  private handleMQTTMessage(topic: string, message: string): void {
    try {
      const value = parseFloat(message);
      
      if (isNaN(value)) {
        this.log.warn(this.i18n.t('mqtt.invalidValue', 'Ungültiger Wert für {topic}: {message}')
          .replace('{topic}', topic)
          .replace('{message}', message));
        return;
      }

      // Daten speichern
      this.deviceData.set(topic, value);

      // Accessories aktualisieren
      this.accessories.forEach(accessory => {
        const inverterAccessory = accessory.context.device as KostalInverterAccessory;
        if (inverterAccessory) {
          inverterAccessory.updateValue(topic, value);
        }
      });

      this.log.debug(`MQTT Update: ${topic} = ${value}`);

    } catch (error) {
      this.log.error(this.i18n.t('mqtt.messageError', 'Fehler beim Verarbeiten der MQTT-Nachricht {topic}').replace('{topic}', topic), error);
    }
  }

  /**
   * Geräte entdecken und Accessories erstellen
   */
  private discoverDevices(): void {
    const inverterConfig = this.config.inverter || {};
    
    // Hauptwechselrichter erstellen
    const mainDevice = {
      name: inverterConfig.name || 'Kostal Piko',
      model: inverterConfig.model || 'Piko 10.0',
      serialNumber: inverterConfig.serialNumber || '123456789',
      type: 'main',
      maxPower: inverterConfig.maxPower || 10000,
      maxEnergyPerDay: inverterConfig.maxEnergyPerDay || 20,
      topics: this.config.mqtt?.topics || {}
    };

    this.createAccessory(mainDevice);

    // String-Accessories erstellen (falls konfiguriert)
    const stringCount = inverterConfig.strings || 0;
    for (let i = 1; i <= stringCount; i++) {
      const stringDevice = {
        name: `String ${i}`,
        model: `${inverterConfig.model || 'Piko'} String ${i}`,
        serialNumber: `${inverterConfig.serialNumber || '123456789'}-S${i}`,
        type: 'string',
        stringNumber: i,
        topics: {
          power: `kostal/inverter/power_dc${i}`,
          voltage: `kostal/inverter/voltage_dc${i}`,
          current: `kostal/inverter/current_dc${i}`
        }
      };

      this.createAccessory(stringDevice);
    }
  }

  /**
   * Accessory erstellen oder aus Cache laden
   */
  private createAccessory(device: any): void {
    const uuid = this.api.hap.uuid.generate(device.serialNumber);
    const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);

    if (existingAccessory) {
      this.log.info(this.i18n.t('accessory.loaded', 'Accessory aus Cache geladen:'), device.name);
      existingAccessory.context.device = device;
      this.api.updatePlatformAccessories([existingAccessory]);
    } else {
      this.log.info(this.i18n.t('accessory.created', 'Neues Accessory erstellt:'), device.name);
      const accessory = new this.api.platformAccessory(device.name, uuid);
      accessory.context.device = device;
      this.accessories.push(accessory);
      this.api.registerPlatformAccessories('homebridge-kostal-inverter', 'KostalInverter', [accessory]);
    }

    // Accessory-Instanz erstellen
    new KostalInverterAccessory(this, this.accessories.find(a => a.UUID === uuid)!);
  }

  /**
   * Accessory aus Cache konfigurieren
   */
  configureAccessory(accessory: PlatformAccessory): void {
    this.log.info(this.i18n.t('accessory.restored', 'Accessory aus Cache wiederhergestellt:'), accessory.displayName);
    this.accessories.push(accessory);
  }

  /**
   * Aufräumen beim Beenden
   */
  private cleanup(): void {
    if (this.mqttClient) {
      this.mqttClient.end();
      this.mqttClient = null;
    }
  }
}
