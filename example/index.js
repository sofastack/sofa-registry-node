'use strict';

const httpclient = require('urllib');
const { RegistryClient } = require('..');
const sleep = require('mz-modules/sleep');

const config = {
  env: 'dev',
  endpoint: '127.0.0.1',
  appname: 'foo',
  zone: 'DEFAULT_ZONE',
};
const dataId = 'com.alipay.foo';
const pubVal = 'bar';
const group = 'DEFAULT';

async function createClient() {
  const client = new RegistryClient({
    logger: console,
    httpclient,
    config,
  });
  await client.ready();
  return client;
}

async function register(client) {
  client.register({
    group,
    dataId,
    data: [ pubVal ],
  });
}

async function unregister(client) {
  client.unregister({
    group,
    dataId,
  });
}

async function subscribe(client) {
  client.subscribe({
    group,
    dataId,
  }, val => {
    console.log('subscribe: ', val);
  });
}

(async () => {
  const client = await createClient();
  await register(client);
  await sleep(1000);
  await subscribe(client);
  // {
  //   localZone: 'DEFAULT_ZONE',
  //   zoneData: {
  //     DEFAULT_ZONE: [ 'bar' ]
  //   }
  // }
  await unregister(client);
  await sleep(1000);
  // {
  //   localZone: 'DEFAULT_ZONE',
  //   zoneData: {}
  // }
  await client.close();
})();
