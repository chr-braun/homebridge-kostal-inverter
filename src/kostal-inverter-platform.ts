import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';
import { KostalInverterAccessory } from './kostal-inverter-accessory';
import { I18nManager } from './i18n';
import * as cron from 'node-cron';
import { exec, spawn } from 'child_process';
import * as path from 'path';

export class KostalInverterPlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;
  public readonly accessories: PlatformAccessory[] = [];
  public readonly i18n: I18nManager;

  private deviceData: Map<string, any> = new Map();
  private kostalConfig: any = null;
  private dataPollingInterval: NodeJS.Timeout | null = null;
  private dailyReportsConfig: any = null;
  private dailyEnergyData: Map<string, number> = new Map();
  private motionSensorAccessory: PlatformAccessory | null = null;
  private cronJob: any = null;
  private pythonProcess: any = null;

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.i18n = new I18nManager(config.language || 'de');
    
    this.log.info(this.i18n.t('platform.initialized', 'Kostal Inverter Platform initialisiert'));

    // Child Bridge Support
    this.log.info(this.i18n.t('kostal.childBridge.configuration', '🔍 Child Bridge Konfiguration: {config}', { config: JSON.stringify(this.config.childBridge) }));
    if (this.config.childBridge === true) {
      this.log.info(this.i18n.t('kostal.childBridge.activated', '🔗 Child Bridge Modus aktiviert'));
      this.setupChildBridge();
    } else {
      this.log.info(this.i18n.t('kostal.childBridge.deactivated', '🔗 Child Bridge Modus deaktiviert'));
    }
    
    this.api.on('didFinishLaunching', () => {
      if (this.config.childBridge) {
        this.log.debug('Child Bridge startete - initialisiere Kostal Inverter');
      } else {
        this.log.debug('Homebridge startete - initialisiere Kostal Inverter');
      }
      this.loadKostalConfig();
      this.loadDailyReportsConfig();
      this.discoverDevices();
      this.initializePythonScript();
      this.startDataPolling();
      this.setupDailyReports();
    });

    this.api.on('shutdown', () => {
      this.cleanup();
    });
  }

  /**
   * Child Bridge Setup
   */
  private setupChildBridge(): void {
    try {
      const fs = require('fs');
      const path = require('path');
      const os = require('os');
      
      this.log.info(this.i18n.t('kostal.childBridge.setupStarted', '🔧 Erstelle Child Bridge Konfiguration...'));
      
      // Child Bridge Konfiguration erstellen
      const childBridgeConfig = {
        bridge: {
          name: `Kostal Solar Bridge ${Math.random().toString(36).substr(2, 9)}`,
          username: this.config.childBridgeUsername || this.generateUsername(),
          port: this.config.childBridgePort || 8581,
          pin: this.config.childBridgePin || this.generatePin(),
          advertiser: 'bonjour-hap'
        },
        accessories: [],
        platforms: [
          {
            platform: 'KostalInverter',
            name: this.config.name || 'Kostal Plenticore',
            inverter: this.config.inverter || {},
            pollingInterval: this.config.pollingInterval || 30,
            pushNotifications: this.config.pushNotifications || {},
            childBridge: false // Child Bridge kann nicht in Child Bridge laufen
          }
        ]
      };

      // Child Bridge Konfigurationsdatei erstellen
      const configDir = path.join(os.homedir(), '.homebridge');
      const childBridgeConfigFile = path.join(configDir, 'kostal-child-bridge.json');
      
      fs.writeFileSync(childBridgeConfigFile, JSON.stringify(childBridgeConfig, null, 2));
      
      this.log.info(this.i18n.t('kostal.childBridge.configCreated', '🔗 Child Bridge Konfiguration erstellt: {file}', { file: childBridgeConfigFile }));
      this.log.info(this.i18n.t('kostal.childBridge.pinGenerated', '📱 Child Bridge PIN: {pin}', { pin: childBridgeConfig.bridge.pin }));
      this.log.info(this.i18n.t('kostal.childBridge.portGenerated', '🌐 Child Bridge Port: {port}', { port: childBridgeConfig.bridge.port }));
      this.log.info(this.i18n.t('kostal.childBridge.setupCompleted', '✅ Child Bridge Setup abgeschlossen'));
      
    } catch (error) {
      this.log.error(this.i18n.t('kostal.childBridge.setupError', '❌ Fehler beim Setup der Child Bridge: {error}', { error: error }));
    }
  }

  /**
   * Generiere zufälligen Username für Child Bridge
   */
  private generateUsername(): string {
    const chars = '0123456789ABCDEF';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
      if (i === 1 || i === 3 || i === 5 || i === 7) {
        result += ':';
      }
    }
    return result;
  }

  /**
   * Generiere zufällige PIN für Child Bridge
   */
  private generatePin(): string {
    const part1 = Math.floor(Math.random() * 900) + 100;
    const part2 = Math.floor(Math.random() * 90) + 10;
    const part3 = Math.floor(Math.random() * 900) + 100;
    return `${part1}-${part2}-${part3}`;
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
            password: kostalConfig.password || 'pny6F0y9tC7qXnQ'
          }
        };
        this.log.info(`Kostal-Konfiguration geladen: ${kostalConfig.host}`);
      } else {
        this.log.warn('Keine Kostal-Konfiguration gefunden. Verwende Standard-Werte für Tests.');
        // Fallback für Tests
        this.kostalConfig = {
          kostal: {
            host: '192.168.178.71',
            username: 'pvserver',
            password: 'pny6F0y9tC7qXnQ'
          }
        };
      }
    } catch (error) {
      this.log.error('Fehler beim Laden der Kostal-Konfiguration:', error);
    }
  }

  /**
   * Daily Reports Konfiguration laden
   */
  private loadDailyReportsConfig(): void {
    try {
      this.dailyReportsConfig = this.config.dailyReports || {};
      
      if (this.dailyReportsConfig.enabled) {
        this.log.info('📈 Tägliche Berichte aktiviert');
        this.log.info(`📅 Berichtszeit: ${this.dailyReportsConfig.reportTime || 'sunset+30'}`);
        this.log.info(`🌐 Sprache: ${this.dailyReportsConfig.language || 'de'}`);
        this.log.info(`📱 Berichtsstil: ${this.dailyReportsConfig.reportStyle || 'motion'}`);
      } else {
        this.log.info('📈 Tägliche Berichte deaktiviert');
      }
    } catch (error) {
      this.log.error('Fehler beim Laden der Daily Reports Konfiguration:', error);
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
    }, 60000);

    this.log.info('Daten-Polling gestartet (alle 60 Sekunden - User-Lock-Schutz)');
  }

  /**
   * Kostal-Daten abrufen
   */
  private async fetchKostalData(): Promise<void> {
    if (!this.kostalConfig) return;

    try {
      this.log.debug('🔄 Starte Daten-Abruf...');
      this.log.debug('🔧 Konfiguration:', this.kostalConfig);
      
      // Direkte Kostal-API-Aufrufe
      const data = await this.fetchAllKostalData();
      this.processKostalData(data);

    } catch (error) {
      this.log.error('Fehler beim Abrufen der Kostal-Daten:', error);
    }
  }

  /**
   * Alle Kostal-Daten über Python-Script abrufen
   * Verwendet ausschließlich das Python-Script für die Kommunikation
   */
  private async fetchAllKostalData(): Promise<any> {
    this.log.debug('🐍 Abrufen der Kostal-Daten über Python-Script...');
    
    return new Promise((resolve, reject) => {
      if (!this.kostalConfig?.kostal?.host) {
        this.log.warn('Keine Kostal-Host-Konfiguration verfügbar');
        resolve(this.getSimulatedKostalData());
        return;
      }

      // Python-Script Pfad
      const scriptPath = path.join(__dirname, '../kostal_data_bridge.py');
      
      // Python-Script mit echten Credentials ausführen (einmal, nicht kontinuierlich)
      const pythonCmd = `python3 "${scriptPath}" --host "${this.kostalConfig.kostal.host}" --username "${this.kostalConfig.kostal.username}" --password "${this.kostalConfig.kostal.password}" --output json --once`;
      
      this.log.debug(`🔄 Führe Python-Script aus: ${pythonCmd}`);
      
      exec(pythonCmd, { timeout: 15000 }, (error, stdout, stderr) => {
        if (error) {
          this.log.error(`Python-Script Fehler: ${error.message}`);
          resolve(this.getSimulatedKostalData());
          return;
        }
        
        if (stderr) {
          this.log.warn(`Python-Script Warnung: ${stderr}`);
        }
        
        try {
          // JSON-Ausgabe vom Python-Script parsen
          const jsonData = JSON.parse(stdout.trim());
          this.log.debug('✅ Python-Script Daten erfolgreich erhalten');
          
          // Daten in das erwartete Format konvertieren
          const formattedData = {
            pythonData: jsonData,
      timestamp: new Date().toISOString()
    };
    
          resolve(formattedData);
        } catch (parseError) {
          this.log.error(`Fehler beim Parsen der Python-Script Ausgabe: ${parseError}`);
          this.log.debug(`Python-Script Ausgabe: ${stdout}`);
          resolve(this.getSimulatedKostalData());
        }
      });
    });
  }

  /**
   * Python-Script initialisieren und testen
   */
  private initializePythonScript(): void {
    if (!this.kostalConfig?.kostal?.host) {
      this.log.warn('Keine Kostal-Host-Konfiguration verfügbar');
      return;
    }

    // Teste ob Python3 verfügbar ist
    exec('python3 --version', (error, stdout, stderr) => {
      if (error) {
        this.log.error('❌ Python3 nicht gefunden. Bitte installieren Sie Python3.');
        this.log.error('Installationsanleitung: npm run setup-kostal');
        return;
      }
      
      this.log.info(`✅ Python3 gefunden: ${stdout.trim()}`);
      
      // Teste Python-Dependencies
      const scriptPath = path.join(__dirname, '../kostal_data_bridge.py');
      exec(`python3 "${scriptPath}" --test`, (error, stdout, stderr) => {
        if (error) {
          this.log.warn('⚠️ Python-Dependencies fehlen. Installiere automatisch...');
          exec('npm run postinstall', (installError) => {
            if (installError) {
              this.log.error('❌ Automatische Installation fehlgeschlagen. Führen Sie aus: npm run setup-kostal');
            } else {
              this.log.info('✅ Python-Dependencies erfolgreich installiert');
            }
          });
        } else {
          this.log.info('✅ Python-Script bereit');
        }
      });
    });

    this.log.info(`🐍 Python-Script für Kostal-Host: ${this.kostalConfig.kostal.host}`);
  }

  /**
   * Simulierte Kostal-Daten für Tests
   */
  private getSimulatedKostalData(): any {
    const now = new Date();
    const hour = now.getHours();
    
    // Simuliere Tagesenergie basierend auf der Tageszeit
    let simulatedEnergy = 0;
    if (hour >= 6 && hour <= 18) {
      // Simuliere Energieerzeugung während der Sonnenstunden
      const progress = (hour - 6) / 12; // 0 bis 1
      simulatedEnergy = Math.sin(progress * Math.PI) * 15 + Math.random() * 2; // 0-17 kWh
    }

    return {
      processData: [{
        Processdata: {
          EnergyToday: simulatedEnergy.toFixed(2),
          Power: hour >= 6 && hour <= 18 ? Math.random() * 5000 : 0,
          Temperature: 25 + Math.random() * 10
        }
      }],
      batteryData: {
        BatteryState: 'Charging',
        BatterySOC: 75 + Math.random() * 20
      },
      homeData: {
        EnergyToday: simulatedEnergy.toFixed(2),
        Power: hour >= 6 && hour <= 18 ? Math.random() * 5000 : 0
      },
      timestamp: now.toISOString()
    };
  }

  /**
   * Python-Kostal-Daten verarbeiten und Accessories aktualisieren
   */
  private processKostalData(data: any): void {
    try {
      // Python-Daten extrahieren
      const pythonData = data.pythonData || data;
      
      this.log.debug('🐍 Verarbeite Python-Daten:', pythonData);
      
      // Daten in das erwartete Format konvertieren (erweiterte Kostal-Daten)
      const processedData = {
        // Hauptleistungsdaten
        power: pythonData.power || 0,                    // DC-Gesamtleistung
        ac_power: pythonData.ac_power || 0,              // AC-Gesamtleistung
        grid_power: pythonData.grid_power || 0,          // Netzleistung (negativ = Einspeisung)
        home_consumption: pythonData.home_consumption || 0, // Hausverbrauch
        home_own: pythonData.home_own || 0,              // Eigenverbrauch Solar
        
        // Energiedaten
        energy_today: pythonData.energy_today || 0,     // Tagesertrag in kWh
        energy_total: pythonData.energy_total || 0,     // Gesamtertrag in kWh
        
        // PV-String Daten
        voltage_dc1: pythonData.voltage_dc1 || 0,        // String 1 Spannung
        current_dc1: pythonData.current_dc1 || 0,        // String 1 Strom
        power_dc1: pythonData.power_dc1 || 0,            // String 1 Leistung
        voltage_dc2: pythonData.voltage_dc2 || 0,        // String 2 Spannung
        current_dc2: pythonData.current_dc2 || 0,        // String 2 Strom
        power_dc2: pythonData.power_dc2 || 0,            // String 2 Leistung
        
        // AC-Daten
        voltage_ac: pythonData.voltage_ac || 0,          // AC-Spannung
        frequency: pythonData.frequency || 0,            // Netzfrequenz
        
        // Erweiterte Statistiken
        co2_saving_today: pythonData.co2_saving_today || 0,     // CO2-Einsparung heute
        autarky_today: pythonData.autarky_today || 0,           // Autarkie heute in %
        own_consumption_rate: pythonData.own_consumption_rate || 0, // Eigenverbrauchsrate in %
        
        // System
        status: pythonData.status || 0,                  // Inverter State
        timestamp: data.timestamp || new Date().toISOString()
      };

    // Daten speichern
      Object.keys(processedData).forEach(key => {
        this.deviceData.set(key, (processedData as any)[key]);
      });

      // Tägliche Energieverfolgung
      this.trackDailyEnergy(processedData);

      // Accessories aktualisieren (vorerst deaktiviert, da Instanzen nicht verfügbar)
      // this.accessories.forEach(accessory => {
      //   const inverterAccessory = this.findAccessoryInstance(accessory);
      //   if (inverterAccessory && typeof inverterAccessory.updateData === 'function') {
      //     inverterAccessory.updateData(processedData);
      //   }
      // });

      this.log.info(`✅ Kostal-Daten: Solar ${processedData.power}W, AC ${processedData.ac_power}W, Netz ${processedData.grid_power}W, Haus ${processedData.home_consumption}W`);
      
    } catch (error) {
      this.log.error('❌ Fehler beim Verarbeiten der Python-Daten:', error);
    }
  }

  /**
   * Finde die KostalInverterAccessory-Instanz für ein Accessory
   */
  private findAccessoryInstance(accessory: PlatformAccessory): any {
    // Da wir die Instanzen nicht direkt speichern, müssen wir sie über die Platform finden
    // Für jetzt geben wir null zurück, um den Fehler zu vermeiden
    return null;
  }

  /**
   * Tägliche Energieverfolgung
   */
  private trackDailyEnergy(data: any): void {
    if (!this.dailyReportsConfig?.enabled) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const currentEnergy = this.extractEnergyFromData(data);
      
      if (currentEnergy > 0) {
        this.dailyEnergyData.set(today, currentEnergy);
        this.log.debug(`📊 Tägliche Energie verfolgt: ${currentEnergy.toFixed(2)} kWh (${today})`);
      }
    } catch (error) {
      this.log.error('Fehler bei der täglichen Energieverfolgung:', error);
    }
  }

  /**
   * Energie aus Kostal-Daten extrahieren
   */
  private extractEnergyFromData(data: any): number {
    try {
      // Versuche verschiedene Datenquellen für die Tagesenergie
      if (data.processData && Array.isArray(data.processData)) {
        for (const module of data.processData) {
          if (module.Processdata && module.Processdata.EnergyToday) {
            return parseFloat(module.Processdata.EnergyToday) || 0;
          }
        }
      }
      
      if (data.homeData && data.homeData.EnergyToday) {
        return parseFloat(data.homeData.EnergyToday) || 0;
      }

      // Fallback: Verwende gespeicherte Daten
      const storedEnergy = this.deviceData.get('energy_today');
      return parseFloat(storedEnergy) || 0;
    } catch (error) {
      this.log.error('Fehler beim Extrahieren der Energie:', error);
      return 0;
    }
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

    // Motion Sensor für Daily Reports erstellen (falls aktiviert)
    if (this.dailyReportsConfig?.enabled && this.dailyReportsConfig.reportStyle === 'motion') {
      this.createMotionSensorAccessory();
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
   * Motion Sensor Accessory für Daily Reports erstellen
   */
  public createMotionSensorAccessory(): void {
    const motionDevice = {
      name: 'Solar Tagesbericht',
      model: 'Kostal Daily Report Motion Sensor',
      serialNumber: 'KOSTAL-DAILY-REPORT-001',
      type: 'motion-sensor'
    };

    const uuid = this.api.hap.uuid.generate(motionDevice.serialNumber);
    const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);

    if (existingAccessory) {
      this.log.info('Motion Sensor aus Cache geladen:', motionDevice.name);
      this.motionSensorAccessory = existingAccessory;
    } else {
      this.log.info('Neuer Motion Sensor erstellt:', motionDevice.name);
      const accessory = new this.api.platformAccessory(motionDevice.name, uuid);
      accessory.context.device = motionDevice;
      this.accessories.push(accessory);
      this.motionSensorAccessory = accessory;
      this.api.registerPlatformAccessories('homebridge-kostal-inverter', 'KostalInverter', [accessory]);
    }

    // Motion Sensor Service hinzufügen
    const motionService = this.motionSensorAccessory.getService(this.Service.MotionSensor) ||
      this.motionSensorAccessory.addService(this.Service.MotionSensor);

    motionService.setCharacteristic(this.Characteristic.Name, motionDevice.name);
    motionService.setCharacteristic(this.Characteristic.MotionDetected, false);

    this.log.info('📱 Motion Sensor für tägliche Berichte eingerichtet');
  }

  /**
   * Daily Reports Setup
   */
  private setupDailyReports(): void {
    if (!this.dailyReportsConfig?.enabled) {
      this.log.info('📈 Daily Reports deaktiviert');
      return;
    }

    this.log.info('📈 Daily Reports Setup gestartet...');
    
    // Cron Job für tägliche Berichte einrichten
    this.setupDailyReportCron();
    
    this.log.info('✅ Daily Reports Setup abgeschlossen');
  }

  /**
   * Cron Job für tägliche Berichte einrichten
   */
  private setupDailyReportCron(): void {
    if (this.cronJob) {
      this.cronJob.destroy();
    }

    const reportTime = this.dailyReportsConfig.reportTime || 'sunset+30';
    let cronExpression: string;

    if (reportTime.startsWith('sunset')) {
      // Für Sonnenuntergang-basierte Zeiten verwenden wir 20:00 als Fallback
      // In einer echten Implementierung würde man eine Sonnenuntergangs-API verwenden
      cronExpression = '0 20 * * *'; // 20:00 Uhr täglich
      this.log.info(`📅 Cron Job eingerichtet für 20:00 Uhr (Sonnenuntergang+30 Fallback)`);
    } else {
      // Direkte Zeitangabe (z.B. "20:00")
      const [hours, minutes] = reportTime.split(':');
      cronExpression = `${minutes} ${hours} * * *`;
      this.log.info(`📅 Cron Job eingerichtet für ${reportTime}`);
    }

    this.cronJob = cron.schedule(cronExpression, () => {
      this.sendDailyReport();
    }, {
      scheduled: true,
      timezone: 'Europe/Berlin'
    });

    this.log.info('⏰ Täglicher Bericht-Cron aktiviert');
  }

  /**
   * Täglichen Bericht senden
   */
  public sendDailyReport(): void {
    if (!this.dailyReportsConfig?.enabled) return;

    try {
      this.log.info('📊 Sende täglichen Solar-Bericht...');
      
      const today = new Date().toISOString().split('T')[0];
      const todayEnergy = this.dailyEnergyData.get(today) || 0;
      
      // Bericht generieren
      const report = this.generateDailyReport(todayEnergy);
      
      // Motion Sensor auslösen (Push-Benachrichtigung)
      if (this.motionSensorAccessory && this.dailyReportsConfig.reportStyle === 'motion') {
        this.triggerMotionSensor(report);
      }
      
      this.log.info('✅ Täglicher Bericht gesendet:', report);
      
    } catch (error) {
      this.log.error('❌ Fehler beim Senden des täglichen Berichts:', error);
    }
  }

  /**
   * Täglichen Bericht generieren
   */
  public generateDailyReport(energy: number): string {
    const language = this.dailyReportsConfig?.language || 'de';
    const today = new Date().toLocaleDateString('de-DE');
    
    const reports = {
      de: `🌞 Solar-Bericht ${today}\n\n⚡ Heutige Erzeugung: ${energy.toFixed(2)} kWh\n📈 Status: ${energy > 0 ? 'Produktiv' : 'Keine Erzeugung'}\n\n🔋 Gesamt: ${energy.toFixed(2)} kWh`,
      en: `🌞 Solar Report ${today}\n\n⚡ Today's Generation: ${energy.toFixed(2)} kWh\n📈 Status: ${energy > 0 ? 'Productive' : 'No Generation'}\n\n🔋 Total: ${energy.toFixed(2)} kWh`,
      fr: `🌞 Rapport Solaire ${today}\n\n⚡ Génération d'aujourd'hui: ${energy.toFixed(2)} kWh\n📈 Statut: ${energy > 0 ? 'Productif' : 'Aucune génération'}\n\n🔋 Total: ${energy.toFixed(2)} kWh`
    };

    return reports[language as keyof typeof reports] || reports.de;
  }

  /**
   * Motion Sensor auslösen
   */
  private triggerMotionSensor(report: string): void {
    if (!this.motionSensorAccessory) return;

    const motionService = this.motionSensorAccessory.getService(this.Service.MotionSensor);
    if (!motionService) return;

    // Motion Sensor auslösen
    motionService.setCharacteristic(this.Characteristic.MotionDetected, true);
    
    // Nach 1 Sekunde wieder deaktivieren
    setTimeout(() => {
      motionService.setCharacteristic(this.Characteristic.MotionDetected, false);
    }, 1000);

    this.log.info('📱 Motion Sensor ausgelöst für Push-Benachrichtigung');
    this.log.info('📄 Bericht:', report);
  }

  /**
   * Aufräumen beim Beenden
   */
  private cleanup(): void {
    if (this.dataPollingInterval) {
      clearInterval(this.dataPollingInterval);
      this.dataPollingInterval = null;
    }

    if (this.cronJob) {
      this.cronJob.destroy();
      this.cronJob = null;
    }
  }
}