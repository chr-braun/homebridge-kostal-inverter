# Changelog

All notable changes to this project will be documented in this file.

## [2.0.0] - 2025-09-04

### 🎉 Major Release - Complete Rewrite

This is a complete rewrite of the plugin with a new sensor-based approach for better HomeKit integration.

### ✨ New Features

- **6 HomeKit Sensors** - Complete sensor-based approach instead of outlets
  - 💡 **Solarproduktion** - Light Sensor (Watt as Lux)
  - 🏃 **Hausverbrauch** - Motion Sensor (Movement = Consumption)
  - 👥 **Netzleistung** - Occupancy Sensor (Grid Import/Export)
  - 🌡️ **Wechselrichter Temperatur** - Temperature Sensor
  - 💡 **Tagesenergie** - Light Sensor (kWh as Lux)
  - 📡 **Wechselrichter Status** - Contact Sensor (Online/Offline)

- **Apple Home App Integration** - Sensors appear in energy overview
- **Siri Integration** - Voice commands for all sensor data
- **Automations Support** - Create energy-based automation rules
- **Child Bridge Support** - Better stability and performance
- **Real-time Data** - Live data from Kostal inverter via Python bridge

### 🔧 Technical Improvements

- **Direct API Integration** - Removed MQTT dependency, direct Kostal API calls
- **Python Data Bridge** - Robust data fetching with `pykoplenti` library
- **Auto-detection Removed** - Simplified configuration (was unreliable)
- **Better Error Handling** - Improved connection and data processing
- **TypeScript Rewrite** - Better code quality and maintainability

### 📊 Data Mapping

- **Solarproduktion**: Watt → Lux (1W = 1 Lux)
- **Hausverbrauch**: Consumption > 0 → Motion detected
- **Netzleistung**: Import/Export → Occupancy detected
- **Temperatur**: Direct in °C
- **Tagesenergie**: kWh → Lux (1kWh = 1000 Lux)
- **Status**: Online/Offline → Contact open/closed

### 🏠 HomeKit Integration

- **Sensors Tab** - All 6 sensors visible in Apple Home App
- **Energy Overview** - Sensors can be used in energy monitoring
- **Automations** - Create rules like "If Solarproduktion > 1000W"
- **Siri Commands** - "Hey Siri, wie ist die Solarproduktion?"

### 🐛 Bug Fixes

- Fixed plugin registration issues
- Fixed data update problems
- Fixed UI configuration errors
- Fixed Python dependency installation
- Fixed SSL certificate handling for self-signed certificates

### 📚 Documentation

- **Comprehensive README** - Complete installation and configuration guide
- **Troubleshooting Section** - Common issues and solutions
- **HomeKit Integration Guide** - How to use sensors and automations
- **Siri Commands** - Voice control examples

### 🔄 Breaking Changes

- **Complete API Change** - Plugin now creates sensors instead of outlets
- **Configuration Simplified** - Removed auto-detection, manual configuration required
- **MQTT Removed** - Direct API integration only
- **Service Types Changed** - All accessories now use sensor services

### 📦 Dependencies

- **Python Requirements**: `pykoplenti`, `aiohttp`
- **Node.js**: `^18.15.0 || ^20.7.0 || ^22`
- **Homebridge**: `>=1.6.0`

### 🚀 Migration from 1.x

1. **Backup Configuration** - Save your current config
2. **Uninstall Old Version** - `npm uninstall homebridge-kostal-inverter`
3. **Install 2.0.0** - `npm install homebridge-kostal-inverter@latest`
4. **Reconfigure** - Set up Kostal connection in Homebridge UI
5. **Add to HomeKit** - Add the 6 new sensors to your home

---

## [1.2.0] - 2024-12-XX

### Added
- Initial release with MQTT integration
- Basic HomeKit outlet services
- Configuration via Homebridge UI

### Fixed
- Various bug fixes and improvements

---

## [1.1.0] - 2024-12-XX

### Added
- First public release
- MQTT-based data integration

---

## [1.0.0] - 2024-12-XX

### Added
- Initial development version
