'use strict';

const BaseRegister = require('./base_cmd');

class ConfiguratorRegister extends BaseRegister {
  get className() {
    return 'com.alipay.sofa.registry.core.model.ConfiguratorRegister';
  }

  get timeout() {
    return this.obj.timeout || 3000;
  }
}

module.exports = ConfiguratorRegister;
