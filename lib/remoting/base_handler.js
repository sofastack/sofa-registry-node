'use strict';

const assert = require('assert');

/**
 * @implements {IRequestHandler}
 */
class BaseHandler {
  /**
   * @class
   * @param {object} options -
   * @param {RegisterCache} options.registerCache -
   * @param {EventEmitter} options.eventBus -
   * @param {Logger|Console} options.logger -
   */
  constructor(options) {
    this.registerCache = options.registerCache;
    this.eventBus = options.eventBus;
    this.logger = options.logger;
  }

  /* istanbul ignore next */
  async handleReq() {
    assert.fail('not implement');
  }
}

module.exports = BaseHandler;
