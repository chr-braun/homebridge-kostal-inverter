import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';
import { KostalEnergyAccessory } from './kostal-energy-accessory';

interface KostalConfig {
  host: string;
  username?: string;
  password?: string;
  autoDetectModel?: boolean;
}

interface InverterConfig {
  name?: string;
  model?: string;
  serialNumber?: string;
  maxPower?: number;
  maxEnergyPerDay?: number;
}

interface KostalData {
  power?: number;
  energy_today?: number;
  energy_total?: number;
  temperature?: number;
  voltage_ac?: number;
  frequency?: number;
  status?: number;
  voltage_dc1?: number;
  voltage_dc2?: number;
  current_dc1?: number;
  current_dc2?: number;
  power_dc1?: number;
  power_dc2?: number;
}

interface DeviceInfo {
  name: string;
  model: string;
  serialNumber: string;
  type: string;
  maxPower?: number;
  maxEnergy?: number;
  maxEnergyPerDay?: number;
}

interface LogEntry {
  timestamp: string;
  data: KostalData;
}

export class KostalEnergyGenerator implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;
  public readonly accessories: PlatformAccessory[] = [];

  private kostalConfig: KostalConfig | null = null;
  private dataPollingInterval: ReturnType<typeof setInterval> | null = null;
  private logData: LogEntry[] = [];
  private energyAccessories: Map<string, KostalEnergyAccessory> = new Map();
  private pollingInterval: number = 30; // Default 30 seconds, now configurable

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.log.info('Kostal Solar Energy Generator initialisiert');

    // Load polling interval from config
    this.pollingInterval = Math.max(10, Math.min(300, this.config.pollingInterval || 30)); // Clamp between 10-300s

    // Child Bridge Support
    if (this.config.childBridge) {
      this.log.info('Plugin läuft als Child Bridge');
    }

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
        
        // Auto-Erkennung entfernt - funktioniert nicht zuverlässig
      } else {
        this.log.error('Keine Kostal-Konfiguration gefunden. Bitte konfiguriere die Kostal-Verbindung in der Homebridge-UI.');
        return;
      }
    } catch (error) {
      this.log.error('Fehler beim Laden der Kostal-Konfiguration:', error);
    }
  }

  // Auto-Erkennung entfernt - funktioniert nicht zuverlässig

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

    // Daten in konfigurierbarem Intervall abrufen
    this.dataPollingInterval = setInterval(() => {
      this.fetchKostalData();
    }, this.pollingInterval * 1000);

    this.log.info(`Daten-Polling gestartet (alle ${this.pollingInterval} Sekunden)`);
  }

  /**
   * Kostal-Daten abrufen und loggen
   */
  private async fetchKostalData(): Promise<void> {
    if (!this.kostalConfig) return;

    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        attempt++;
        this.log.debug(`Versuch ${attempt}/${maxRetries} - Kostal-Daten abrufen`);

        // Python-Script ausführen um echte Daten zu bekommen
        const { spawn } = require('child_process');
        const pythonScript = require('path').join(__dirname, '../kostal_data_bridge.py');

        const python = spawn('python3', [pythonScript, '--get-data'], {
          cwd: process.cwd()
        });

        let output = '';
        let error = '';

        // Timeout für das Script
        const timeout = setTimeout(() => {
          python.kill('SIGTERM');
          this.log.warn('Python-Script-Timeout erreicht, Script beendet');
        }, 10000); // 10 Sekunden Timeout

        python.stdout.on('data', (data: Buffer) => {
          output += data.toString();
        });

        python.stderr.on('data', (data: Buffer) => {
          error += data.toString();
        });

        await new Promise<void>((resolve, reject) => {
          python.on('close', (code: number) => {
            clearTimeout(timeout);
            if (code === 0 && output) {
              try {
                const data = JSON.parse(output);
                this.logRealData(data);
                this.processKostalData(data);
                resolve();
              } catch (parseError) {
                this.log.error('Fehler beim Parsen der Kostal-Daten:', parseError);
                reject(parseError);
              }
            } else {
              const errorMsg = error || `Script exited with code ${code}`;
              this.log.error(`Python-Script Fehler (Versuch ${attempt}):`, errorMsg);
              reject(new Error(errorMsg));
            }
          });

          python.on('error', (err: Error) => {
            clearTimeout(timeout);
            this.log.error(`Spawn-Fehler (Versuch ${attempt}):`, err);
            reject(err);
          });
        });

        // Erfolg - Schleife beenden
        return;

      } catch (error) {
        const err = error as Error;
        this.log.warn(`Versuch ${attempt} fehlgeschlagen:`, err.message);
        if (attempt < maxRetries) {
          // Warte vor nächstem Versuch (exponentielles Backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    this.log.error('Alle Versuche fehlgeschlagen - verwende Fallback-Daten');
    // Fallback: Leere Daten senden, um Accessories zu aktualisieren
    this.processKostalData({
      power: 0,
      energy_today: 0,
      energy_total: 0,
      temperature: 0,
      status: 0
    });
  }

  /**
   * Echte Kostal-Daten loggen
   */
  private logRealData(data: KostalData): void {
    const timestamp = new Date().toISOString();
    const logEntry: LogEntry = {
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

    // Reduziertes Logging - nur bei Änderungen oder alle 10 Minuten
    const shouldLog = this.shouldLogData(data);
    if (shouldLog) {
      this.log.info('=== KOSTAL-DATEN UPDATE ===');
      this.log.info(`Leistung: ${data.power || 0} W`);
      this.log.info(`Tagesenergie: ${data.energy_today || 0} kWh`);
      this.log.info(`Temperatur: ${data.temperature || 0} °C`);
      this.log.info(`Status: ${data.status && data.status > 0 ? 'Online' : 'Offline'}`);
      this.log.info('===========================');
    } else {
      this.log.debug(`Daten aktualisiert: ${data.power || 0}W, ${data.energy_today || 0}kWh`);
    }
  }

  /**
   * Prüfen, ob Daten geloggt werden sollen (nur bei signifikanten Änderungen)
   */
  private shouldLogData(newData: KostalData): boolean {
    if (this.logData.length < 2) return true; // Erstes Mal loggen

    const lastEntry = this.logData[this.logData.length - 1];
    const lastData = lastEntry.data;

    // Logge alle 10 Minuten oder bei signifikanten Änderungen
    const timeDiff = Date.now() - new Date(lastEntry.timestamp).getTime();
    const tenMinutes = 10 * 60 * 1000;

    if (timeDiff > tenMinutes) return true;

    // Signifikante Änderungen (>10% oder >100W)
    const powerChange = Math.abs((newData.power || 0) - (lastData.power || 0));
    const energyChange = Math.abs((newData.energy_today || 0) - (lastData.energy_today || 0));

    return powerChange > 100 || energyChange > 0.1;
  }

  /**
   * Kostal-Daten verarbeiten und Accessories aktualisieren
   */
  private processKostalData(data: KostalData): void {
    // Accessories aktualisieren
    this.energyAccessories.forEach((energyAccessory) => {
      energyAccessory.updateData(data);
    });
  }

  /**
   * Geräte entdecken und Accessories erstellen
   */
  private discoverDevices(): void {
    const inverterConfig: InverterConfig = this.config.inverter || {};
    const baseSerial = inverterConfig.serialNumber || '123456789';
    
    // 1. Solarproduktion (Light Sensor - Watt als Lux)
    const mainDevice = {
      name: 'Solarproduktion',
      model: inverterConfig.model || 'Plenticore 10.0',
      serialNumber: baseSerial,
      type: 'main',
      maxPower: inverterConfig.maxPower || 10000,
      maxEnergyPerDay: inverterConfig.maxEnergyPerDay || 20
    };

    // 2. Hausverbrauch (Motion Sensor - Bewegung = Verbrauch)
    const homePowerDevice = {
      name: 'Hausverbrauch',
      model: inverterConfig.model || 'Plenticore 10.0',
      serialNumber: `${baseSerial}-home`,
      type: 'home_power',
      maxPower: inverterConfig.maxPower || 10000
    };

    // 3. Netzleistung (Occupancy Sensor - Bezug/Einspeisung)
    const gridPowerDevice = {
      name: 'Netzleistung',
      model: inverterConfig.model || 'Plenticore 10.0',
      serialNumber: `${baseSerial}-grid`,
      type: 'grid_power',
      maxPower: inverterConfig.maxPower || 10000
    };

    // 4. Wechselrichter-Temperatur (Temperature Sensor)
    const temperatureDevice = {
      name: 'Wechselrichter Temperatur',
      model: inverterConfig.model || 'Plenticore 10.0',
      serialNumber: `${baseSerial}-temp`,
      type: 'temperature'
    };

    // 5. Tagesenergie (Light Sensor - kWh als Lux)
    const dailyEnergyDevice = {
      name: 'Tagesenergie',
      model: inverterConfig.model || 'Plenticore 10.0',
      serialNumber: `${baseSerial}-daily`,
      type: 'daily_energy',
      maxEnergy: inverterConfig.maxEnergyPerDay || 20
    };

    // 6. Status (Contact Sensor - Online/Offline)
    const statusDevice = {
      name: 'Wechselrichter Status',
      model: inverterConfig.model || 'Plenticore 10.0',
      serialNumber: `${baseSerial}-status`,
      type: 'status'
    };

    // Alle Accessories erstellen
    this.createAccessory(mainDevice);
    this.createAccessory(homePowerDevice);
    this.createAccessory(gridPowerDevice);
    this.createAccessory(temperatureDevice);
    this.createAccessory(dailyEnergyDevice);
    this.createAccessory(statusDevice);

    this.log.info(`✅ ${this.accessories.length} Kostal-Accessories erstellt`);
  }

  /**
   * Accessory erstellen oder aus Cache laden
   */
  private createAccessory(device: DeviceInfo): void {
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

    // Accessory-Instanz erstellen und speichern
    const energyAccessory = new KostalEnergyAccessory(this, this.accessories.find(a => a.UUID === uuid)!);
    this.energyAccessories.set(uuid, energyAccessory);
  }

  /**
   * Accessory aus Cache konfigurieren
   */
  configureAccessory(accessory: PlatformAccessory): void {
    const device = accessory.context.device || {};
    this.log.info('Accessory aus Cache wiederhergestellt:', accessory.displayName, 'type', device.type);

    // nur bekannte Gerätetypen akzeptieren
    const validTypes = ['main','home_power','grid_power','temperature','daily_energy','status'];
    if (device.type && !validTypes.includes(device.type)) {
      this.log.warn('Entferne nicht unterstütztes Accessory aus Cache:', accessory.displayName, device.type);
      this.api.unregisterPlatformAccessories('homebridge-kostal-inverter', 'KostalEnergyGenerator', [accessory]);
      return;
    }

    this.accessories.push(accessory);
    
    // KostalEnergyAccessory-Instanz erstellen und speichern
    const energyAccessory = new KostalEnergyAccessory(this, accessory);
    this.energyAccessories.set(accessory.UUID, energyAccessory);
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
