'use strict';

const Base = require('sdk-base');
const url = require('url');
const utils = require('./util/utils');

const SERVER_SET = Symbol('ServerManager#serverSet');
const CLOSED = Symbol('ServerManager#closed');
const MIN_RETRY_INTERVAL = 10000;

/**
 * @implements {IInterval}
 */
class ServerManager extends Base {
  /**
   * @class
   * @param {object} options -
   * @param {console|Logger} options.logger -
   * @param {RegistryConfig} options.config -
   * @param {HttpClient} options.httpclient -
   */
  constructor(options) {
    super(Object.assign({}, options, { initMethod: '_init' }));
    this[CLOSED] = false;
  }

  async _init() {
    while (!this[SERVER_SET] || this[SERVER_SET].size === 0) {
      await this.syncServerList();
    }
    utils.interval(this);
  }

  close() {
    this[CLOSED] = true;
    this.emit('close');
  }

  async getServerList() {
    await this.ready();
    return Array.from(this[SERVER_SET]).map(t => {
      return url.parse(`tcp://${t}?p=1&_SERIALIZETYPE=hessian2`, true);
    });
  }

  async randomServerNode() {
    const serverNodes = await this.getServerList();
    const index = Math.floor(Math.random() * serverNodes.length);
    return serverNodes[index];
  }

  async shuffleServerList() {
    const serverList = await this.getServerList();
    const end = serverList.length;
    for (let i = 0; i < end; ++i) {
      const swapItem = Math.floor(Math.random() * end);
      const temp = serverList[i];
      serverList[i] = serverList[swapItem];
      serverList[swapItem] = temp;
    }
    return serverList;
  }

  async syncServerList() {
    try {
      const queryUrl = `http://${this.config.endpoint}:${this.config.port}/api/servers/query`;
      const { data } = await this.httpclient.request(queryUrl, {
        method: 'GET',
        data: {
          env: this.config.env,
          zone: this.config.zone,
          dataCenter: this.config.dataCenter,
          appName: this.config.appname,
          instanceId: this.config.instanceId,
        },
        dataType: 'text',
      });
      if (!data) {
        this.logger.warn('[registry] sync server list get empty');
        return;
      }
      this[SERVER_SET] = new Set(data.split(';').filter(t => t));
    } catch (e) {
      e.message = '[registry] sync server list failed: ' + e.message;
      this.logger.warn(e);
    }
  }

  get config() {
    return this.options.config;
  }

  get httpclient() {
    return this.options.httpclient;
  }

  get logger() {
    return this.options.logger;
  }

  get delay() {
    return Math.min(this.config.syncConfigRetryInterval, MIN_RETRY_INTERVAL);
  }

  get intervalFunc() {
    return this.syncServerList;
  }

  get done() {
    return this[CLOSED];
  }
}

module.exports = ServerManager;
