'use strict';

const BaseHandler = require('./base_handler');
const util = require('util');
const Result = require('../cmd/result');

class ReceivedConfigDataHandler extends BaseHandler {
  handleReq(req) {
    const data = req && req.data;
    const obj = {
      success: true,
    };
    if (!data) {
      return new Result(obj);
    }
    try {
      const registIds = data.configuratorRegistIds;
      const configuratorData = {
        version: data.version,
        dataBox: data.dataBox,
      };
      for (const registId of registIds) {
        const configurator = this.registerCache.getConfigurator(registId);
        if (!configurator) {
          continue;
        }
        configurator.putConfiguratorData(configuratorData);
        this.eventBus.emit(configurator.eventId);
      }
      this.logger.info(
        '[registry/received] receive configurator data save success, dataId: %s, version: %s, data: %j, registIds: %j',
        data.dataId, data.version, data.dataBox, registIds
      );
    } catch (e) {
      obj.success = false;
      obj.message = '';
      const msg = util.format(
        '[registry/received] receive configurator data save failed, dataId: %s, version: %s, data: %j, registIds: %j, error: ',
        data.dataId, data.version, data.dataBox, data.configuratorRegistIds
      );
      e.message = msg + e.message;
      this.logger.info(e);
    }
    return new Result(obj);
  }
}

module.exports = ReceivedConfigDataHandler;
