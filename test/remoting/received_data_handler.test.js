'use strict';

const EventEmitter = require('events');
const assert = require('assert');
const sinon = require('sinon');
const Subscriber = require('../../lib/register/subscriber');
const TestUtil = require('../test_util');
const RegisterCache = require('../../lib/register_cache');
const ReceivedDataHandler = require('../../lib/remoting/received_data_handler');

describe('test/remoting/received/data_handler.test.js', () => {
  let handler;
  let registerCache;
  let eventBus;
  const sandbox = sinon.createSandbox();

  beforeEach(() => {
    registerCache = new RegisterCache();
    eventBus = new EventEmitter();
    handler = new ReceivedDataHandler({
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

    describe('have subscriber', () => {
      let subscriber;
      let putReceivedDataMock;

      beforeEach(() => {
        subscriber = new Subscriber({
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
        registerCache.addSubscriber(subscriber);
        putReceivedDataMock = sandbox.mock(subscriber)
          .expects('putReceivedData')
          .withExactArgs({
            data: {
              DEFAULT_ZONE: [{ data: '6091f218eb' }],
            },
            version: 1542181694604,
            segment: 'sit-test-A',
          }, 'DEFAULT_ZONE');
      });

      it('should success', () => {
        const res = handler.handleReq({
          data: {
            dataId: 'com.alipay.foo',
            group: 'DEFAULT',
            instanceId: 'DEFAULT_INSTANCE_ID',
            segment: 'sit-test-A',
            scope: 'zone',
            version: 1542181694604,
            localZone: 'DEFAULT_ZONE',
            subscriberRegistIds: [ subscriber.registId ],
            data: {
              DEFAULT_ZONE: [{ data: '6091f218eb' }],
            },
          },
        });
        putReceivedDataMock.verify();
        assert(res.obj.success === true);
      });
    });

    describe('have no subscriber', () => {
      it('should success', () => {
        const res = handler.handleReq({
          data: {
            dataId: 'com.alipay.foo',
            group: 'DEFAULT',
            instanceId: 'DEFAULT_INSTANCE_ID',
            segment: 'sit-test-A',
            scope: 'zone',
            version: 1542181694604,
            localZone: 'DEFAULT_ZONE',
            subscriberRegistIds: [ 'never-found-registId' ],
            data: {
              DEFAULT_ZONE: [{ data: '6091f218eb' }],
            },
          },
        });
        assert(res.obj.success === true);
      });
    });

    describe('handle failed', () => {
      let subscriber;
      let infoSpy;

      beforeEach(() => {
        subscriber = new Subscriber({
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
        registerCache.addSubscriber(subscriber);
        sandbox.stub(subscriber, 'putReceivedData')
          .throws(new Error('mock error'));
        infoSpy = sandbox.spy(console, 'info');
      });

      it('should success', () => {
        const res = handler.handleReq({
          data: {
            dataId: 'com.alipay.foo',
            group: 'DEFAULT',
            instanceId: 'DEFAULT_INSTANCE_ID',
            segment: 'sit-test-A',
            scope: 'zone',
            version: 1542181694604,
            localZone: 'DEFAULT_ZONE',
            subscriberRegistIds: [ subscriber.registId ],
            data: {
              DEFAULT_ZONE: [{ data: '6091f218eb' }],
            },
          },
        });
        assert(res.obj.success === false);
        const e = infoSpy.getCall(0).args[0];
        assert(/\[registry\/received] receive subscriber data save failed, dataId: com.alipay.foo, group: DEFAULT, version: 1542181694604, data: {"DEFAULT_ZONE":\[{"data":"6091f218eb"}]}, registIds: \["\w{8}-\w{4}-\w{4}-\w{4}-\w{12}"], error: mock error/.test(e.message));
      });
    });
  });
});
