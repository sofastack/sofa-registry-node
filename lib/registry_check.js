'use strict';

const Base = require('sdk-base');
const TaskEvent = require('./task/task_event');
const utils = require('./util/utils');

/**
 * @implements {IInterval}
 */
class RegistryCheck extends Base {
  constructor(options) {
    super(options);
    this.closed = false;
    if (this.options.autoServe !== false) {
      utils.interval(this);
    }
  }

  recheck() {
    const registers = [
      ...this.registerCache.getAllPublisers(),
      ...this.registerCache.getAllSubscribers(),
      ...this.registerCache.getAllConfigurators(),
    ];
    const eventList = registers.filter(t => !t.isDone)
      .map(t => new TaskEvent(t));
    this.worker.scheduleAll(eventList);
  }

  close() {
    this.closed = true;
    this.emit('close');
  }

  get config() {
    return this.options.config;
  }

  get worker() {
    return this.options.worker;
  }

  get registerCache() {
    return this.options.registerCache;
  }

  get delay() {
    return this.config.recheckInterval;
  }

  get done() {
    return this.closed;
  }

  get intervalFunc() {
    return this.recheck;
  }
}

module.exports = RegistryCheck;
