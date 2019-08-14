'use strict';

class TaskEvent {
  /**
   * @class
   * @param {IRegister} register -
   */
  constructor(register) {
    /** @type {IRegister} */
    this.source = register;
    this.sendCount = 0;
    this.triggerTime = Date.now();
  }

  delayTime() {
    const time = Math.min(this.sendCount * 200, 1000);
    return time - (Date.now() - this.triggerTime);
  }

  /**
   * @param {TaskEvent} event -
   * @return {number} -
   */
  compareTo(event) {
    if (this.sendCount > event.sendCount) {
      return 1;
    } else if (this.sendCount < event.sendCount) {
      return -1;
    }
    const t1 = this.source.timestamp;
    const t2 = event.source.timestamp;
    if (t1 > t2) {
      return 1;
    } else if (t1 < t2) {
      return -1;
    }
    return 0;
  }

  incSendCount() {
    return this.sendCount++;
  }
}

module.exports = TaskEvent;
