import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';
export declare class KostalEnergyGenerator implements DynamicPlatformPlugin {
    readonly log: Logger;
    readonly config: PlatformConfig;
    readonly api: API;
    readonly Service: typeof Service;
    readonly Characteristic: typeof Characteristic;
    readonly accessories: PlatformAccessory[];
    private kostalConfig;
    private dataPollingInterval;
    private logData;
    private energyAccessories;
    constructor(log: Logger, config: PlatformConfig, api: API);
    /**
     * Kostal-Konfiguration laden
     */
    private loadKostalConfig;
    /**
     * Wechselrichter-Modell automatisch erkennen
     */
    private detectInverterModel;
    /**
     * Daten-Polling starten
     */
    private startDataPolling;
    /**
     * Kostal-Daten abrufen und loggen
     */
    private fetchKostalData;
    /**
     * Echte Kostal-Daten loggen
     */
    private logRealData;
    /**
     * Kostal-Daten verarbeiten und Accessories aktualisieren
     */
    private processKostalData;
    /**
     * Geräte entdecken und Accessories erstellen
     */
    private discoverDevices;
    /**
     * Accessory erstellen oder aus Cache laden
     */
    private createAccessory;
    /**
     * Accessory aus Cache konfigurieren
     */
    configureAccessory(accessory: PlatformAccessory): void;
    /**
     * Aufräumen beim Beenden
     */
    private cleanup;
}
//# sourceMappingURL=kostal-energy-generator.d.ts.map