'use strict';

const Base = require('./base_register');
const uuid = require('uuid/v4');
const PublisherRegister = require('../cmd/publisher_register');
const TaskEvent = require('../task/task_event');

/**
 * @implements {IRegister}
 */
class Publisher extends Base {
  /**
   * @class
   * @param {object} options -
   * @param {IPubRegistration|IRegistration} options.registration -
   * @param {RegistryConfig} options.config -
   * @param {Worker} options.worker -
   * @param {Logger|Console} options.logger -
   */
  constructor(options) {
    super(options);
    this.registId = uuid();
    this.dataList = [];
  }

  republish(...data) {
    if (this.refused) {
      throw new Error('Publisher is refused by server. Please check your configuration.');
    }
    if (!this.enabled) {
      throw new Error('unregister publisher can not be reused.');
    }
    this.dataList = data;
    this.pubVersion++;
    this.timestamp = Date.now();
    this.waitToSync();
    this.worker.schedule(new TaskEvent(this));
  }

  unregister() {
    if (this.enabled) {
      super.unregister();
      this.worker.schedule(new TaskEvent(this));
    }
  }

  assembly() {
    const obj = {
      instanceId: this.config.instanceId,
      zone: this.config.zone || 'DEFAULT_ZONE',
      appName: this.registration.appname || this.config.appname,
      dataId: this.dataId,
      group: this.group,
      registId: this.registId,
      version: this.pubVersion,
      timestamp: this.timestamp,
      eventType: this.requestEventType,
    };

    // TODO set auth
    if (this.enabled) {
      if (this.dataList) {
        obj.dataList = this.dataList.map(t => ({ data: t }));
      }
    }
    return new PublisherRegister(obj);
  }

  get dataId() {
    return this.registration.dataId;
  }

  get group() {
    return this.registration.group;
  }
}

module.exports = Publisher;
