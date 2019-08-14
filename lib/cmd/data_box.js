'use strict';

const BaseRegister = require('./base_cmd');

class DataBox extends BaseRegister {
  get className() {
    return 'com.alipay.sofa.registry.core.model.DataBox';
  }
}

module.exports = DataBox;
