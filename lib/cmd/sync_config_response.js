'use strict';

const BaseRegister = require('./base_cmd');

class SyncConfigResponse extends BaseRegister {
  get className() {
    return 'com.alipay.sofa.registry.core.model.SyncConfigResponse';
  }
}

module.exports = SyncConfigResponse;
