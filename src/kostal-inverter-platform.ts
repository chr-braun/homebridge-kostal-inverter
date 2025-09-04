import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';
import { KostalInverterAccessory } from './kostal-inverter-accessory';
import { I18nManager } from './i18n';
import * as cron from 'node-cron';

export class KostalInverterPlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;
  public readonly accessories: PlatformAccessory[] = [];
  public readonly i18n: I18nManager;

  private deviceData: Map<string, any> = new Map();
  private kostalConfig: any = null;
  private dataPollingInterval: NodeJS.Timeout | null = null;

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.i18n = new I18nManager(config.language || 'de');
    
    this.log.info(this.i18n.t('platform.initialized', 'Kostal Inverter Platform initialisiert'));

    this.api.on('didFinishLaunching', () => {
      this.log.debug('Homebridge startete - initialisiere Kostal Inverter');
      this.loadKostalConfig();
      this.discoverDevices();
      this.startDataPolling();
    });

    this.api.on('shutdown', () => {
      this.cleanup();
    });
  }

  /**
   * Kostal-Konfiguration laden
   */
  private loadKostalConfig(): void {
    try {
      // Kostal-Konfiguration aus Homebridge-Config laden
      const kostalConfig = this.config.kostal;
      
      if (kostalConfig && kostalConfig.host) {
        this.kostalConfig = {
          kostal: {
            host: kostalConfig.host,
            username: kostalConfig.username || 'pvserver',
            password: kostalConfig.password || 'pvwr'
          }
        };
        this.log.info(`Kostal-Konfiguration geladen: ${kostalConfig.host}`);
      } else {
        this.log.error('Keine Kostal-Konfiguration in der Homebridge-Konfiguration gefunden. Bitte konfiguriere die Kostal-Verbindung in der Homebridge-UI.');
        return;
      }
    } catch (error) {
      this.log.error('Fehler beim Laden der Kostal-Konfiguration:', error);
    }
  }

  /**
   * Daten-Polling starten
   */
  private startDataPolling(): void {
    if (!this.kostalConfig) {
      this.log.error('Keine Kostal-Konfiguration verfügbar');
      return;
    }

    // Sofort Daten abrufen
    this.fetchKostalData();

    // Alle 30 Sekunden Daten abrufen
    this.dataPollingInterval = setInterval(() => {
      this.fetchKostalData();
    }, 30000);

    this.log.info('Daten-Polling gestartet (alle 30 Sekunden)');
  }

  /**
   * Kostal-Daten abrufen
   */
  private async fetchKostalData(): Promise<void> {
    if (!this.kostalConfig) return;

    try {
      // Python-Script ausführen um Daten zu bekommen
      const { spawn } = require('child_process');
      const pythonScript = require('path').join(__dirname, '../kostal_data_bridge.py');
      
      const python = spawn('python3', [pythonScript, '--get-data'], {
        cwd: process.cwd()
      });

      let output = '';
      let error = '';

      python.stdout.on('data', (data: Buffer) => {
        output += data.toString();
      });

      python.stderr.on('data', (data: Buffer) => {
        error += data.toString();
      });

      python.on('close', (code: number) => {
        if (code === 0 && output) {
          try {
            const data = JSON.parse(output);
            this.processKostalData(data);
          } catch (parseError) {
            this.log.error('Fehler beim Parsen der Kostal-Daten:', parseError);
          }
        } else if (error) {
          this.log.error('Python-Script Fehler:', error);
        }
      });

    } catch (error) {
      this.log.error('Fehler beim Abrufen der Kostal-Daten:', error);
    }
  }

  /**
   * Kostal-Daten verarbeiten und Accessories aktualisieren
   */
  private processKostalData(data: any): void {
    // Daten speichern
    Object.keys(data).forEach(key => {
      this.deviceData.set(key, data[key]);
    });

    // Accessories aktualisieren
    this.accessories.forEach(accessory => {
      const inverterAccessory = accessory.context.device as KostalInverterAccessory;
      if (inverterAccessory) {
        inverterAccessory.updateData(data);
      }
    });

    this.log.debug('Kostal-Daten aktualisiert:', data);
  }

  /**
   * Geräte entdecken und Accessories erstellen
   */
  private discoverDevices(): void {
    const inverterConfig = this.config.inverter || {};
    
    // Hauptwechselrichter erstellen
    const mainDevice = {
      name: inverterConfig.name || 'Kostal Plenticore',
      model: inverterConfig.model || 'Plenticore 10.0',
      serialNumber: inverterConfig.serialNumber || '123456789',
      type: 'main',
      maxPower: inverterConfig.maxPower || 10000,
      maxEnergyPerDay: inverterConfig.maxEnergyPerDay || 20
    };

    this.createAccessory(mainDevice);

    // String-Accessories erstellen (falls konfiguriert)
    const stringCount = inverterConfig.strings || 2; // Standard: 2 Strings
    for (let i = 1; i <= stringCount; i++) {
      const stringDevice = {
        name: `String ${i}`,
        model: `${inverterConfig.model || 'Plenticore'} String ${i}`,
        serialNumber: `${inverterConfig.serialNumber || '123456789'}-S${i}`,
        type: 'string',
        stringNumber: i
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
    if (this.dataPollingInterval) {
      clearInterval(this.dataPollingInterval);
      this.dataPollingInterval = null;
    }
  }
}