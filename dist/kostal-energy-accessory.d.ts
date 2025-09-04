import { PlatformAccessory } from 'homebridge';
import { KostalEnergyGenerator } from './kostal-energy-generator';
export declare class KostalEnergyAccessory {
    private readonly platform;
    private readonly accessory;
    private powerService;
    private temperatureService;
    private energyService;
    private statusService;
    private currentValues;
    private readonly device;
    private readonly log;
    constructor(platform: KostalEnergyGenerator, accessory: PlatformAccessory);
    private createServices;
    private setupEventHandlers;
    /**
     * Daten aktualisieren (wird von der Platform aufgerufen)
     */
    updateData(data: any): void;
}
//# sourceMappingURL=kostal-energy-accessory.d.ts.map