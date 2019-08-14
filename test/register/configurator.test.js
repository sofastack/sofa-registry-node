'use strict';

const assert = require('assert');
const sinon = require('sinon');
const EventEmitter = require('events');
const Configurator = require('../../lib/register/configurator');
const TestUtil = require('../test_util');
const { EventType } = require('../../lib/util/contants');

describe('test/register/configurator.test.js', () => {
  const sandbox = sinon.createSandbox();
  let configurator;

  beforeEach(() => {
    configurator = new Configurator({
      registration: {
        dataId: 'com.alipay.foo',
        scope: 'zone',
        appname: 'test',
        listeners: [],
      },
      config: TestUtil.defaultConfig(),
      worker: TestUtil.defaultWorker(),
      eventBus: new EventEmitter(),
      logger: console,
    });
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('peekData', () => {
    beforeEach(() => {
      configurator.putConfiguratorData({
        version: 1,
        dataBox: {
          data: 'test_val',
        },
      });
    });

    it('should get data', () => {
      const { data } = configurator.peekData();
      assert(data === 'test_val');
    });
  });

  describe('assembly', () => {
    it('should success', () => {
      const request = configurator.assembly();
      assert(request.obj, {
        instanceId: 'bar',
        zone: 'DEFAULT_ZONE',
        appName: 'test',
        dataId: 'com.alipay.foo',
        group: 'DEFAULT',
        registId: configurator.registId,
        version: 0,
        timestamp: configurator.timestamp,
        eventType: EventType.REGISTER,
      });
    });
  });

  describe('unregister', () => {
    beforeEach(() => {
      sandbox.stub(configurator.worker, 'schedule');
    });

    it('should success', () => {
      const oldRequestId = configurator.requestId;
      configurator.unregister();
      assert(configurator.enabled === false);
      assert(configurator.pubVersion === 1);
      assert(configurator.requestId !== oldRequestId);
      assert(configurator.registerCount === 0);
    });
  });

  describe('putConfiguratorData', () => {
    describe('configurator.configuratorData not exists', () => {
      it('should success', () => {
        const data = {
          version: 1,
          dataBox: {
            data: 'test_val',
          },
        };
        configurator.putConfiguratorData(data);
        assert.deepStrictEqual(configurator.configuratorData, data);
        assert(configurator.init === true);
      });
    });

    describe('configurator.configuratorData version gt than data version', () => {
      let oldData;
      beforeEach(() => {
        oldData = {
          version: 2,
          dataBox: {
            data: 'test_val',
          },
        };
        configurator.putConfiguratorData(oldData);
      });
      it('should not work', () => {
        const data = {
          version: 1,
          dataBox: {
            data: 'test_val2',
          },
        };
        configurator.putConfiguratorData(data);
        assert(configurator.configuratorData, oldData);
        assert(configurator.init === true);
      });
    });
  });

  describe('notify', () => {
    beforeEach(() => {
      const data = {
        version: 1,
        dataBox: {
          data: 'test_val',
        },
      };
      configurator.putConfiguratorData(data);
    });
    describe('listener success', () => {
      let infoSpy;

      beforeEach(() => {
        infoSpy = sandbox.spy(console, 'info');
      });

      it('should success', () => {
        configurator.notify();
        const msg = infoSpy.getCall(0).args[0];
        assert(/\[registry\/notify] notify configurator success, dataId: %s, registId: %s, cost: %sms/.test(msg));
      });
    });

    describe('listener failed', () => {
      let errorSpy;

      beforeEach(() => {
        errorSpy = sandbox.spy(console, 'error');
        configurator.addListener(() => {
          throw new Error('mock error');
        });
      });

      it('should success', () => {
        configurator.notify();
        const msg = errorSpy.getCall(0).args[0];
        assert(/\[registry\/notify] notify configurator dataId: com.alipay.foo error: mock error/.test(msg));
      });
    });
  });
});
