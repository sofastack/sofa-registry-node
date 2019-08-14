'use strict';

class TaskQueue {
  constructor() {
    /**
     * @type {Map<string, TaskEvent>}
     */
    this.taskMap = new Map();
  }

  cleanCompletedTasks() {
    for (const [ key, task ] of this.taskMap) {
      if (task.source.isDone) {
        this.taskMap.delete(key);
      }
    }
  }

  [Symbol.iterator]() {
    const taskList = Array.from(this.taskMap.values())
      .sort((a, b) => a.compareTo(b));
    return taskList[ Symbol.iterator ]();
  }

  /**
   * @param {TaskEvent} event -
   */
  put(event) {
    this.taskMap.set(event.source.registId, event);
  }

  /**
   * @param {Array<TaskEvent>} events -
   */
  putAll(events) {
    for (const event of events) {
      this.put(event);
    }
  }

  isEmpty() {
    return this.taskMap.size === 0;
  }

  close() {
    this.closed = true;
    this.taskMap.clear();
  }
}

module.exports = TaskQueue;
