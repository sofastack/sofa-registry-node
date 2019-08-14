'use strict';

const BaseRegister = require('./base_cmd');

class Result extends BaseRegister {
  get className() {
    return 'com.alipay.sofa.registry.core.model.Result';
  }
}

module.exports = Result;
