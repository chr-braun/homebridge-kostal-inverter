<<<<<<< HEAD
import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';
import { KostalInverterPlatform } from './kostal-inverter-platform';
=======
import { API } from 'homebridge';
import { KostalEnergyGenerator } from './kostal-energy-generator';
>>>>>>> b58f076 (feat: add energy producer outlet support (v2.2.0))

export = (api: API) => {
  api.registerPlatform('homebridge-kostal-inverter', 'KostalInverter', KostalInverterPlatform);
};
