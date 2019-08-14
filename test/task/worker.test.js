'use strict';

const sinon = require('sinon');
const assert = require('assert');
const EventEmitter = require('events');
const nextTick = require('mz-modules/nextTick');
const Worker = require('../../lib/task/worker');
const RegisterCache = require('../../lib/register_cache');
const TestUtil = require('../test_util');
const Subscriber = require('../../lib/register/subscriber');
const TaskEvent = require('../../lib/task/task_event');
const uuid = require('uuid/v4');

describe('test/task/worker.test.js', () => {
  let registerCache;
  let config;
  let client;
  const sandbox = sinon.createSandbox();

  beforeEach(() => {
    registerCache = new RegisterCache();
    config = TestUtil.defaultConfig();
    client = TestUtil.mockClient();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('awaitBellOrSleep', () => {
    describe('no bell', () => {
      it('should sleep until timeout', async () => {
        const worker = new Worker({
          registerCache,
          config,
          client,
          logger: console,
          autoServe: false,
        });
        const start = Date.now();
        await worker.awaitBellOrSleep(1);
        const duration = Date.now() - start;
        assert(duration >= 1);
      });
    });

    describe('bell', () => {
      it('should sleep until bell', async () => {
        const worker = new Worker({
          registerCache,
          config,
          client,
          logger: console,
          autoServe: false,
        });
        const start = Date.now();
        const p = worker.awaitBellOrSleep(10);
        await nextTick();
        worker.signal();
        await p;
        const duration = Date.now() - start;
        assert(duration < 10);
      });
    });
  });

  describe('handleTask', () => {
    let worker;
    let subscriber;
    let event;

    beforeEach(() => {
      worker = new Worker({
        registerCache,
        config,
        client,
        logger: console,
        autoServe: false,
      });
      subscriber = new Subscriber({
        registration: {},
        dataObserver: {},
        config,
        worker,
        eventBus: new EventEmitter(),
      });
      event = new TaskEvent(subscriber);
    });

    describe('task is done', () => {
      let warnSpy;
      let clientSpy;
      beforeEach(() => {
        sandbox.stub(subscriber, 'registered')
          .value(true);
        sandbox.stub(subscriber, 'pubVersion')
          .value(1);
        sandbox.stub(subscriber, 'ackVersion')
          .value(1);
        warnSpy = sandbox.spy(console, 'warn');
        clientSpy = sandbox.spy(client, 'invoke');
      });

      it('should not request', async () => {
        await worker.handleTask(event);
        const args = warnSpy.getCall(0).args;
        assert(/\[register] register already sync succeeded: %j/.test(args[ 0 ]));
        assert(!clientSpy.called);
      });
    });

    describe('invoke failed', () => {
      let infoStub;

      beforeEach(() => {
        sandbox.stub(client, 'invoke')
          .resolves({
            success: false,
          });
        infoStub = sandbox.spy(console, 'info');
      });

      it('should not request', async () => {
        await worker.handleTask(event);
        const args = infoStub.getCall(0).args;
        assert(/\[register] register to server failed, %j, %j/.test(args[ 0 ]));
      });
    });

    describe('invoke success', () => {
      describe('sync not ok', () => {
        let infoStub;
        beforeEach(() => {
          sandbox.stub(client, 'invoke')
            .callsFake(() => {
              subscriber.requestId = uuid();
              return {
                success: true,
                version: 1,
                refused: false,
              };
            });
          infoStub = sandbox.spy(console, 'info');
        });

        it('should log ignore', async () => {
          await worker.handleTask(event);
          const args = infoStub.getCall(0).args;
          assert(/\[register] requestId has expired, ignore this response, %s, %j %j/.test(args[ 0 ]));
          assert(!event.source.isDone);
        });
      });

      describe('register success', () => {
        let infoStub;
        beforeEach(() => {
          sandbox.stub(client, 'invoke')
            .returns({
              success: true,
              version: 1,
              refused: false,
            });
          infoStub = sandbox.spy(console, 'info');
        });

        it('should log success', async () => {
          await worker.handleTask(event);
          const args = infoStub.getCall(0).args;
          assert(/\[register] register to server success, %s, %j, %j/.test(args[ 0 ]));
          assert(event.source.isDone);
        });
      });

      describe('unregister success', () => {
        let infoStub;
        beforeEach(async () => {
          sandbox.stub(client, 'invoke')
            .onFirstCall()
            .returns({
              success: true,
              version: 1,
              refused: false,
            })
            .onSecondCall()
            .returns({
              success: true,
              version: 2,
              refused: false,
            });
          infoStub = sandbox.spy(console, 'info');
          await worker.handleTask(event);
        });

        it('should log success', async () => {
          subscriber.unregister();
          await worker.handleTask(event);
          const args = infoStub.getCall(0).args;
          assert(/\[register] register to server success, %s, %j, %j/.test(args[ 0 ]));
          assert(!registerCache.subscriberMap.has(subscriber.registId));
          assert(event.source.isDone);
        });
      });

      describe('register refused', () => {
        let infoStub;
        beforeEach(() => {
          sandbox.stub(client, 'invoke')
            .returns({
              success: true,
              version: 1,
              refused: true,
            });
          infoStub = sandbox.spy(console, 'info');
        });

        it('should log success', async () => {
          await worker.handleTask(event);
          const args = infoStub.getCall(0).args;
          assert(/\[register] register refused by server, %s, %j, %j/.test(args[ 0 ]));
          assert(event.source.isDone);
        });
      });
    });

    describe('throw error', () => {
      let errorStub;
      beforeEach(() => {
        sandbox.stub(client, 'invoke')
          .throws(new Error('mock error'));
        errorStub = sandbox.spy(console, 'error');
      });

      it('should catch error', async () => {
        await worker.handleTask(event);
        const args = errorStub.getCall(0).args;
        assert(/\[register\/send] handle request failed/.test(args[ 0 ].message));
        assert(!event.source.isDone);
      });
    });
  });

  describe('handle', () => {
    describe('request queue is empty', () => {
      let bellSpy;
      let worker;

      beforeEach(() => {
        worker = new Worker({
          registerCache,
          config,
          client,
          logger: console,
          autoServe: false,
        });
        bellSpy = sandbox.spy(worker, 'awaitBellOrSleep');
      });

      it('should continue', async () => {
        const p = worker.handle();
        await client.ready();
        worker.close();
        await p;
        assert(bellSpy.calledOnce);
      });
    });

    describe('request queue is not empty', () => {
      let worker;
      let event;
      let subscriber;

      beforeEach(() => {
        worker = new Worker({
          registerCache,
          config,
          client,
          logger: console,
          autoServe: false,
        });
        subscriber = new Subscriber({
          registration: {},
          dataObserver: {},
          config,
          worker,
          eventBus: new EventEmitter(),
        });
        event = new TaskEvent(subscriber);
      });

      describe('event should delay', () => {
        let handleTaskSpy;

        beforeEach(() => {
          sandbox.stub(event, 'sendCount')
            .value(2);
          sandbox.stub(event, 'triggerTime')
            .value(Date.now() + 100000);
          handleTaskSpy = sandbox.spy(worker, 'handleTask');
        });

        it('should not handle task', async () => {
          worker.schedule(event);
          const p = worker.handle();
          await client.ready();
          worker.close();
          await p;
          assert(event.sendCount === 3);
          assert(!handleTaskSpy.called);
        });
      });

      describe('event should handle', () => {
        beforeEach(() => {
          sandbox.stub(client, 'invoke')
            .resolves({
              success: true,
              version: 1,
              refused: false,
            });
        });

        it('should success', async () => {
          worker.schedule(event);
          const p = worker.handle();
          await client.ready();
          worker.close();
          await p;
          assert(event.sendCount === 1);
          assert(worker.requestQueue.isEmpty());
        });
      });

      describe('handle throw error', () => {
        beforeEach(() => {
          sandbox.stub(worker, 'handleTask')
            .rejects(new Error('mock error'));
        });

        it('should success', async () => {
          worker.schedule(event);
          const p = worker.handle();
          await client.ready();
          worker.close();
          await p;
          assert(event.sendCount === 1);
        });
      });
    });
  });
});
