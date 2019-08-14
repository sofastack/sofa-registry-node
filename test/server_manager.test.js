'use strict';

const urllib = require('urllib');
const assert = require('assert');
const sinon = require('sinon');
const url = require('url');
const RegistryConfig = require('../lib/config');
const ServerManager = require('../lib/server_manager');
const sleep = require('mz-modules/sleep');

describe('test/server_manager.test.js', () => {
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    sandbox.restore();
  });

  describe('init', () => {
    describe('server response ok', () => {
      let requestMock;

      beforeEach(() => {
        requestMock = sandbox.mock(urllib)
          .expects('request')
          .withExactArgs(
            'http://127.0.0.1:9603/api/servers/query', {
              method: 'GET',
              data: {
                env: 'sit',
                zone: 'DEFAULT_ZONE',
                dataCenter: 'test',
                appName: 'foo',
                instanceId: 'bar',
              },
              dataType: 'text',
            })
          .resolves({
            data: '127.0.0.1:9600;',
          });
      });

      it('should success', async () => {
        const config = new RegistryConfig({
          endpoint: '127.0.0.1',
          port: 9603,
          env: 'sit',
          zone: 'DEFAULT_ZONE',
          dataCenter: 'test',
          appname: 'foo',
          instanceId: 'bar',
        });
        const serverManager = new ServerManager({
          config,
          httpclient: urllib,
          logger: console,
        });
        await serverManager.ready();
        requestMock.verify();
        const serverNode = await serverManager.randomServerNode();
        assert.deepStrictEqual(serverNode, url.parse('tcp://127.0.0.1:9600?p=1&_SERIALIZETYPE=hessian2', true));
        serverManager.close();
      });
    });

    describe('server response error', () => {
      beforeEach(() => {
        sandbox.stub(urllib, 'request')
          .onFirstCall()
          .rejects(new Error('mock error'))
          .onSecondCall()
          .resolves({ data: '' })
          .onThirdCall()
          .resolves({ data: '127.0.0.1:9600?f=b;' });
      });

      it('should success', async () => {
        const config = new RegistryConfig({
          endpoint: '127.0.0.1',
          port: 9603,
          env: 'sit',
          zone: 'DEFAULT_ZONE',
          dataCenter: 'test',
          appname: 'foo',
          instanceId: 'bar',
        });
        const serverManager = new ServerManager({
          config,
          httpclient: urllib,
          logger: console,
        });
        await serverManager.ready();
        const serverNode = serverManager.randomServerNode();
        assert(serverNode);
        serverManager.close();
      });
    });
  });

  describe('refresh server list', () => {
    let serverManager;
    let syncServerListSpy;

    beforeEach(async () => {
      sandbox.stub(urllib, 'request')
        .resolves({ data: '127.0.0.1:9600?f=b;' });
      const config = new RegistryConfig({
        endpoint: '127.0.0.1',
        port: 9603,
        env: 'dev',
        zone: 'DEFAULT_ZONE',
        dataCenter: 'test',
        appname: 'foo',
        instanceId: 'bar',
      });
      serverManager = new ServerManager({
        config,
        httpclient: urllib,
        logger: console,
      });
      sandbox.stub(serverManager, 'delay')
        .value(10);
      syncServerListSpy = sandbox.spy(serverManager, 'syncServerList');
      await serverManager.ready();
    });

    afterEach(() => {
      return serverManager.close();
    });

    it('should success', async () => {
      await sleep(100);
      // timer 并不精准, 用小点的数字保证测试的稳定性
      assert(syncServerListSpy.callCount >= 5);
    });
  });

  describe('close', () => {
    let serverManager;
    let syncServerListSpy;

    beforeEach(async () => {
      sandbox.stub(urllib, 'request')
        .resolves({ data: '127.0.0.1:9600?f=b;' });
      const config = new RegistryConfig({
        endpoint: '127.0.0.1',
        port: 9603,
        env: 'dev',
        zone: 'DEFAULT_ZONE',
        dataCenter: 'test',
        appname: 'foo',
        instanceId: 'bar',
      });
      serverManager = new ServerManager({
        config,
        httpclient: urllib,
        logger: console,
      });
      sandbox.stub(serverManager, 'delay')
        .value(10);
      syncServerListSpy = sandbox.spy(serverManager, 'syncServerList');
      await serverManager.ready();
    });

    afterEach(() => {
      return serverManager.close();
    });

    it('should success', async () => {
      await sleep(55);
      serverManager.close();
      const calledCount = syncServerListSpy.callCount;
      await sleep(10);
      assert(syncServerListSpy.callCount, calledCount);
    });
  });

  describe('shuffle server list', () => {
    describe('server response ok', () => {
      let serverManager;

      beforeEach(async () => {
        sandbox.stub(urllib, 'request')
          .resolves({
            data: '10.0.0.1:9600?f=b;10.0.0.2:9600?f=b;10.0.0.3:9600?f=b;',
          });
        const config = new RegistryConfig({
          endpoint: '127.0.0.1',
          port: 9603,
          env: 'dev',
          zone: 'DEFAULT_ZONE',
          dataCenter: 'test',
          appname: 'foo',
          instanceId: 'bar',
        });
        serverManager = new ServerManager({
          config,
          httpclient: urllib,
          logger: console,
        });
        await serverManager.ready();
      });

      it('should success', async () => {
        const serverNodes = await serverManager.shuffleServerList();
        assert(serverNodes.length, 3);
        assert(serverNodes.find(t => t.hostname === '10.0.0.1'));
        assert(serverNodes.find(t => t.hostname === '10.0.0.2'));
        assert(serverNodes.find(t => t.hostname === '10.0.0.3'));
        serverManager.close();
      });
    });
  });
});
