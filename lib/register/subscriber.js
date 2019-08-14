'use strict';

const uuid = require('uuid/v4');
const BaseRegister = require('./base_register');
const TaskEvent = require('../task/task_event');
const SubscribeRegister = require('../cmd/subscriber_register');
const EVENT_ID = Symbol('Subscriber#eventId');

/**
 * @extends {BaseRegister}
 */
class Subscriber extends BaseRegister {
  /**
   * @class
   * @param {object} options -
   * @param {ISubRegistration|IRegistration} options.registration -
   * @param {RegistryConfig} options.config -
   * @param {Worker} options.worker -
   * @param {EventEmitter} options.eventBus -
   * @param {Logger|Console} options.logger -
   */
  constructor(options) {
    super(options);
    this.registId = uuid();
    this.pubVersion++;
    this.localZone = this.config.zone;
    /** @type {Map<String, ISegment>} */
    this.data = new Map();
    this.availableSegments = [];
    this.notifyHandler = this.notify.bind(this);
    this.eventBus.on(this.eventId, this.notifyHandler);
  }

  peekData() {
    const zoneMap = {};
    const userData = {
      localZone: null,
      zoneData: zoneMap,
    };
    if (!this.init) {
      return userData;
    }
    userData.localZone = this.localZone || this.config.zone;
    for (const [ segment, segmentData ] of this.data) {
      // // only accept available segments, when available segments is empty accept all
      if (this.availableSegments.length && !this.availableSegments.includes(segment)) {
        continue;
      }
      const zones = Object.keys(segmentData.data);
      for (const zone of zones) {
        const dataList = segmentData.data[ zone ];
        const resultList = zoneMap[zone] || [];
        for (const { data } of dataList) {
          resultList.push(data);
        }
        zoneMap[zone] = resultList;
      }
    }
    return userData;
  }

  notify() {
    const start = Date.now();
    const dataId = this.dataId;
    try {
      const data = this.peekData();
      for (const listener of this.registration.listeners) {
        listener(data);
      }
      this.logger.info('[registry/notify] notify subscriber success, dataId: %s, registId: %s, cost: %sms',
        dataId, this.registId, Date.now() - start);
    } catch (e) {
      e.message = `[registry/notify] notify subscriber dataId: ${dataId} error: ${e.message}`;
      this.logger.error(e);
    }
  }

  unregister() {
    if (this.enabled) {
      super.unregister();
      this.worker.schedule(new TaskEvent(this));
      this.eventBus.removeListener(this.eventId, this.notifyHandler);
    }
  }

  assembly() {
    this.registration.scope = this.registration.scope || 'zone';
    const obj = {
      instanceId: this.config.instanceId,
      zone: this.config.zone || 'DEFAULT_ZONE',
      appName: this.registration.appname || this.config.appname,
      dataId: this.dataId,
      group: this.group,
      registId: this.registId,
      version: this.pubVersion,
      timestamp: this.timestamp,
      scope: this.registration.scope,
      eventType: this.requestEventType,
    };
    // TODO auth
    return new SubscribeRegister(obj);
  }

  /**
   * @param {ISegment} segmentData -
   * @param {string} localZone -
   */
  putReceivedData(segmentData, localZone) {
    this.putSegmentData(segmentData);
    this.localZone = localZone;
  }

  /**
   * @param {ISegment} segmentData -
   */
  putSegmentData(segmentData) {
    if (!segmentData) {
      return;
    }
    const existsData = this.data.get(segmentData.segment);
    if (!existsData) {
      this.data.set(segmentData.segment, segmentData);
      this.init = true;
      return;
    }
    if (existsData.version < segmentData.version) {
      this.data.set(segmentData.segment, segmentData);
    }
    this.init = true;
  }

  addListener(listener) {
    this.registration.listeners.push(listener);
  }

  get dataId() {
    return this.registration.dataId;
  }

  get eventId() {
    if (!this[ EVENT_ID ]) {
      this[ EVENT_ID ] = 'subscriber' + this.registration.dataId;
    }
    return this[ EVENT_ID ];
  }

  get group() {
    return this.registration.group;
  }

  get eventBus() {
    return this.options.eventBus;
  }

  get scope() {
    return this.registration.scope;
  }
}

module.exports = Subscriber;
