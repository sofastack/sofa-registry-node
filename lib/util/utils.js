'use strict';

const awaitFirst = require('await-first');

let i = 0;
exports.sleep = async function(obj, timeout) {
  // eslint-disable-next-line no-bitwise
  const id = i++ | 0;
  const timer = setTimeout(() => {
    obj.emit(id);
  }, timeout);
  await awaitFirst(obj, [ id, 'close' ]);
  clearTimeout(timer);
};

/**
 * @param {IInterval} obj -
 */
exports.interval = async function(obj) {
  while (!obj.done) {
    await exports.sleep(obj, obj.delay);
    if (obj.done) {
      return;
    }
    await obj.intervalFunc();
  }
};
