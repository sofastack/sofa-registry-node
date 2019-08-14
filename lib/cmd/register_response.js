'use strict';

const BaseRegister = require('./base_cmd');

class RegisterResponse extends BaseRegister {
  get className() {
    return 'com.alipay.sofa.registry.core.model.RegisterResponse';
  }
}

module.exports = RegisterResponse;
