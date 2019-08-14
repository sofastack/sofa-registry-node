'use strict';

const BaseRegister = require('./base_cmd');

class SyncConfigRequest extends BaseRegister {
  get className() {
    return 'com.alipay.sofa.registry.core.model.SyncConfigRequest';
  }

  get timeout() {
    return this.obj.timeout || 3000;
  }
}

module.exports = SyncConfigRequest;
