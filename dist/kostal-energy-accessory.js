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
        const deviceType = this.device.type;
        const deviceName = this.device.name;
        const serviceId = `${deviceType}-${Date.now()}`;
        switch (deviceType) {
            case 'main':
                // Solarproduktion/Netzbezug als Temperatur-Sensor (Watt als °C)
                this.mainService = this.accessory.getService(deviceName) ||
                    this.accessory.addService(this.platform.Service.TemperatureSensor, deviceName, serviceId);
                this.mainService.setCharacteristic(this.platform.Characteristic.Name, deviceName);
                this.mainService.setCharacteristic(this.platform.Characteristic.CurrentTemperature, 0);
                break;
            case 'home_power':
                // Hausverbrauch als Motion Sensor (Bewegung = Verbrauch)
                this.mainService = this.accessory.getService(deviceName) ||
                    this.accessory.addService(this.platform.Service.MotionSensor, deviceName, serviceId);
                this.mainService.setCharacteristic(this.platform.Characteristic.Name, deviceName);
                this.mainService.setCharacteristic(this.platform.Characteristic.MotionDetected, false);
                break;
            case 'grid_power':
                // Netzleistung als Occupancy Sensor (Bezug/Einspeisung)
                this.mainService = this.accessory.getService(deviceName) ||
                    this.accessory.addService(this.platform.Service.OccupancySensor, deviceName, serviceId);
                this.mainService.setCharacteristic(this.platform.Characteristic.Name, deviceName);
                this.mainService.setCharacteristic(this.platform.Characteristic.OccupancyDetected, this.platform.Characteristic.OccupancyDetected.OCCUPANCY_NOT_DETECTED);
                break;
            case 'temperature':
                // Temperatur als Temperature Sensor
                this.mainService = this.accessory.getService(deviceName) ||
                    this.accessory.addService(this.platform.Service.TemperatureSensor, deviceName, serviceId);
                this.mainService.setCharacteristic(this.platform.Characteristic.Name, deviceName);
                this.mainService.setCharacteristic(this.platform.Characteristic.CurrentTemperature, 20);
                break;
            case 'daily_energy':
                // Tagesenergie als Light Sensor (kWh als Lux)
                this.mainService = this.accessory.getService(deviceName) ||
                    this.accessory.addService(this.platform.Service.TemperatureSensor, deviceName, serviceId);
                this.mainService.setCharacteristic(this.platform.Characteristic.Name, deviceName);
                this.mainService.setCharacteristic(this.platform.Characteristic.CurrentAmbientLightLevel, 0.0001);
                break;
            case 'status':
                // Status als Contact Sensor
                this.mainService = this.accessory.getService(deviceName) ||
                    this.accessory.addService(this.platform.Service.ContactSensor, deviceName, serviceId);
                this.mainService.setCharacteristic(this.platform.Characteristic.Name, deviceName);
                this.mainService.setCharacteristic(this.platform.Characteristic.ContactSensorState, this.platform.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED);
                break;
            default:
                this.log.warn(`Unbekannter Gerätetyp: ${deviceType}`);
        }
    }
    setupEventHandlers() {
        if (!this.mainService)
            return;
        const deviceType = this.device.type;
        switch (deviceType) {
            case 'main':
                // Solarproduktion/Netzbezug (Watt als Temperatur)
                this.mainService.getCharacteristic(this.platform.Characteristic.CurrentTemperature)
                    .on('get', (callback) => {
                    // Sofortiger synchroner Callback um Race Conditions zu vermeiden
                    setImmediate(() => {
                        try {
                            const power = this.currentValues.get('power') || 0;
                            // Watt zu Temperatur konvertieren (100 W = 1°C)
                            // Solar-Export (negativ): -5500W = -55°C
                            // Netz-Import (positiv): +10000W = +100°C
                            const tempValue = power / 100;
                            callback(null, tempValue);
                        }
                        catch (error) {
                            this.log.error('Fehler beim Abrufen der Solarproduktion:', error);
                            callback(error instanceof Error ? error : new Error(String(error)));
                        }
                    });
                });
                break;
            case 'home_power':
                // Hausverbrauch (Bewegung = Verbrauch)
                this.mainService.getCharacteristic(this.platform.Characteristic.MotionDetected)
                    .on('get', (callback) => {
                    setImmediate(() => {
                        try {
                            const homePower = this.currentValues.get('home_power') || 0;
                            const motionDetected = homePower > 0;
                            callback(null, motionDetected);
                        }
                        catch (error) {
                            this.log.error('Fehler beim Abrufen des Hausverbrauchs:', error);
                            callback(error instanceof Error ? error : new Error(String(error)));
                        }
                    });
                });
                break;
            case 'grid_power':
                // Netzleistung Status (Export/Import)
                this.mainService.getCharacteristic(this.platform.Characteristic.OccupancyDetected)
                    .on('get', (callback) => {
                    setImmediate(() => {
                        try {
                            const gridPower = this.currentValues.get('grid_power') || 0;
                            // Negative Werte = Solar-Export = OCCUPANCY_DETECTED
                            // Positive Werte = Netz-Import = OCCUPANCY_NOT_DETECTED
                            const isExport = gridPower < 0;
                            callback(null, isExport ?
                                this.platform.Characteristic.OccupancyDetected.OCCUPANCY_DETECTED :
                                this.platform.Characteristic.OccupancyDetected.OCCUPANCY_NOT_DETECTED);
                        }
                        catch (error) {
                            this.log.error('Fehler beim Abrufen der Netzleistung:', error);
                            callback(error instanceof Error ? error : new Error(String(error)));
                        }
                    });
                });
                break;
            case 'temperature':
                // Temperatur
                this.mainService.getCharacteristic(this.platform.Characteristic.CurrentTemperature)
                    .on('get', (callback) => {
                    setImmediate(() => {
                        try {
                            const value = this.currentValues.get('temperature') || 20;
                            callback(null, value);
                        }
                        catch (error) {
                            this.log.error('Fehler beim Abrufen der Temperatur:', error);
                            callback(error instanceof Error ? error : new Error(String(error)));
                        }
                    });
                });
                break;
            case 'daily_energy':
                // Tagesenergie (kWh als Lux)
                this.mainService.getCharacteristic(this.platform.Characteristic.CurrentAmbientLightLevel)
                    .on('get', (callback) => {
                    setImmediate(() => {
                        try {
                            const value = this.currentValues.get('energy_today') || 0;
                            // kWh zu Lux konvertieren (1 kWh = 1000 Lux)
                            const luxValue = Math.max(0.0001, value * 1000);
                            callback(null, luxValue);
                        }
                        catch (error) {
                            this.log.error('Fehler beim Abrufen der Tagesenergie:', error);
                            callback(error instanceof Error ? error : new Error(String(error)));
                        }
                    });
                });
                break;
            case 'status':
                // Status
                this.mainService.getCharacteristic(this.platform.Characteristic.ContactSensorState)
                    .on('get', (callback) => {
                    setImmediate(() => {
                        try {
                            const status = this.currentValues.get('status') || 0;
                            const state = status > 0 ?
                                this.platform.Characteristic.ContactSensorState.CONTACT_DETECTED :
                                this.platform.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED;
                            callback(null, state);
                        }
                        catch (error) {
                            this.log.error('Fehler beim Abrufen des Status:', error);
                            callback(error instanceof Error ? error : new Error(String(error)));
                        }
                    });
                });
                break;
        }
    }
    /**
     * Daten aktualisieren (wird von der Platform aufgerufen)
     */
    updateData(data) {
        if (!this.mainService)
            return;
        const deviceType = this.device.type;
        switch (deviceType) {
            case 'main':
                // Solarproduktion (Watt als Lux)
                if (data.power !== undefined) {
                    this.currentValues.set('power', data.power);
                    const luxValue = Math.max(0.0001, Math.abs(data.power));
                    this.mainService.updateCharacteristic(this.platform.Characteristic.CurrentAmbientLightLevel, luxValue);
                }
                break;
            case 'home_power':
                // Hausverbrauch (Bewegung = Verbrauch)
                if (data.home_power !== undefined) {
                    this.currentValues.set('home_power', data.home_power);
                    const motionDetected = data.home_power > 0;
                    this.mainService.updateCharacteristic(this.platform.Characteristic.MotionDetected, motionDetected);
                }
                break;
            case 'grid_power':
                // Netzleistung Status (Export/Import)
                if (data.grid_power !== undefined) {
                    this.currentValues.set('grid_power', data.grid_power);
                    const isExport = data.grid_power < 0;
                    this.mainService.updateCharacteristic(this.platform.Characteristic.OccupancyDetected, isExport ?
                        this.platform.Characteristic.OccupancyDetected.OCCUPANCY_DETECTED :
                        this.platform.Characteristic.OccupancyDetected.OCCUPANCY_NOT_DETECTED);
                }
                break;
            case 'temperature':
                // Temperatur
                if (data.temperature !== undefined) {
                    this.currentValues.set('temperature', data.temperature);
                    this.mainService.updateCharacteristic(this.platform.Characteristic.CurrentTemperature, data.temperature);
                }
                break;
            case 'daily_energy':
                // Tagesenergie (kWh als Lux)
                if (data.energy_today !== undefined) {
                    this.currentValues.set('energy_today', data.energy_today);
                    const luxValue = Math.max(0.0001, data.energy_today * 1000);
                    this.mainService.updateCharacteristic(this.platform.Characteristic.CurrentAmbientLightLevel, luxValue);
                }
                break;
            case 'status':
                // Status
                if (data.status !== undefined) {
                    this.currentValues.set('status', data.status);
                    const state = data.status > 0 ?
                        this.platform.Characteristic.ContactSensorState.CONTACT_DETECTED :
                        this.platform.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED;
                    this.mainService.updateCharacteristic(this.platform.Characteristic.ContactSensorState, state);
                }
                break;
        }
    }
}
exports.KostalEnergyAccessory = KostalEnergyAccessory;
//# sourceMappingURL=kostal-energy-accessory.js.map