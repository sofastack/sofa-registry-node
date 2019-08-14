'use strict';

const assert = require('assert');
const { APIClientBase } = require('cluster-client');
const DataClient = require('./lib/client');
const { RegistryType, ScopeEnum } = require('./lib/util/contants');
const Config = require('./lib/config');
const { registerAppClazzMap } = require('sofa-bolt-node');
const RegistryClazzMap = require('./lib/cmd/class_map');

registerAppClazzMap(RegistryClazzMap);

class APIClient extends APIClientBase {
  /**
   * @param {object} options -
   * @param {Logger} options.logger -
   * @param {HttpClient} options.httpclient -
   * @param {object} options.config -
   */
  constructor(options) {
    options.logger = options.logger || console;
    assert(options.httpclient);
    options.config = new Config(options.config);
    super(options);
  }

  get delegates() {
    return {
      register: 'invoke',
      unregister: 'invoke',
      unSubscribe: 'unSubscribe',
    };
  }

  get DataClient() {
    return DataClient;
  }

  register(registration) {
    this._client.register(registration);
  }

  subscribe(registration, listener) {
    this._client.subscribe(Object.assign(registration, { type: 'address' }), listener);
  }

  subscribeConfig(registration, listener) {
    this._client.subscribe(Object.assign(registration, { type: 'config' }), listener);
  }

  unregister(registration) {
    this._client.unregister(registration);
  }

  unSubscribe(registration, listener) {
    this._client.unSubscribe(Object.assign(registration, { type: 'address' }), listener);
  }

  unSubscribeConfig(registration, listener) {
    this._client.unSubscribe(Object.assign(registration, { type: 'config' }), listener);
  }

  get clusterOptions() {
    const masterIp = this.options.config.endpoint;
    const masterPort = this.options.config.port;
    return {
      name: `Registry@${masterIp}:${masterPort}`,
      singleMode: true,
    };
  }
}

module.exports = {
  RegistryClient: APIClient,
  RegistryType,
  ScopeEnum,
};
