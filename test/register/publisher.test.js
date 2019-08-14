'use strict';

const sinon = require('sinon');
const assert = require('assert');
const TestUtil = require('../test_util');
const Publisher = require('../../lib/register/publisher');
const { EventType } = require('../../lib/util/contants');

describe('test/register/publisher.test.js', () => {
  const sandbox = sinon.createSandbox();
  let publisher;

  beforeEach(() => {
    publisher = new Publisher({
      registration: {
        dataId: 'com.alipay.foo',
        group: 'DEFAULT',
        appname: 'test',
      },
      config: TestUtil.defaultConfig(),
      worker: TestUtil.defaultWorker(),
      logger: console,
    });
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('republish', () => {
    describe('publisher is ok', () => {
      let scheduleStub;

      beforeEach(() => {
        scheduleStub = sandbox.stub(publisher.worker, 'schedule');
      });

      it('should success', () => {
        const oldRequestId = publisher.requestId;
        publisher.republish('test1', 'test2');
        assert.deepStrictEqual(publisher.dataList, [ 'test1', 'test2' ]);
        assert(publisher.pubVersion === 1);
        assert(publisher.timestamp);
        assert(publisher.registered === false);
        assert(publisher.requestId !== oldRequestId);
        assert(scheduleStub.calledOnce);
      });
    });

    describe('publisher is refused', () => {
      beforeEach(() => {
        sandbox.stub(publisher, 'refused')
          .value(true);
      });

      it('should throw error', () => {
        try {
          publisher.republish('test');
          assert.fail('never arrive');
        } catch (e) {
          assert(/Publisher is refused by server. Please check your configuration\./.test(e.message));
        }
      });
    });

    describe('publisher is disabled', () => {
      beforeEach(() => {
        sandbox.stub(publisher, 'enabled')
          .value(false);
      });

      it('should throw error', () => {
        try {
          publisher.republish('test');
          assert.fail('never arrive');
        } catch (e) {
          assert(/unregister publisher can not be reused\./.test(e.message));
        }
      });
    });
  });

  describe('unregister', () => {
    let scheduleStub;

    beforeEach(() => {
      scheduleStub = sandbox.stub(publisher.worker, 'schedule');
    });

    it('should success', () => {
      const oldRequestId = publisher.requestId;
      publisher.unregister();
      assert(publisher.enabled === false);
      assert(publisher.pubVersion === 1);
      assert(publisher.registerCount === 0);
      assert(publisher.requestId !== oldRequestId);
      assert(scheduleStub.calledOnce);
    });
  });

  describe('assembly', () => {
    describe('register', () => {
      it('should success', () => {
        publisher.republish('test1', 'test2');
        const request = publisher.assembly();
        assert.deepStrictEqual(request.obj, {
          instanceId: 'bar',
          zone: 'DEFAULT_ZONE',
          appName: 'test',
          dataId: 'com.alipay.foo',
          group: 'DEFAULT',
          registId: publisher.registId,
          version: 1,
          timestamp: publisher.timestamp,
          eventType: EventType.REGISTER,
          dataList: [{
            data: 'test1',
          }, {
            data: 'test2',
          }],
        });
      });
    });

    describe('unregister', () => {
      it('should success', () => {
        publisher.unregister();
        const request = publisher.assembly();
        assert.deepStrictEqual(request.obj, {
          instanceId: 'bar',
          zone: 'DEFAULT_ZONE',
          appName: 'test',
          dataId: 'com.alipay.foo',
          group: 'DEFAULT',
          registId: publisher.registId,
          version: 1,
          timestamp: publisher.timestamp,
          eventType: EventType.UNREGISTER,
        });
      });
    });
  });
});
