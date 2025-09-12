import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';
import { KostalInverterPlatform } from './kostal-inverter-platform';

export = (api: API) => {
  api.registerPlatform('homebridge-kostal-inverter', 'KostalInverter', KostalInverterPlatform);
};
