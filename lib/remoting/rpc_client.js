'use strict';

const assert = require('assert');
const Base = require('sdk-base');
const Client = require('sofa-bolt-node').RpcClient;
const util = require('util');
const sleep = require('mz-modules/sleep');
const TaskEvent = require('../task/task_event');

const RECONNECTING_DELAY = 5000;

class RpcClient extends Base {
  /**
   * @class
   * @param {object} options -
   * @param {Logger|Console} options.logger -
   * @param {ServerManager} options.serverManager -
   * @param {RegisterCache} options.registerCache -
   * @param {RegistryConfig} options.config -
   * @param {Map<string, IRequestHandler>} options.handlerMap -
   */
  constructor(options) {
    assert(options.serverManager);
    assert(options.logger);
    assert(options.config);
    super(Object.assign({}, options, { initMethod: '_init' }));
    this.closed = false;
    this.requestHandler = this._handleRequest.bind(this);
    this._worker = null;
  }

  close() {
    this.closed = true;
    return this.client && this.client.close();
  }

  async _init() {
    await this.serverManager.ready();
    await this._createClient();
  }

  async _connect() {
    // shuffle server list to make server connections as discrete as possible
    const serverList = await this.serverManager.shuffleServerList();
    for (const server of serverList) {
      try {
        const client = new Client({
          logger: this.logger,
          address: server,
          connectTimeout: this.config.connectTimeout,
        });
        await client.ready();
        this.logger.info('[registry/connection] Successfully connected to server: %s', server.href);
        return client;
      } catch (e) {
        e.message = util.format('[registry/connection] Failed connected to server %s : ', server.href) + e.message;
        this.logger.error(e);
      }
      await sleep(Math.floor(Math.random() * RECONNECTING_DELAY));
    }
    // 全部未连接成功需要重试
    await sleep(RECONNECTING_DELAY);
    return this._connect();
  }

  async _createClient() {
    this.client = await this._connect();
    this.client.once('error', e => {
      e.message = `[registry/connection] client ${this.client.address.href} error: ` + e.message;
      this.logger.error(e);
    });
    this.client.once('close', () => {
      if (this.closed === true) {
        return;
      }
      this.client.removeListener('request', this.requestHandler);
      this.client = null;
      this.ready(false);
      this._createClient();
    });
    this.client.on('request', this.requestHandler);
    this.resetRegister();
    this.ready(true);
  }

  _handleRequest(req) {
    const handler = this.handlerMap[req.className];
    if (!handler) {
      this.logger.warn('[registry/connection] can not handle class: %s, request: %j', req.className, req);
      return;
    }
    try {
      const res = handler.handleReq(req);
      this.client.response(req, res);
    } catch (e) {
      const reqStr = util.format('%j', req);
      e.message = `[registry/connection] handle class: ${req.className} request: ${reqStr} error: ${e.message}`;
      this.logger.error(e);
    }
  }

  resetRegister() {
    const registers = [
      ...this.registerCache.getAllPublisers(),
      ...this.registerCache.getAllSubscribers(),
      ...this.registerCache.getAllConfigurators(),
    ];
    const eventList = registers.map(t => {
      t.reset();
      return new TaskEvent(t);
    });
    if (this._worker) {
      this._worker.scheduleAll(eventList);
    }
  }

  async invoke(request) {
    await this.ready();
    request.options.timeout = request.timeout || this.config.invokeTimeout;
    const res = await this.client.invoke(request);
    return res.data;
  }

  get logger() {
    return this.options.logger;
  }

  get serverManager() {
    return this.options.serverManager;
  }

  get handlerMap() {
    return this.options.handlerMap;
  }

  get registerCache() {
    return this.options.registerCache;
  }

  set worker(val) {
    this._worker = val;
  }

  get config() {
    return this.options.config;
  }
}

module.exports = RpcClient;
