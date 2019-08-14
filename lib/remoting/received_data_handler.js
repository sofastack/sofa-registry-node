'use strict';

const BaseHandler = require('./base_handler');
const util = require('util');
const Result = require('../cmd/result');

class ReceivedDataHandler extends BaseHandler {
  handleReq(req) {
    const data = req && req.data;
    const obj = {
      success: true,
    };
    if (!data) {
      return new Result(obj);
    }
    try {
      const registIds = data.subscriberRegistIds;
      const segmentData = {
        data: data.data,
        version: data.version,
        segment: data.segment,
      };
      for (const registId of registIds) {
        const subscriber = this.registerCache.getSubscriber(registId);
        if (!subscriber) {
          continue;
        }
        subscriber.putReceivedData(segmentData, data.localZone);
        this.eventBus.emit(subscriber.eventId);
      }
      this.logger.info(
        '[registry/received] receive subscriber data save success, dataId: %s, group: %s, version: %s, data: %j, registIds: %j',
        data.dataId, data.group, data.version, data.data, registIds
      );
    } catch (e) {
      obj.success = false;
      obj.message = '';
      const msg = util.format(
        '[registry/received] receive subscriber data save failed, dataId: %s, group: %s, version: %s, data: %j, registIds: %j, error: ',
        data.dataId, data.group, data.version, data.data, data.subscriberRegistIds
      );
      e.message = msg + e.message;
      this.logger.info(e);
    }
    return new Result(obj);
  }
}

module.exports = ReceivedDataHandler;
