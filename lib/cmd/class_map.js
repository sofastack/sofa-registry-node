'use strict';

module.exports = {
  'com.alipay.sofa.registry.core.model.ConfiguratorRegister': {
    instanceId: { type: 'java.lang.String' },
    zone: { type: 'java.lang.String' },
    appName: { type: 'java.lang.String' },
    dataId: { type: 'java.lang.String' },
    group: { type: 'java.lang.String' },
    processId: { type: 'java.lang.String' },
    registId: { type: 'java.lang.String' },
    clientId: { type: 'java.lang.String' },
    dataInfoId: { type: 'java.lang.String' },
    ip: { type: 'java.lang.String' },
    port: { type: 'java.lang.Integer' },
    eventType: { type: 'java.lang.String' },
    version: { type: 'java.lang.Long' },
    timestamp: { type: 'java.lang.Long' },
    attributes: {
      type: 'java.util.Map',
      generic: [
        { type: 'java.lang.String' },
        { type: 'java.lang.String' },
      ],
    },
  },
  'com.alipay.sofa.registry.core.model.DataBox': {
    data: { type: 'java.lang.String' },
  },
  'com.alipay.sofa.registry.core.model.PublisherRegister': {
    instanceId: { type: 'java.lang.String' },
    zone: { type: 'java.lang.String' },
    appName: { type: 'java.lang.String' },
    dataId: { type: 'java.lang.String' },
    group: { type: 'java.lang.String' },
    processId: { type: 'java.lang.String' },
    registId: { type: 'java.lang.String' },
    clientId: { type: 'java.lang.String' },
    dataInfoId: { type: 'java.lang.String' },
    ip: { type: 'java.lang.String' },
    port: { type: 'java.lang.Integer' },
    eventType: { type: 'java.lang.String' },
    version: { type: 'java.lang.Long' },
    timestamp: { type: 'java.lang.Long' },
    attributes: {
      type: 'java.util.Map',
      generic: [
        { type: 'java.lang.String' },
        { type: 'java.lang.String' },
      ],
    },
    dataList: {
      type: 'java.util.List',
      generic: [
        { type: 'com.alipay.sofa.registry.core.model.DataBox' },
      ],
    },
  },
  'com.alipay.sofa.registry.core.model.SubscriberRegister': {
    instanceId: { type: 'java.lang.String' },
    zone: { type: 'java.lang.String' },
    appName: { type: 'java.lang.String' },
    dataId: { type: 'java.lang.String' },
    group: { type: 'java.lang.String' },
    processId: { type: 'java.lang.String' },
    registId: { type: 'java.lang.String' },
    clientId: { type: 'java.lang.String' },
    dataInfoId: { type: 'java.lang.String' },
    ip: { type: 'java.lang.String' },
    port: { type: 'java.lang.Integer' },
    eventType: { type: 'java.lang.String' },
    version: { type: 'java.lang.Long' },
    timestamp: { type: 'java.lang.Long' },
    attributes: {
      type: 'java.util.Map',
      generic: [
        { type: 'java.lang.String' },
        { type: 'java.lang.String' },
      ],
    },
    scope: { type: 'java.lang.String' },
  },
  'com.alipay.sofa.registry.core.model.RegisterResponse': {
    success: { type: 'boolean' },
    registId: { type: 'java.lang.String' },
    version: { type: 'long' },
    refused: { type: 'boolean' },
    message: { type: 'java.lang.String' },
  },
  'com.alipay.sofa.registry.core.model.ReceivedConfigData': {
    dataId: { type: 'java.lang.String' },
    group: { type: 'java.lang.String' },
    instanceId: { type: 'java.lang.String' },
    configuratorRegistIds: {
      type: 'java.util.List',
      generic: [{
        type: 'java.lang.String',
      }],
    },
    dataBox: { type: 'com.alipay.sofa.registry.core.model.DataBox' },
    version: { type: 'java.lang.Long' },
  },
  'com.alipay.sofa.registry.core.model.ReceivedData': {
    dataId: { type: 'java.lang.String' },
    group: { type: 'java.lang.String' },
    instanceId: { type: 'java.lang.String' },
    segment: { type: 'java.lang.String' },
    scope: { type: 'java.lang.String' },
    subscriberRegisIds: {
      type: 'java.util.List',
      generic: [{
        type: 'java.lang.String',
      }],
    },
    data: {
      type: 'java.util.List',
      generic: [{
        type: 'com.alipay.sofa.registry.core.model.DataBox',
      }],
    },
    version: { type: 'java.lang.Long' },
    localZone: { type: 'java.lang.String' },
  },
  'com.alipay.sofa.registry.core.model.Result': {
    success: { type: 'boolean' },
    message: { type: 'java.lang.String' },
  },
  'com.alipay.sofa.registry.core.model.SyncConfigRequest': {
    dataCenter: { type: 'java.lang.String' },
    zone: { type: 'java.lang.String' },
  },
  'com.alipay.sofa.registry.core.model.SyncConfigResponse': {
    availableSegments: {
      type: 'java.util.List',
      generic: [{
        type: 'java.lang.String',
      }],
    },
    retryInterval: { type: 'int' },
  },
};
