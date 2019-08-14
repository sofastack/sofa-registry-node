'use strict';

const BaseRegister = require('./base_cmd');

class SubscriberRegister extends BaseRegister {
  get className() {
    return 'com.alipay.sofa.registry.core.model.SubscriberRegister';
  }

  get timeout() {
    return this.obj.timeout || 3000;
  }
}

module.exports = SubscriberRegister;
