# sofa-registry-node

[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![Test coverage][codecov-image]][codecov-url]
[![David deps][david-image]][david-url]
[![Known Vulnerabilities][snyk-image]][snyk-url]
[snyk-image]: https://snyk.io/test/npm/sofa-registry-node/badge.svg?style=flat-square
[snyk-url]: https://snyk.io/test/npm/sofa-registry-node
[download-image]: https://img.shields.io/npm/dm/sofa-registry-node.svg?style=flat-square
[download-url]: https://npmjs.org/package/sofa-registry-node

Node.js SDK for SOFARegistry

## Usage
```js
const httpclient = require('urllib');
const { RegistryType, RegistryClient } = require('sofa-registry-node');
const client = new RegistryClient({
  config: {
    endpoint: '127.0.0.1',
    port: 9603,
    env: 'sit',
    zone: 'DEFAULT_ZONE',
    dataCenter: 'test',
    appname: 'foo',
    instanceId: 'bar',
    recheckInterval: 500,
  },
  logger: console,
  httpclient,
});

// publish data
client.register({
  dataId,
  group: 'DEFAULT',
  appname: 'chair-test',
}, 'test_val', 'test_val2');

// subscribe data
client.subscribe({
  dataId,
  group: 'DEFAULT',
  appname: 'chair-test',
  scope: 'zone',
}, data => {
  subData = data;
});

// subscribe config data
client.subscribeConfig({
  dataId,
  group: 'DEFAULT',
  appname: 'chair-test',
}, data => {
  confData = data;
});

```
