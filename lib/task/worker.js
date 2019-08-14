'use strict';

const Base = require('sdk-base');
const TaskQueue = require('./task_queue');
const util = require('util');
const uuidV4 = require('uuid/v4');

class Worker extends Base {
  /**
   * @class
   * @param {object} options -
   * @param {RequestCache} options.registerCache -
   * @param {RegistryConfig} options.config -
   * @param {RpcClient} options.client -
   * @param {Logger|Console} options.logger -
   * @param {boolean} options.autoServe - default true
   */
  constructor(options) {
    super(options);
    this.requestQueue = new TaskQueue();
    this.closed = false;
    if (this.options.autoServe !== false) {
      this.handle();
    }
  }

  close() {
    this.closed = true;
    this.requestQueue.close();
    this.emit('close');
  }

  schedule(event) {
    this.requestQueue.put(event);
    this.signal();
  }

  scheduleAll(events) {
    this.requestQueue.putAll(events);
  }

  async handle() {
    await this.client.ready();
    while (!this.closed) {
      try {
        if (!this.requestQueue.isEmpty()) {
          for (const event of this.requestQueue) {
            const sendCount = event.incSendCount();
            if (sendCount !== 1 && event.delayTime() > 0) {
              continue;
            }
            await this.handleTask(event);
          }
        }
        this.requestQueue.cleanCompletedTasks();
        // 需要等待 timeout 或者 信号, 所以不用 utils.interval
        await this.awaitBellOrSleep(this.config.recheckInterval);
      } catch (e) {
        e.message = '[register/send] handle data error: ' + e.message;
        this.logger.error(e);
      }
    }
  }

  async handleTask(event) {
    try {
      event.triggerTime = Date.now();
      const register = event.source;
      const syncTask = register.assembleSyncTask();
      const requestId = syncTask.requestId;
      if (syncTask.done) {
        this.logger.warn('[register] register already sync succeeded: %j', syncTask);
        return;
      }
      const request = syncTask.request;
      const response = await this.client.invoke(request);
      if (!response.success) {
        this.logger.info('[register] register to server failed, %j, %j', request, response);
        return;
      }
      const syncOk = register.syncOk(requestId, response.version, response.refused);
      if (!syncOk) {
        this.logger.info('[register] requestId has expired, ignore this response, %s, %j %j', requestId, request, response);
        return;
      }
      if (!register.enabled) {
        this.registerCache.remove(register.registId);
      }
      if (response.refused) {
        this.logger.info('[register] register refused by server, %s, %j, %j', requestId, request, response);
      } else {
        this.logger.info('[register] register to server success, %s, %j, %j', requestId, request, response);
      }
    } catch (e) {
      e.message = util.format('[register/send] handle request failed %j : ', event) + e.message;
      this.logger.error(e);
    }
  }

  signal() {
    this.emit('bell');
  }

  async awaitBellOrSleep(timeout) {
    const uuid = uuidV4(); // 这里主要保证 timer 不冲突
    const eventKey = 'timeout_' + uuid;
    const timer = setTimeout(() => {
      this.emit(eventKey);
    }, timeout);
    await this.awaitFirst([ 'close', 'bell', eventKey ]);
    clearTimeout(timer);
  }

  get config() {
    return this.options.config;
  }

  get client() {
    return this.options.client;
  }

  get registerCache() {
    return this.options.registerCache;
  }

  get logger() {
    return this.options.logger;
  }
}

module.exports = Worker;
