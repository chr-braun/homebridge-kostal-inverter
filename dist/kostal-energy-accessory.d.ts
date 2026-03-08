import { PlatformAccessory } from 'homebridge';
import { KostalEnergyGenerator } from './kostal-energy-generator';
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
    home_power?: number;
    grid_power?: number;
}
export declare class KostalEnergyAccessory {
    private readonly platform;
    private readonly accessory;
    private mainService;
    private currentValues;
    private readonly device;
    private readonly log;
    constructor(platform: KostalEnergyGenerator, accessory: PlatformAccessory);
    private createServices;
    private setupEventHandlers;
    /**
     * Daten aktualisieren (wird von der Platform aufgerufen)
     */
    updateData(data: KostalData): void;
}
export {};
//# sourceMappingURL=kostal-energy-accessory.d.ts.map