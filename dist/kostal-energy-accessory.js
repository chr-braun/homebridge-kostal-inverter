"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KostalEnergyAccessory = void 0;
class KostalEnergyAccessory {
    constructor(platform, accessory) {
        this.platform = platform;
        this.accessory = accessory;
        this.currentValues = new Map();
        this.device = accessory.context.device;
        this.log = platform.log;
        // Accessory Information Service
        this.accessory.getService(this.platform.Service.AccessoryInformation)
            .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Kostal')
            .setCharacteristic(this.platform.Characteristic.Model, this.device.model || 'Solar Energy Generator')
            .setCharacteristic(this.platform.Characteristic.SerialNumber, this.device.serialNumber)
            .setCharacteristic(this.platform.Characteristic.FirmwareRevision, '2.0.0');
        this.createServices();
        this.setupEventHandlers();
    }
    createServices() {
        // Haupt-Energieerzeuger als Outlet Service
        this.powerService = this.accessory.getService('Solar Energy Generator') ||
            this.accessory.addService(this.platform.Service.Outlet, 'Solar Energy Generator', 'solar-energy-generator');
        this.powerService.setCharacteristic(this.platform.Characteristic.Name, 'Solar Energy Generator');
        this.powerService.setCharacteristic(this.platform.Characteristic.On, false);
        this.powerService.setCharacteristic(this.platform.Characteristic.OutletInUse, false);
        // Temperatur Service
        this.temperatureService = this.accessory.getService('Inverter Temperature') ||
            this.accessory.addService(this.platform.Service.TemperatureSensor, 'Inverter Temperature', 'inverter-temp');
        this.temperatureService.setCharacteristic(this.platform.Characteristic.Name, 'Inverter Temperature');
        this.temperatureService.setCharacteristic(this.platform.Characteristic.CurrentTemperature, 20);
        // Tagesenergie als Light Sensor (kWh als Lux)
        this.energyService = this.accessory.getService('Daily Energy Production') ||
            this.accessory.addService(this.platform.Service.LightSensor, 'Daily Energy Production', 'daily-energy');
        this.energyService.setCharacteristic(this.platform.Characteristic.Name, 'Daily Energy Production');
        this.energyService.setCharacteristic(this.platform.Characteristic.CurrentAmbientLightLevel, 0.0001);
        // Status als Contact Sensor
        this.statusService = this.accessory.getService('Generator Status') ||
            this.accessory.addService(this.platform.Service.ContactSensor, 'Generator Status', 'generator-status');
        this.statusService.setCharacteristic(this.platform.Characteristic.Name, 'Generator Status');
        this.statusService.setCharacteristic(this.platform.Characteristic.ContactSensorState, this.platform.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED);
    }
    setupEventHandlers() {
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
        // Event Handler für Energie (Light Sensor)
        this.energyService?.getCharacteristic(this.platform.Characteristic.CurrentAmbientLightLevel)
            .on('get', (callback) => {
            const value = this.currentValues.get('energy_today') || 0;
            // kWh zu Lux konvertieren (1 kWh = 1000 Lux)
            const luxValue = Math.max(0.0001, value * 1000);
            callback(null, luxValue);
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
    }
    /**
     * Daten aktualisieren (wird von der Platform aufgerufen)
     */
    updateData(data) {
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
            // kWh zu Lux konvertieren
            const luxValue = Math.max(0.0001, data.energy_today * 1000);
            this.energyService?.updateCharacteristic(this.platform.Characteristic.CurrentAmbientLightLevel, luxValue);
        }
        if (data.status !== undefined) {
            this.currentValues.set('status', data.status);
            const state = data.status > 0 ?
                this.platform.Characteristic.ContactSensorState.CONTACT_DETECTED :
                this.platform.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED;
            this.statusService?.updateCharacteristic(this.platform.Characteristic.ContactSensorState, state);
        }
    }
}
exports.KostalEnergyAccessory = KostalEnergyAccessory;
//# sourceMappingURL=kostal-energy-accessory.js.map