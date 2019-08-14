'use strict';

const assert = require('assert');
const uuid = require('uuid/v4');
const TaskQueue = require('../../lib/task/task_queue');
const TaskEvent = require('../../lib/task/task_event');

describe('test/task/task_queue.test.js', () => {
  describe('iterator', () => {
    it('should success', () => {
      const q = new TaskQueue();
      const t1 = new TaskEvent({
        registId: uuid(),
        timestamp: 10,
      });
      const t2 = new TaskEvent({
        registId: uuid(),
        timestamp: 10,
      });
      const t3 = new TaskEvent({
        registId: uuid(),
        timestamp: 20,
      });
      const t4 = new TaskEvent({
        registId: uuid(),
        timestamp: 20,
      });
      t1.sendCount = 5;
      t2.sendCount = 10;
      t3.sendCount = 10;
      t4.sendCount = 15;
      q.putAll([ t1, t2, t3, t4 ]);
      const tasks = [];
      for (const t of q) {
        tasks.push(t.source.registId);
      }
      assert(tasks[ 0 ], t1.source.registId);
      assert(tasks[ 1 ], t2.source.registId);
      assert(tasks[ 2 ], t3.source.registId);
      assert(tasks[ 3 ], t4.source.registId);
    });
  });

  describe('cleanCompletedTasks', () => {
    describe('task is done', () => {
      it('should success', () => {
        const t = new TaskEvent({
          isDone: true,
          registId: uuid(),
        });
        const q = new TaskQueue();
        q.put(t);
        q.cleanCompletedTasks();
        assert(q.isEmpty());
      });
    });

    describe('task is not done', () => {
      it('should success', () => {
        const t = new TaskEvent({
          isDone: false,
          registId: uuid(),
        });
        const q = new TaskQueue();
        q.put(t);
        q.cleanCompletedTasks();
        assert(!q.isEmpty());
      });
    });
  });
});
