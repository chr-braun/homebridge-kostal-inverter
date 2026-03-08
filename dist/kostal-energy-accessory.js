"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KostalEnergyAccessory = void 0;
// UUID für CurrentPowerConsumption
const CurrentPowerConsumptionUUID = 'E863F10D-079E-48FF-8F27-9C2605A29F52';
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
                // Solarproduktion als Outlet (Energieerzeuger mit CurrentPowerConsumption)
                this.mainService = this.accessory.getService(deviceName) ||
                    this.accessory.addService(this.platform.Service.Outlet, deviceName, serviceId);
                this.mainService.setCharacteristic(this.platform.Characteristic.Name, deviceName);
                this.mainService.setCharacteristic(this.platform.Characteristic.On, true); // Immer "Ein" für Erzeuger
                this.mainService.setCharacteristic(this.platform.Characteristic.OutletInUse, true); // Immer in Betrieb
                // CurrentPowerConsumption hinzufügen (falls verfügbar)
                if (this.mainService.getCharacteristic(CurrentPowerConsumptionUUID)) {
                    this.mainService.getCharacteristic(CurrentPowerConsumptionUUID).setValue(0);
                }
                else {
                    this.mainService.addCharacteristic(new this.platform.Characteristic('Current Power Consumption', CurrentPowerConsumptionUUID, {
                        format: "uint16" /* this.platform.Characteristic.Formats.UINT16 */,
                        unit: 'W',
                        minValue: 0,
                        maxValue: 65535,
                        minStep: 1,
                        perms: ["pr" /* this.platform.Characteristic.Perms.READ */, "ev" /* this.platform.Characteristic.Perms.NOTIFY */]
                    })).setValue(0);
                }
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
                    this.accessory.addService(this.platform.Service.LightSensor, deviceName, serviceId);
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
                // Solarproduktion als Outlet (Energieerzeuger)
                this.mainService.getCharacteristic(CurrentPowerConsumptionUUID)
                    .on('get', (callback) => {
                    const power = this.currentValues.get('power') || 0;
                    // Positive Werte für Erzeugung
                    const powerValue = Math.max(0, power);
                    callback(null, powerValue);
                });
                break;
            case 'home_power':
                // Hausverbrauch (Bewegung = Verbrauch)
                this.mainService.getCharacteristic(this.platform.Characteristic.MotionDetected)
                    .on('get', (callback) => {
                    const homePower = this.currentValues.get('home_power') || 0;
                    const motionDetected = homePower > 0;
                    callback(null, motionDetected);
                });
                break;
            case 'grid_power':
                // Netzleistung (Bezug/Einspeisung)
                this.mainService.getCharacteristic(this.platform.Characteristic.OccupancyDetected)
                    .on('get', (callback) => {
                    const gridPower = this.currentValues.get('grid_power') || 0;
                    const occupancyDetected = Math.abs(gridPower) > 0;
                    callback(null, occupancyDetected ?
                        this.platform.Characteristic.OccupancyDetected.OCCUPANCY_DETECTED :
                        this.platform.Characteristic.OccupancyDetected.OCCUPANCY_NOT_DETECTED);
                });
                break;
            case 'temperature':
                // Temperatur
                this.mainService.getCharacteristic(this.platform.Characteristic.CurrentTemperature)
                    .on('get', (callback) => {
                    const value = this.currentValues.get('temperature') || 20;
                    callback(null, value);
                });
                break;
            case 'daily_energy':
                // Tagesenergie (kWh als Lux)
                this.mainService.getCharacteristic(this.platform.Characteristic.CurrentAmbientLightLevel)
                    .on('get', (callback) => {
                    const value = this.currentValues.get('energy_today') || 0;
                    // kWh zu Lux konvertieren (1 kWh = 1000 Lux)
                    const luxValue = Math.max(0.0001, value * 1000);
                    callback(null, luxValue);
                });
                break;
            case 'status':
                // Status
                this.mainService.getCharacteristic(this.platform.Characteristic.ContactSensorState)
                    .on('get', (callback) => {
                    const status = this.currentValues.get('status') || 0;
                    const state = status > 0 ?
                        this.platform.Characteristic.ContactSensorState.CONTACT_DETECTED :
                        this.platform.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED;
                    callback(null, state);
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
                // Solarproduktion als Outlet (Energieerzeuger)
                if (data.power !== undefined) {
                    this.currentValues.set('power', data.power);
                    // Positive Werte für Erzeugung
                    const powerValue = Math.max(0, data.power);
                    this.mainService.updateCharacteristic(CurrentPowerConsumptionUUID, powerValue);
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
                // Netzleistung (Bezug/Einspeisung)
                if (data.grid_power !== undefined) {
                    this.currentValues.set('grid_power', data.grid_power);
                    const occupancyDetected = Math.abs(data.grid_power) > 0;
                    this.mainService.updateCharacteristic(this.platform.Characteristic.OccupancyDetected, occupancyDetected ?
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