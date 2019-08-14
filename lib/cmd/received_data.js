'use strict';

const BaseRegister = require('./base_cmd');

class ReceivedData extends BaseRegister {
  get className() {
    return 'com.alipay.sofa.registry.core.model.ReceivedData';
  }
}

module.exports = ReceivedData;
