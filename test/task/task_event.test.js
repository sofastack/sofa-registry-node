'use strict';

const assert = require('assert');
const sinon = require('sinon');
const TaskEvent = require('../../lib/task/task_event');

describe('test/task/task_event.test.js', () => {
  const sandbox = sinon.createSandbox();
  afterEach(() => {
    sandbox.restore();
  });

  describe('delay time', () => {
    let event;
    beforeEach(() => {
      event = new TaskEvent({});
      sandbox.stub(event, 'sendCount').value(6);
      sandbox.stub(event, 'triggerTime').value(0);
      sandbox.stub(Date, 'now').returns(1100);
    });

    it('should success', () => {
      const delayTime = event.delayTime();
      assert(delayTime < 0);
    });
  });

  describe('compareTo', () => {
    describe('sendCount', () => {
      describe('gt', () => {
        it('should return 1', () => {
          const t1 = new TaskEvent({});
          const t2 = new TaskEvent({});
          t1.sendCount = 2;
          t2.sendCount = 1;
          assert(t1.compareTo(t2) === 1);
        });
      });
      describe('lt', () => {
        it('should return -1', () => {
          const t1 = new TaskEvent({});
          const t2 = new TaskEvent({});
          t1.sendCount = 1;
          t2.sendCount = 2;
          assert(t1.compareTo(t2) === -1);
        });
      });
      describe('eq', () => {
        describe('timestamp', () => {
          describe('gt', () => {
            it('should return 1', () => {
              const t1 = new TaskEvent({ timestamp: 10 });
              const t2 = new TaskEvent({ timestamp: 5 });
              t1.sendCount = 1;
              t2.sendCount = 1;
              assert(t1.compareTo(t2) === 1);
            });
          });
          describe('lt', () => {
            it('should return -1', () => {
              const t1 = new TaskEvent({ timestamp: 5 });
              const t2 = new TaskEvent({ timestamp: 10 });
              t1.sendCount = 1;
              t2.sendCount = 1;
              assert(t1.compareTo(t2) === -1);
            });
          });
          describe('eq', () => {
            it('should return 0', () => {
              const t1 = new TaskEvent({ timestamp: 10 });
              const t2 = new TaskEvent({ timestamp: 10 });
              t1.sendCount = 1;
              t2.sendCount = 1;
              assert(t1.compareTo(t2) === 0);
            });
          });
        });
      });
    });
  });

  describe('incSendCount', () => {
    it('should success', () => {
      const t = new TaskEvent({});
      const res = t.incSendCount();
      assert(res === 0);
      assert(t.sendCount === 1);
    });
  });
});
