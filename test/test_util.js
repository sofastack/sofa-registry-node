'use strict';

const net = require('net');
const awaitEvent = require('await-event');
const RegistryConfig = require('../lib/config');
const RegisterCache = require('../lib/register_cache');
const Worker = require('../lib/task/worker');

exports.destroySocketServer = async () => {
  let socket;
  const server = net.createServer();
  server.listen();
  server.on('connection', sock => {
    socket = sock;
  });
  await awaitEvent(server, 'listening');
  server.destroySocket = () => socket.destroy();
  return server;
};

exports.normalSocketServer = async () => {
  const server = net.createServer();
  server.listen();
  await awaitEvent(server, 'listening');
  return server;
};

exports.defaultConfig = () => {
  return new RegistryConfig({
    endpoint: '127.0.0.1',
    port: 9603,
    env: 'dev',
    zone: 'DEFAULT_ZONE',
    dataCenter: 'test',
    appname: 'foo',
    instanceId: 'bar',
    recheckInterval: 500,
  });
};

exports.mockClient = () => {
  return {
    ready: () => Promise.resolve(),
    invoke: () => {
      return {
        success: true,
      };
    },
  };
};

exports.defaultWorker = () => {
  return new Worker({
    registerCache: new RegisterCache(),
    config: exports.defaultConfig(),
    client: exports.mockClient(),
    logger: console,
    autoServe: false,
  });
};
