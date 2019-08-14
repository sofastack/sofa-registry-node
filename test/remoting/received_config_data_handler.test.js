'use strict';

const EventEmitter = require('events');
const assert = require('assert');
const sinon = require('sinon');
const Configurator = require('../../lib/register/configurator');
const TestUtil = require('../test_util');
const RegisterCache = require('../../lib/register_cache');
const ReceivedConfigDataHandler = require('../../lib/remoting/received_config_data_handler');

describe('test/remoting/received_config_data_handler', () => {
  let handler;
  let registerCache;
  let eventBus;
  const sandbox = sinon.createSandbox();

  beforeEach(() => {
    registerCache = new RegisterCache();
    eventBus = new EventEmitter();
    handler = new ReceivedConfigDataHandler({
      registerCache,
      eventBus,
      logger: console,
    });
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('handle req', () => {
    describe('data is empty', () => {
      it('should success', () => {
        const res = handler.handleReq({ data: null });
        assert(res.obj.success === true);
      });
    });

    describe('have configurator', () => {
      let configurator;
      let putConfiguratorDataMock;

      beforeEach(() => {
        configurator = new Configurator({
          registration: {
            dataId: 'com.alipay.foo',
            listeners: [],
            scope: 'zone',
            group: 'DEFAULT',
            appname: 'test',
          },
          config: TestUtil.defaultConfig(),
          worker: TestUtil.defaultWorker(),
          eventBus,
          logger: console,
        });
        registerCache.addConfigurator(configurator);
        putConfiguratorDataMock = sandbox.mock(configurator)
          .expects('putConfiguratorData')
          .withExactArgs({
            dataBox: {
              data: 'test_config_data',
            },
            version: 10,
          });
        sandbox.stub(eventBus, 'emit');
      });

      it('should success', () => {
        const res = handler.handleReq({
          data: {
            dataId: 'com.alipay.foo',
            group: 'DEFAULT',
            instanceId: 'DEFAULT_INSTANCE_ID',
            configuratorRegistIds: [ configurator.registId ],
            version: 10,
            dataBox: { data: 'test_config_data' },
          },
        });
        putConfiguratorDataMock.verify();
        assert(res.obj.success === true);
      });
    });

    describe('have no configurator', () => {
      it('should success', () => {
        const res = handler.handleReq({
          data: {
            dataId: 'com.alipay.foo',
            group: 'DEFAULT',
            instanceId: 'DEFAULT_INSTANCE_ID',
            configuratorRegistIds: [ 'never-found-registId' ],
            version: 10,
            dataBox: { data: 'test_config_data' },
          },
        });
        assert(res.obj.success === true);
      });
    });

    describe('handle failed', () => {
      let configurator;
      let infoSpy;

      beforeEach(() => {
        configurator = new Configurator({
          registration: {
            dataId: 'com.alipay.foo',
            listeners: [],
            scope: 'zone',
            group: 'DEFAULT',
            appname: 'test',
          },
          config: TestUtil.defaultConfig(),
          worker: TestUtil.defaultWorker(),
          eventBus,
          logger: console,
        });
        registerCache.addConfigurator(configurator);
        sandbox.stub(configurator, 'putConfiguratorData')
          .throws(new Error('mock error'));
        infoSpy = sandbox.spy(console, 'info');
      });

      it('should success', () => {
        const res = handler.handleReq({
          data: {
            dataId: 'com.alipay.foo',
            group: 'DEFAULT',
            instanceId: 'DEFAULT_INSTANCE_ID',
            configuratorRegistIds: [ configurator.registId ],
            version: 10,
            dataBox: { data: 'test_config_data' },
          },
        });
        assert(res.obj.success === false);
        const e = infoSpy.getCall(0).args[0];
        assert(/\[registry\/received] receive configurator data save failed, dataId: com.alipay.foo, version: 10, data: {"data":"test_config_data"}, registIds: \["\w{8}-\w{4}-\w{4}-\w{4}-\w{12}"]/.test(e.message));
      });
    });
  });
});
