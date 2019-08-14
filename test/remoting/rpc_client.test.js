'use strict';

const sinon = require('sinon');
const url = require('url');
const uuid = require('uuid');
const RpcClient = require('../../lib/remoting/rpc_client');
const TestUtil = require('../test_util');
const assert = require('assert');
const awaitEvent = require('await-event');
const RegisterCache = require('../../lib/register_cache');

describe('test/remoting/rpc_client.test.js', () => {
  const sandbox = sinon.createSandbox();
  const serverManager = {
    ready: () => Promise.resolve(),
    shuffleServerList: () => Promise.resolve([]),
  };

  afterEach(() => {
    sandbox.restore();
  });

  describe('_connect', () => {
    describe('connect success', () => {
      let server;
      let client;
      let address;

      beforeEach(async () => {
        server = await TestUtil.normalSocketServer();
        const { port } = server.address();
        address = url.parse(`tcp://127.0.0.1:${port}`);
        client = new RpcClient({
          logger: console,
          serverManager,
          handlerMap: new Map(),
          registerCache: new RegisterCache(),
          config: TestUtil.defaultConfig(),
        });
        sandbox.stub(client, '_init').resolves();
        sandbox.stub(serverManager, 'shuffleServerList')
          .resolves([ address ]);
      });

      afterEach(async () => {
        await client.close();
        return server.close();
      });

      it('should connect success', async () => {
        const rpcClient = await client._connect();
        assert.deepStrictEqual(rpcClient.address, address);
      });
    });

    describe('server failed', () => {
      let server;
      let client;
      let address;
      let errorSpy;

      beforeEach(async () => {
        server = await TestUtil.normalSocketServer();
        const { port } = server.address();
        address = url.parse(`tcp://127.0.0.1:${port}`);
        client = new RpcClient({
          logger: console,
          serverManager,
          handlerMap: new Map(),
          registerCache: new RegisterCache(),
          config: TestUtil.defaultConfig(),
        });
        sandbox.stub(client, '_init').resolves();
        sandbox.stub(serverManager, 'shuffleServerList')
          .resolves([ url.parse('tcp://127.0.0.1:65535'), address ]);
        errorSpy = sandbox.spy(console, 'error');
      });

      afterEach(async () => {
        await client.close();
        return server.close();
      });

      it('should failed', async () => {
        const rpcClient = await client._connect();
        assert.deepStrictEqual(rpcClient.address, address);
        assert(errorSpy.callCount);
        const error = errorSpy.lastCall.args[0];
        assert(/Failed connected to server tcp:\/\/127\.0\.0\.1:65535/.test(error.message));
      });
    });

    describe('all server failed', () => {
      let server;
      let client;
      let address;
      let errorSpy;
      let serverListStub;

      beforeEach(async () => {
        server = await TestUtil.normalSocketServer();
        const { port } = server.address();
        address = url.parse(`tcp://127.0.0.1:${port}`);
        client = new RpcClient({
          logger: console,
          serverManager,
          handlerMap: new Map(),
          registerCache: new RegisterCache(),
          config: TestUtil.defaultConfig(),
        });
        sandbox.stub(client, '_init').resolves();
        serverListStub = sandbox.stub(serverManager, 'shuffleServerList')
          .onFirstCall()
          .resolves([ url.parse('tcp://127.0.0.1:65535') ])
          .onSecondCall()
          .resolves([ address ]);
        errorSpy = sandbox.spy(console, 'error');
      });

      afterEach(async () => {
        await client.close();
        return server.close();
      });

      it('should connect success', async () => {
        const rpcClient = await client._connect();
        assert.deepStrictEqual(rpcClient.address, address);
        assert(errorSpy.callCount);
        const error = errorSpy.lastCall.args[0];
        assert(/Failed connected to server tcp:\/\/127\.0\.0\.1:65535/.test(error.message));
        assert(serverListStub.callCount === 2);
      });
    });
  });

  describe('_init', () => {
    let server;
    let address;

    beforeEach(async () => {
      server = await TestUtil.normalSocketServer();
      const { port } = server.address();
      address = url.parse(`tcp://127.0.0.1:${port}`);
      sandbox.stub(serverManager, 'shuffleServerList')
        .resolves([ address ]);
    });

    afterEach(() => {
      server.close();
    });

    it('should connect success', async () => {
      const client = new RpcClient({
        logger: console,
        serverManager,
        handlerMap: new Map(),
        registerCache: new RegisterCache(),
        config: TestUtil.defaultConfig(),
      });
      await client.ready();
      assert(client.client);
      await client.close();
    });
  });

  describe('client error', () => {
    let server;
    let client;
    let address;
    let resetStub;
    let scheduleAllStub;

    beforeEach(async () => {
      server = await TestUtil.normalSocketServer();
      const { port } = server.address();
      address = url.parse(`tcp://127.0.0.1:${port}`);
      const registerCache = new RegisterCache();
      client = new RpcClient({
        logger: console,
        serverManager,
        handlerMap: {},
        registerCache,
        config: TestUtil.defaultConfig(),
      });
      const subscriber = {
        dataId: 'com.alipay.foo',
        reset: () => {},
        registId: uuid(),
      };
      sandbox.stub(serverManager, 'shuffleServerList')
        .resolves([ address ]);
      await client.ready();
      registerCache.addSubscriber(subscriber);
      resetStub = sandbox.stub(subscriber, 'reset');
      const worker = {
        scheduleAll: () => {},
      };
      client.worker = worker;
      scheduleAllStub = sandbox.stub(worker, 'scheduleAll');
    });

    afterEach(async () => {
      await client.close();
      return server.close();
    });

    it('should auto retry', async () => {
      client.client._socket.destroy(new Error('mock error'));
      await awaitEvent(client.client, 'close');
      assert(!client.client);
      await client.ready();
      assert(client.client);
      assert(resetStub.calledOnce);
      assert(scheduleAllStub.calledOnce);
    });
  });

  describe('handle request', () => {
    let server;
    let address;
    let client;
    const handler = {
      handleReq: () => {
      },
    };
    const req = {
      className: 'com.alipay.foo',
      data: {
        hello: 'registry',
      },
      options: {},
    };

    beforeEach(async () => {
      server = await TestUtil.normalSocketServer();
      const { port } = server.address();
      address = url.parse(`tcp://127.0.0.1:${port}`);
      sandbox.stub(serverManager, 'shuffleServerList')
        .resolves([ address ]);
      client = new RpcClient({
        logger: console,
        serverManager,
        registerCache: new RegisterCache(),
        config: TestUtil.defaultConfig(),
        handlerMap: {
          'com.alipay.foo': handler,
        },
      });
      await client.ready();
    });

    afterEach(async () => {
      await client.close();
      server.close();
    });

    describe('handle success', () => {
      let resMock;

      beforeEach(() => {
        sandbox.stub(handler, 'handleReq')
          .returns(req.data);
        resMock = sandbox.mock(client.client)
          .expects('response')
          .withExactArgs(req, req.data);
      });

      it('should response', async () => {
        await client._handleRequest(req);
        resMock.verify();
      });
    });

    describe('handle failed', () => {
      let errorSpy;

      beforeEach(() => {
        sandbox.stub(handler, 'handleReq')
          .throws(new Error('mock error'));
        errorSpy = sandbox.spy(console, 'error');
      });

      it('should error', async () => {
        client._handleRequest(req);
        const arg = errorSpy.getCall(0).args[ 0 ];
        assert(/\[registry\/connection] handle class: com\.alipay\.foo request: .+ error: mock error/.test(arg.message));
      });
    });

    describe('handler not found', () => {
      let warnSpy;

      beforeEach(() => {
        warnSpy = sandbox.spy(console, 'warn');
      });

      it('should error', async () => {
        client._handleRequest({
          className: 'com.alipay.bar',
          data: {
            hello: 'registry',
          },
        });
        const arg = warnSpy.getCall(0).args[ 0 ];
        assert(/\[registry\/connection] can not handle class/.test(arg));
      });
    });

    describe('invoke', () => {
      let invokeMock;
      beforeEach(() => {
        invokeMock = sandbox.mock(client.client)
          .expects('invoke')
          .withExactArgs(req)
          .resolves({});
      });

      it('should success', async () => {
        await client.invoke(req);
        invokeMock.verify();
      });
    });
  });
});
