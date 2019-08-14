'use strict';

const Base = require('sdk-base');
const uuid = require('uuid/v4');
const assert = require('assert');
const { EventType } = require('../util/contants');

/**
 * @implements {IRegister}
 */
class BaseRegister extends Base {
  /**
   * @class
   * @param {object} options -
   * @param {IRegistration} options.registration -
   * @param {RegistryConfig} options.config -
   * @param {Worker} options.worker -
   * @param {Logger|Console} options.logger -
   */
  constructor(options) {
    super(options);
    this.initialVersion = 0;
    this.registered = false;
    this.enabled = true;
    this.refused = false;
    this.pubVersion = 0;
    this._ackVersion = 0;
    this.timestamp = Date.now();
    this.registerCount = 0;
    this.requestId = uuid();
  }

  /* istanbul ignore next */
  assembly() {
    assert.fail('not implement');
  }

  waitToSync() {
    this.registered = false;
    this.requestId = uuid();
  }

  syncOk(requestId, version, refused) {
    if (this.requestId !== requestId) {
      return false;
    }
    this.registered = true;
    this.refused = refused;
    this.ackVersion = version;
    return true;
  }

  set ackVersion(val) {
    if (val === null) {
      return;
    }
    const current = this._ackVersion;
    if (val <= current) {
      return;
    }
    this._ackVersion = val;
  }

  get ackVersion() {
    return this._ackVersion;
  }

  get isDone() {
    return this.registered && this.pubVersion === this.ackVersion || this.refused;
  }

  assembleSyncTask() {
    return {
      requestId: this.requestId,
      request: this.assembly(),
      done: this.isDone,
    };
  }

  reset() {
    this.registered = false;
    this.registerCount = 0;
    this.timestamp = Date.now();
    this._ackVersion = this.initialVersion;
    this.requestId = uuid();
  }

  unregister() {
    this.enabled = false;
    this.pubVersion++;
    this.requestId = uuid();
    this.registerCount = 0;
  }

  setAuthSignature() {
    // TODO impl auth
  }

  get registration() {
    return this.options.registration;
  }

  get config() {
    return this.options.config;
  }

  get worker() {
    return this.options.worker;
  }

  get logger() {
    return this.options.logger;
  }

  get requestEventType() {
    return this.enabled ? EventType.REGISTER : EventType.UNREGISTER;
  }
}

module.exports = BaseRegister;
