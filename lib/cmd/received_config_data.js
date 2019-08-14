'use strict';

const BaseRegister = require('./base_cmd');

class ReceivedConfigData extends BaseRegister {
  get className() {
    return 'com.alipay.sofa.registry.core.model.ReceivedConfigData';
  }
}

module.exports = ReceivedConfigData;
