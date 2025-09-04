import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';
import { KostalEnergyAccessory } from './kostal-energy-accessory';
import * as cron from 'node-cron';

export class KostalEnergyGenerator implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;
  public readonly accessories: PlatformAccessory[] = [];

  private kostalConfig: any = null;
  private dataPollingInterval: NodeJS.Timeout | null = null;
  private logData: any[] = [];

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.log.info('Kostal Solar Energy Generator initialisiert');

    this.api.on('didFinishLaunching', () => {
      this.log.debug('Homebridge startete - initialisiere Kostal Energy Generator');
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
      const kostalConfig = this.config.kostal;
      
      if (kostalConfig && kostalConfig.host) {
        this.kostalConfig = {
          host: kostalConfig.host,
          username: kostalConfig.username || 'pvserver',
          password: kostalConfig.password || 'pvwr',
          autoDetectModel: kostalConfig.autoDetectModel !== false
        };
        this.log.info(`Kostal-Konfiguration geladen: ${kostalConfig.host}`);
        
        // Auto-Erkennung des Modells wenn aktiviert
        if (this.kostalConfig.autoDetectModel) {
          this.detectInverterModel();
        }
      } else {
        this.log.error('Keine Kostal-Konfiguration gefunden. Bitte konfiguriere die Kostal-Verbindung in der Homebridge-UI.');
        return;
      }
    } catch (error) {
      this.log.error('Fehler beim Laden der Kostal-Konfiguration:', error);
    }
  }

  /**
   * Wechselrichter-Modell automatisch erkennen
   */
  private async detectInverterModel(): Promise<void> {
    if (!this.kostalConfig) return;

    try {
      this.log.info('🔍 Erkenne Wechselrichter-Modell automatisch...');
      
      // Python-Script für Auto-Erkennung ausführen
      const { spawn } = require('child_process');
      const pythonScript = require('path').join(__dirname, '../kostal_data_bridge.py');
      
      const python = spawn('python3', [pythonScript, '--detect'], {
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
            const info = JSON.parse(output);
            if (info.model || info.serial_number) {
              this.log.info('✅ Wechselrichter-Modell erkannt:');
              if (info.model) this.log.info(`   Modell: ${info.model}`);
              if (info.serial_number) this.log.info(`   Seriennummer: ${info.serial_number}`);
              if (info.version) this.log.info(`   Version: ${info.version}`);
              if (info.type) this.log.info(`   Typ: ${info.type}`);
            } else {
              this.log.warn('⚠️ Wechselrichter-Modell konnte nicht automatisch erkannt werden');
            }
          } catch (parseError) {
            this.log.error('Fehler beim Parsen der Wechselrichter-Info:', parseError);
          }
        } else if (error) {
          this.log.error('Python-Script Fehler bei Auto-Erkennung:', error);
        }
      });

    } catch (error) {
      this.log.error('Fehler bei der Auto-Erkennung des Wechselrichter-Modells:', error);
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
   * Kostal-Daten abrufen und loggen
   */
  private async fetchKostalData(): Promise<void> {
    if (!this.kostalConfig) return;

    try {
      // Python-Script ausführen um echte Daten zu bekommen
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
            this.logRealData(data);
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
   * Echte Kostal-Daten loggen
   */
  private logRealData(data: any): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      data: {
        power: data.power || 0,
        energy_today: data.energy_today || 0,
        energy_total: data.energy_total || 0,
        temperature: data.temperature || 0,
        voltage_ac: data.voltage_ac || 0,
        frequency: data.frequency || 0,
        status: data.status || 0,
        voltage_dc1: data.voltage_dc1 || 0,
        voltage_dc2: data.voltage_dc2 || 0,
        current_dc1: data.current_dc1 || 0,
        current_dc2: data.current_dc2 || 0,
        power_dc1: data.power_dc1 || 0,
        power_dc2: data.power_dc2 || 0
      }
    };

    // Log-Eintrag speichern
    this.logData.push(logEntry);
    
    // Nur die letzten 100 Einträge behalten
    if (this.logData.length > 100) {
      this.logData = this.logData.slice(-100);
    }

    // Detailliertes Logging
    this.log.info('=== ECHTE KOSTAL-DATEN ===');
    this.log.info(`Zeitstempel: ${timestamp}`);
    this.log.info(`Leistung: ${data.power || 0} W`);
    this.log.info(`Tagesenergie: ${data.energy_today || 0} kWh`);
    this.log.info(`Gesamtenergie: ${data.energy_total || 0} kWh`);
    this.log.info(`Temperatur: ${data.temperature || 0} °C`);
    this.log.info(`AC-Spannung: ${data.voltage_ac || 0} V`);
    this.log.info(`Netzfrequenz: ${data.frequency || 0} Hz`);
    this.log.info(`Status: ${data.status || 0} (${data.status > 0 ? 'Online' : 'Offline'})`);
    this.log.info(`DC-String 1: ${data.voltage_dc1 || 0}V, ${data.current_dc1 || 0}A, ${data.power_dc1 || 0}W`);
    this.log.info(`DC-String 2: ${data.voltage_dc2 || 0}V, ${data.current_dc2 || 0}A, ${data.power_dc2 || 0}W`);
    this.log.info('========================');
  }

  /**
   * Kostal-Daten verarbeiten und Accessories aktualisieren
   */
  private processKostalData(data: any): void {
    // Accessories aktualisieren
    this.accessories.forEach(accessory => {
      const energyAccessory = accessory.context.device as KostalEnergyAccessory;
      if (energyAccessory) {
        energyAccessory.updateData(data);
      }
    });
  }

  /**
   * Geräte entdecken und Accessories erstellen
   */
  private discoverDevices(): void {
    const inverterConfig = this.config.inverter || {};
    
    // Haupt-Energieerzeuger erstellen
    const mainDevice = {
      name: inverterConfig.name || 'Kostal Solar Generator',
      model: inverterConfig.model || 'Plenticore 10.0',
      serialNumber: inverterConfig.serialNumber || '123456789',
      type: 'main',
      maxPower: inverterConfig.maxPower || 10000,
      maxEnergyPerDay: inverterConfig.maxEnergyPerDay || 20
    };

    this.createAccessory(mainDevice);
  }

  /**
   * Accessory erstellen oder aus Cache laden
   */
  private createAccessory(device: any): void {
    const uuid = this.api.hap.uuid.generate(device.serialNumber);
    const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);

    if (existingAccessory) {
      this.log.info('Accessory aus Cache geladen:', device.name);
      existingAccessory.context.device = device;
      this.api.updatePlatformAccessories([existingAccessory]);
    } else {
      this.log.info('Neues Accessory erstellt:', device.name);
      const accessory = new this.api.platformAccessory(device.name, uuid);
      accessory.context.device = device;
      this.accessories.push(accessory);
      this.api.registerPlatformAccessories('homebridge-kostal-inverter', 'KostalEnergyGenerator', [accessory]);
    }

    // Accessory-Instanz erstellen
    new KostalEnergyAccessory(this, this.accessories.find(a => a.UUID === uuid)!);
  }

  /**
   * Accessory aus Cache konfigurieren
   */
  configureAccessory(accessory: PlatformAccessory): void {
    this.log.info('Accessory aus Cache wiederhergestellt:', accessory.displayName);
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
