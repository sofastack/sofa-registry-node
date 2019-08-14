'use strict';

const DEAFULT_OPTIONS = {
  port: 9603,
  connectTimeout: 3000,
  socketTimeout: 3000,
  invokeTimeout: 1000,
  recheckInterval: 500,
  syncConfigRetryInterval: 30000,
  endpoint: 'confreg-pool.test.alipay.net',
};

class RegistryConfig {
  constructor(options) {
    options = options || {};
    options = Object.assign({}, DEAFULT_OPTIONS, options);
    this.env = options.env;
    this.instanceId = options.instanceId;
    this.zone = options.zone;
    this.endpoint = options.endpoint;
    this.port = options.port;
    this.dataCenter = options.dataCenter;
    this.appname = options.appname;
    this.connectTimeout = options.connectTimeout;
    this.socketTimeout = options.socketTimeout;
    this.invokeTimeout = options.invokeTimeout;
    this.recheckInterval = options.recheckInterval;
    this.observerCallbackTimeout = options.observerCallbackTimeout;
    this.syncConfigRetryInterval = options.syncConfigRetryInterval;
    this.accessKey = options.accessKey;
    this.secretKey = options.secretKey;
    this.algorithm = options.algorithm;
    this.authCacheInterval = options.authCacheInterval;
    this.responseTimeout = options.responseTimeout;
  }

}

module.exports = RegistryConfig;
