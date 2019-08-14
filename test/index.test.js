'use strict';

const { RegistryClient } = require('..');
const httpclient = require('urllib');
const crypto = require('crypto');
const sleep = require('mz-modules/sleep');

describe('test/index.test.js', () => {
  const dataId = `com.alipay.${crypto.randomBytes(3).toString('hex')}`;

  it('should success', async () => {
    let subData;
    let confData;
    const client = new RegistryClient({
      config: {
        endpoint: '127.0.0.1',
        port: 9603,
        env: 'dev',
        zone: 'DEFAULT_ZONE',
        dataCenter: 'test',
        appname: 'foo',
        instanceId: 'bar',
        recheckInterval: 500,
      },
      logger: console,
      httpclient,
    });
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
    }, data => {
      subData = data;
    });
    client.subscribeConfig({
      dataId,
      group: 'DEFAULT',
      appname: 'chair-test',
    }, data => {
      confData = data;
    });
    await sleep(1000);
    console.log(subData);
    console.log(confData);
    client.unregister({
      dataId,
      group: 'DEFAULT',
    });
    client.unSubscribe({
      dataId,
      group: 'DEFAULT',
    });
    client.unSubscribeConfig({
      dataId,
      group: 'DEFAULT',
    });
  });
});
