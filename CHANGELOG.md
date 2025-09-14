# Changelog

All notable changes to this project will be documented in this file.

## [1.4.0] - 2025-09-14

### Added
- **🔌 Direct Kostal API Integration**: Complete Python-based integration with Kostal Plenticore inverters
- **📊 Comprehensive Data Monitoring**: 25+ HomeKit accessories for all solar data points
- **🌍 Multi-Language Support**: German, English, French, Italian, Chinese localization
- **🔄 Automatic Cache Management**: Plugin cache cleared on every start for fresh configuration
- **📈 Real-time Solar Analytics**: Live DC/AC power, energy production, and efficiency metrics
- **🏠 HomeKit Integration**: Temperature, Light, Humidity, and Motion sensors for all data points
- **🔧 Child Bridge Support**: Automatic child bridge configuration with PIN generation
- **📱 Daily Reports**: Configurable end-of-day solar production summaries
- **🐍 Python Bridge**: Robust Python script for Kostal API communication with error handling

### Technical
- **Direct API Access**: Bypasses MQTT, connects directly to Kostal inverter API
- **Python Integration**: `kostal_data_bridge.py` script for reliable data fetching
- **TypeScript Implementation**: Full type safety with comprehensive error handling
- **Memory Management**: Automatic cache clearing prevents stale configuration issues
- **Data Validation**: Smart filtering and validation of all solar data points
- **Extensible Architecture**: Easy addition of new data points and features

### Fixed
- **Configuration Loading**: Proper loading of credentials from Homebridge configuration
- **Cache Persistence**: Automatic cache clearing ensures fresh configuration on every start
- **Data Accuracy**: Direct API access provides real-time, accurate solar data
- **Error Handling**: Comprehensive error handling for network and API issues

### Documentation
- **Complete Setup Guide**: Step-by-step installation and configuration instructions
- **API Integration Guide**: Detailed Python script setup and usage
- **Multi-Language Examples**: Configuration examples for all supported languages
- **Troubleshooting**: Comprehensive troubleshooting guide for common issues

## [1.2.4] - 2025-01-31

### Added
- **Enhanced Debug Logging**: Added detailed logging for configuration hash comparison and power outlet settings
- **Configuration Validation Logging**: Shows current `usePowerOutlets` value and hash comparisons for troubleshooting

### Changed
- **Improved Debug Information**: Better visibility into why cache validation succeeds or fails
- **Configuration State Logging**: Logs current power outlet configuration for verification

### Technical
- **Debug Output**: Added logging for hash comparison and configuration state
- **Troubleshooting Support**: Better diagnostics for cache validation issues

## [1.2.3] - 2025-01-31

### Fixed
- **Cache Validation Timing**: Moved configuration hash validation to `configureAccessory` method for proper execution order
- **Immediate Cache Clearing**: Cache is now cleared immediately when configuration changes are detected, before accessories are loaded
- **Service Type Detection**: Ensures Outlet vs LightSensor services are properly applied on first load

### Changed
- **Improved Cache Management**: Cache validation now runs at the correct time in the Homebridge lifecycle
- **Better Error Handling**: Prevents duplicate accessory loading when configuration changes

### Technical
- **Lifecycle Optimization**: Cache validation moved from constructor to `configureAccessory` for proper timing
- **Immediate Response**: Configuration changes are detected and handled immediately, not deferred

## [1.2.2] - 2025-01-31

### Added
- **Intelligent Cache Management**: Automatic cache clearing when configuration changes
- **Configuration Hash Validation**: Detects changes in MQTT settings, device selection, or power outlet preferences
- **Automatic Service Type Updates**: Ensures new service types (Outlet vs LightSensor) are properly applied without manual cache clearing

### Changed
- **Improved Power Outlet Detection**: Better handling of configuration changes for `usePowerOutlets` setting
- **Enhanced Logging**: More informative messages about cache clearing and configuration changes

### Fixed
- **Cache Persistence Issues**: Resolves problems where changing `usePowerOutlets` from false to true didn't update existing accessories
- **Service Type Mismatches**: Prevents old LightSensor accessories from persisting when Outlet service is requested

### Technical
- **Configuration Hash Generation**: Simple but effective hash function for detecting configuration changes
- **Automatic Cache Invalidation**: Clears accessories, discovered devices, and device data when configuration changes
- **Memory Management**: Proper cleanup of cached data to prevent memory leaks

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.1] - 2024-08-26

### Added
- **🚀 GitHub Actions Integration**: Automated dependency updates and CI/CD pipeline
- **🔧 Enhanced Code Quality**: Improved ESLint configuration and TypeScript types
- **📁 Project Cleanup**: Removed unnecessary files and optimized project structure
- **📦 Better Build Scripts**: Enhanced npm scripts for development and testing

### Technical
- **CI/CD Pipeline**: Automated testing, linting, and security audits
- **Dependency Management**: Weekly automated dependency updates via GitHub Actions
- **Code Quality**: Fixed all critical linting errors, improved type safety
- **Project Structure**: Cleaned up repository, optimized .gitignore and package.json

### Documentation
- **Updated Scripts**: Better npm scripts for development workflow
- **GitHub Actions**: Comprehensive CI/CD documentation and setup

## [1.2.0] - 2024-08-23

### Added
- **🌍 Multi-Language Daily Reports**: Comprehensive end-of-day solar production summaries in 5 languages
  - 🇺🇸 English, 🇩🇪 German, 🇫🇷 French, 🇮🇹 Italian, 🇨🇳 Chinese support
  - Intelligent analytics with yesterday comparisons and weekly averages
  - Weather condition detection (sunny, partly cloudy, cloudy, mixed)
  - Cultural number formatting (15.8 vs 15,8) and time display preferences
- **📱 HomeKit Motion Sensor Delivery**: Reports delivered via Motion Sensor notifications
  - Push notifications to all family devices
  - HomeKit automation and scene compatibility
  - Configurable timing (sunset-based or custom schedule)
- **📊 Smart Solar Analytics**: Comprehensive daily tracking and insights
  - Daily energy totals (Wh to kWh conversion)
  - Peak power detection with timestamps
  - Production hours calculation
  - Efficiency percentage vs configurable targets
- **🔧 Flexible Configuration**: Full customization via Homebridge UI
  - Language selection dropdown with native names
  - Multiple delivery methods (Motion Sensor, Doorbell, Switch)
  - Custom report timing or automatic sunset calculation
  - Optional comparisons and analytics

### Technical
- **Internationalization System**: Template-based i18n with JSON locale files
- **Real-time Data Integration**: Power data feeding into daily analytics
- **Build Process Enhancement**: Automatic locale file copying during compilation
- **Type Safety**: Full TypeScript support for all new features
- **Extensible Architecture**: Easy addition of new languages and features

### Documentation
- **Comprehensive Multi-Language Guide**: Detailed setup and usage instructions
- **Configuration Examples**: Sample configs for all supported languages
- **Demo Scripts**: Interactive demonstration of multi-language features
- **Updated README**: Prominent featuring of new daily reports capability

## [1.1.0] - 2024-08-23

### Added
- **Configurable Power Display**: Choose between Light Sensor (exact watts as lux) or Outlet Service (on/off state with logged watts)
- **Power Measurement Options**: New `usePowerOutlets` configuration option for intuitive power state display
- **Enhanced Documentation**: Comprehensive guides for power measurement choices with visual examples

### Fixed
- **MQTT Port Input**: Removed slider behavior for MQTT port field - now displays as proper number input
- **UI Usability**: MQTT port field no longer shows unusable slider, improved user experience

### Improved
- **HomeKit Integration**: Better power representation options to suit different user preferences
- **Configuration Schema**: Enhanced UI descriptions and help text for power measurement options
- **Backward Compatibility**: All existing configurations continue to work unchanged

## [1.0.0] - 2024-01-XX

### Added
- Initial release of homebridge-ahoy-dtu plugin
- Real-time solar power monitoring via MQTT
- Support for AHOY-DTU solar inverter devices
- Modern Homebridge Config UI X interface with responsive design
- Device discovery mode to automatically find MQTT topics
- Quick setup presets (Basic, Detailed, Individual Inverters)
- Custom device selection with manual MQTT topic configuration
- Offline detection with configurable thresholds (5-120 minutes)
- Smart data validation to filter invalid messages
- Health monitoring for device connectivity tracking
- Configurable energy percentage calculation
- Support for multiple HomeKit device types:
  - Light Sensor (Power output)
  - Contact Sensor (Production status)
  - Humidity Sensor (Energy production)
  - Temperature Sensor (Inverter temperature)

### Features
- **Device Discovery**: Automatic MQTT topic discovery and listing
- **Preset Configurations**: One-click setup for common use cases
- **Mobile-Friendly UI**: Responsive design for all device sizes
- **Data Validation**: Automatic filtering of error messages and invalid data
- **Offline Handling**: Intelligent status updates when solar system is offline
- **Health Monitoring**: Connection tracking and stale data detection
- **Progressive Configuration**: Simple setup with advanced options available

### Technical
- TypeScript implementation with full type safety
- Event-driven architecture using MQTT
- Support for Node.js >=14.18.1
- Compatible with Homebridge >=1.3.0
- Comprehensive error handling and logging
- Memory-efficient real-time data processing

### Documentation
- Comprehensive README with setup guide
- Visual GUI layout documentation
- MQTT topic reference guide
- Configuration examples for different scenarios
- Troubleshooting guide with common solutions