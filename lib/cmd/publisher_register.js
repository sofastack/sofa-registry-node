'use strict';

const BaseRegister = require('./base_cmd');

class PublisherRegister extends BaseRegister {
  get className() {
    return 'com.alipay.sofa.registry.core.model.PublisherRegister';
  }

  get timeout() {
    return this.obj.timeout || 3000;
  }
}

module.exports = PublisherRegister;
