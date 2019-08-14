'use strict';

const uuid = require('uuid/v4');
const ConfiguratorRegister = require('../cmd/configurator_register');
const BaseRegister = require('./base_register');
const TaskEvent = require('../task/task_event');
const EVENT_ID = Symbol('Configurator#eventId');

/**
 * @implements {IRegister}
 */
class Configurator extends BaseRegister {
  /**
   * @class
   * @param {object} options -
   * @param {IConfRegistration|IRegistration} options.registration -
   * @param {RegistryConfig} options.config -
   * @param {Worker} options.worker -
   * @param {EventEmitter} options.eventBus -
   * @param {Logger|Console} options.logger -
   */
  constructor(options) {
    super(options);
    this.registId = uuid();
    this.init = false;
    /** @type {IConfiguratorData|null} */
    this.configuratorData = null;
    this.notifyHandler = this.notify.bind(this);
    this.eventBus.on(this.eventId, this.notifyHandler);
  }

  peekData() {
    const data = this.configuratorData
      && this.configuratorData.dataBox
      && this.configuratorData.dataBox.data;
    return { data };
  }

  assembly() {
    const obj = {
      // instanceId: this.config.instanceId,
      zone: this.config.zone || 'DEFAULT_ZONE',
      appName: this.registration.appname || this.config.appname,
      dataId: this.dataId,
      group: this.group,
      registId: this.registId,
      version: this.pubVersion,
      timestamp: this.timestamp,
      eventType: this.requestEventType,
    };
    // TODO auth
    return new ConfiguratorRegister(obj);
  }

  /**
   * @param {object} data -
   * @param {number} data.version -
   * @param {IDataBox} data.dataBox -
   */
  putConfiguratorData(data) {
    data.version = data.version || 0;
    if (!this.configuratorData || data.version > this.configuratorData.data) {
      this.configuratorData = data;
      this.init = true;
    }
  }

  unregister() {
    if (this.enabled) {
      super.unregister();
      this.worker.schedule(new TaskEvent(this));
      this.eventBus.removeListener(this.eventId, this.notifyHandler);
    }
  }

  notify() {
    const start = Date.now();
    const dataId = this.dataId;
    try {
      const data = this.peekData();
      for (const listener of this.registration.listeners) {
        listener(data);
      }
      this.logger.info('[registry/notify] notify configurator success, dataId: %s, registId: %s, cost: %sms',
        dataId, this.registId, Date.now() - start);
    } catch (e) {
      e.message = `[registry/notify] notify configurator dataId: ${dataId} error: ${e.message}`;
      this.logger.error(e);
    }
  }

  addListener(listener) {
    this.registration.listeners.push(listener);
  }

  get dataId() {
    return this.registration.dataId;
  }

  get group() {
    return this.registration.group;
  }

  get eventId() {
    if (!this[EVENT_ID]) {
      this[EVENT_ID] = 'configurator:' + this.dataId;
    }
    return this[EVENT_ID];
  }

  get eventBus() {
    return this.options.eventBus;
  }
}

module.exports = Configurator;
