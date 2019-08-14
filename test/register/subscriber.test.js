'use strict';

const EventEmitter = require('events');
const assert = require('assert');
const sinon = require('sinon');
const sleep = require('mz-modules/sleep');
const Subscriber = require('../../lib/register/subscriber');
const TestUtil = require('../test_util');
const { EventType } = require('../../lib/util/contants');

describe('test/subscriber.test.js', () => {
  const sandbox = sinon.createSandbox();
  let subscriber;

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
      eventBus: new EventEmitter(),
      logger: console,
    });
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('assembly', () => {
    describe('register', () => {
      it('should success', () => {
        const request = subscriber.assembly();
        assert.deepStrictEqual(request.obj, {
          instanceId: 'bar',
          zone: 'DEFAULT_ZONE',
          appName: 'test',
          dataId: 'com.alipay.foo',
          group: 'DEFAULT',
          registId: subscriber.registId,
          version: 1,
          timestamp: subscriber.timestamp,
          scope: 'zone',
          eventType: EventType.REGISTER,
        });
      });
    });

    describe('unregister', () => {
      it('should success', () => {
        subscriber.enabled = false;
        const request = subscriber.assembly();
        assert.deepStrictEqual(request.obj, {
          instanceId: 'bar',
          zone: 'DEFAULT_ZONE',
          appName: 'test',
          dataId: 'com.alipay.foo',
          group: 'DEFAULT',
          registId: subscriber.registId,
          version: 1,
          timestamp: subscriber.timestamp,
          scope: 'zone',
          eventType: EventType.UNREGISTER,
        });
      });
    });
  });

  describe('unregister', () => {
    beforeEach(() => {
      sandbox.stub(subscriber.worker, 'schedule');
    });

    it('should success', () => {
      const oldRequestId = subscriber.requestId;
      subscriber.unregister();
      assert(subscriber.enabled === false);
      assert(subscriber.pubVersion === 2);
      assert(subscriber.requestId !== oldRequestId);
      assert(subscriber.registerCount === 0);
    });
  });

  describe('putReceivedData', () => {
    describe('exists data', () => {
      describe('put version gt current version', () => {
        beforeEach(() => {
          subscriber.putReceivedData({
            version: 1,
            segment: 'sit-test-A',
            data: {
              DEFAULT_ZONE: [{ data: 'test_val' }],
            },
          }, 'DEFAULT_ZONE');
        });

        it('should success', () => {
          subscriber.putReceivedData({
            version: 2,
            segment: 'sit-test-A',
            data: {
              DEFAULT_ZONE: [{ data: 'test_val2' }],
            },
          }, 'DEFAULT_ZONE');
          assert.deepStrictEqual(subscriber.data, new Map([[
            'sit-test-A',
            {
              version: 2,
              segment: 'sit-test-A',
              data: {
                DEFAULT_ZONE: [{ data: 'test_val2' }],
              },
            }],
          ]));
        });
      });

      describe('put version lt current version', () => {
        beforeEach(() => {
          subscriber.putReceivedData({
            version: 2,
            segment: 'sit-test-A',
            data: {
              DEFAULT_ZONE: [{ data: 'test_val2' }],
            },
          }, 'DEFAULT_ZONE');
        });

        it('should success', () => {
          subscriber.putReceivedData({
            version: 1,
            segment: 'sit-test-A',
            data: {
              DEFAULT_ZONE: [{ data: 'test_val' }],
            },
          }, 'DEFAULT_ZONE');
          assert.deepStrictEqual(subscriber.data, new Map([[
            'sit-test-A',
            {
              version: 2,
              segment: 'sit-test-A',
              data: {
                DEFAULT_ZONE: [{ data: 'test_val2' }],
              },
            },
          ]]));
        });
      });
    });

    describe('not exists data', () => {
      it('should success', () => {
        subscriber.putReceivedData({
          version: 1,
          segment: 'sit-test-A',
          data: {
            DEFAULT_ZONE: [{ data: 'test_val' }],
          },
        }, 'DEFAULT_ZONE');
        assert.deepStrictEqual(subscriber.data, new Map([[
          'sit-test-A', {
            version: 1,
            segment: 'sit-test-A',
            data: {
              DEFAULT_ZONE: [{ data: 'test_val' }],
            },
          },
        ]]));
      });
    });
  });

  describe('peekData', () => {
    describe('is not init', () => {
      it('should return null', () => {
        const userData = subscriber.peekData();
        assert.deepStrictEqual(userData, {
          localZone: null,
          zoneData: {},
        });
      });
    });

    describe('data is init', () => {
      beforeEach(() => {
        subscriber.putReceivedData({
          version: 1,
          segment: 'sit-test-A',
          data: {
            DEFAULT_ZONE: [{ data: 'test_val' }],
          },
        }, 'DEFAULT_ZONE');
      });

      describe('available segments is empty', () => {
        it('should success', () => {
          const userData = subscriber.peekData();
          assert.deepStrictEqual(userData, {
            localZone: 'DEFAULT_ZONE',
            zoneData: {
              DEFAULT_ZONE: [ 'test_val' ],
            },
          });
        });
      });

      describe('available segments is not empty', () => {
        describe('in available segments', () => {
          beforeEach(() => {
            subscriber.availableSegments = [ 'sit-test-A', 'sit-test-B' ];
          });

          it('should success', () => {
            const userData = subscriber.peekData();
            assert.deepStrictEqual(userData, {
              localZone: 'DEFAULT_ZONE',
              zoneData: {
                DEFAULT_ZONE: [ 'test_val' ],
              },
            });
          });
        });

        describe('not in available segments', () => {
          beforeEach(() => {
            subscriber.availableSegments = [ 'sit-test-B' ];
          });

          it('should success', () => {
            const userData = subscriber.peekData();
            assert.deepStrictEqual(userData, {
              localZone: 'DEFAULT_ZONE',
              zoneData: {},
            });
          });
        });
      });
    });
  });

  describe('notify', () => {
    describe('notify success', () => {
      beforeEach(() => {
        subscriber.putReceivedData({
          version: 1,
          segment: 'sit-test-A',
          data: {
            DEFAULT_ZONE: [{ data: 'test_val' }],
          },
        }, 'DEFAULT_ZONE');

        subscriber.addListener(data => {
          assert.deepStrictEqual(data, {
            localZone: 'DEFAULT_ZONE',
            zoneData: {
              DEFAULT_ZONE: [ 'test_val' ],
            },
          });
        });
      });

      it('should success', () => {
        subscriber.notify();
      });
    });

    describe('notify failed', () => {
      let errorSpy;
      beforeEach(() => {
        subscriber.addListener(() => {
          throw new Error('mock error');
        });
        errorSpy = sandbox.spy(console, 'error');
      });

      it('should success', () => {
        subscriber.notify();
        const e = errorSpy.getCall(0).args[0];
        assert(/\[registry\/notify] notify subscriber dataId: com.alipay.foo error: mock error/.test(e.message));
      });
    });
  });

  describe('reset', () => {
    beforeEach(() => {
      subscriber.syncOk(subscriber.requestId, subscriber.pubVersion, false);
    });

    it('should reset', async () => {
      const oldTimestamp = subscriber.timestamp;
      const oldRequestId = subscriber.requestId;
      await sleep(1);
      subscriber.reset();
      assert(subscriber.registered === false);
      assert(subscriber.registerCount === 0);
      assert(subscriber.timestamp !== oldTimestamp);
      assert(subscriber.ackVersion === 0);
      assert(subscriber.requestId !== oldRequestId);
    });
  });
});
