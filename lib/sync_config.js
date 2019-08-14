'use strict';

const Base = require('sdk-base');
const util = require('util');
const utils = require('./util/utils');
const SyncConfigRequest = require('./cmd/sync_config_request');

/**
 * @implements {IInterval}
 */
class SyncConfig extends Base {
  /**
   * @class
   * @param {object} options -
   * @param {boolean} options.autoServe -
   * @param {RegisterCache} options.registerCache -
   * @param {RegistryConfig} options.config -
   * @param {EventEmitter} options.eventBus -
   * @param {Logger|Console} options.logger -
   * @param {RpcClient} options.client -
   */
  constructor(options) {
    super(options);
    this.closed = false;
    this.retryInterval = this.config.syncConfigRetryInterval;
    if (options.autoServe !== false) {
      utils.interval(this);
    }
  }

  close() {
    this.closed = true;
    this.emit('close');
  }

  async syncConfig() {
    try {
      await this.client.ready();
      const request = new SyncConfigRequest({
        dataCenter: this.config.dataCenter,
        zone: this.config.zone,
      });
      const response = await this.client.invoke(request);
      if (!response.success) {
        this.logger.warn('[registry/syncConfig] request failed %j', response);
        return;
      }
      this.retryInterval = Math.max(this.retryInterval, response.retryInterval);
      const availableSegments = response.availableSegments;
      const allSubscribers = this.registerCache.getAllSubscribers();
      for (const subscriber of allSubscribers) {
        try {
          if (this.isEqualSegments(availableSegments, subscriber.availableSegments)) {
            continue;
          }
          subscriber.availableSegments = availableSegments;
          this.eventBus.emit(subscriber.eventId);
        } catch (e) {
          const msg = util.format(
            '[registry/syncConfig] try notify subscriber registId: %s, availableSegments: %j, error: ',
            subscriber.registId, availableSegments
          );
          e.message = msg + e.message;
          this.logger.error(e);
        }
      }
    } catch (e) {
      e.message = `[registry/syncConfig] sync config error, retryInterval: ${this.retryInterval} error: ${e.message}`;
      this.logger.error(e);
    }
  }

  isEqualSegments(a, b) {
    a = a || [];
    b = b || [];
    if (a.length !== b.length) {
      return false;
    }
    for (let i = 0; i < a.length; ++i) {
      if (a[i] !== b[i]) {
        return false;
      }
    }
    return true;
  }

  get client() {
    return this.options.client;
  }

  get registerCache() {
    return this.options.registerCache;
  }

  get config() {
    return this.options.config;
  }

  get eventBus() {
    return this.options.eventBus;
  }

  get logger() {
    return this.options.logger;
  }

  get done() {
    return this.closed;
  }

  get delay() {
    return this.retryInterval;
  }

  get intervalFunc() {
    return this.syncConfig;
  }
}

module.exports = SyncConfig;
