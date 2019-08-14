'use strict';

const { codec: codecMap, BaseRpcCmd } = require('sofa-bolt-node');

class BaseCmd extends BaseRpcCmd {
  serializeHeader() {}

  serializeContent(byteBuffer) {
    const codec = codecMap[this.codecType];
    codec.encode(byteBuffer, this);
  }
}

module.exports = BaseCmd;
