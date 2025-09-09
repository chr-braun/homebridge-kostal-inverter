import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';
import { KostalEnergyGenerator } from './kostal-energy-generator';

export = (api: API) => {
  api.registerPlatform('KostalInverter', KostalEnergyGenerator);
};
