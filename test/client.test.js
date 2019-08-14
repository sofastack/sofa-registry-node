'use strict';

const Client = require('../lib/client');
const TestUtil = require('./test_util');
const crypto = require('crypto');
const httpclient = require('urllib');
const assert = require('assert');
const sleep = require('mz-modules/sleep');

describe('test/client.test.js', () => {
  let client;
  const dataId = `com.alipay.${crypto.randomBytes(3).toString('hex')}`;

  before(async () => {
    const config = TestUtil.defaultConfig();
    config.syncConfigRetryInterval = 1000;
    config.recheckInterval = 1000;
    config.dataCenter = null;
    client = new Client({
      logger: console,
      config,
      httpclient,
    });
    await client.ready();
  });

  after(() => {
    return client.close();
  });

  it('should work', async () => {
    let subData;
    client.register({
      dataId,
      group: 'DEFAULT',
      appname: 'chair-test',
      data: [ 'test_val', 'test_val2' ],
    });
    client.subscribe({
      dataId,
      group: 'DEFAULT',
      appname: 'chair-test',
      scope: 'zone',
      type: 'address',
    }, data => {
      subData = data;
      console.log('sub: ', dataId, data);
    });
    await sleep(1000);
    assert(subData);
  });
});
