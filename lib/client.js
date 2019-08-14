'use strict';

const assert = require('assert');
const Base = require('sdk-base');
const ServerManager = require('./server_manager');
const Worker = require('./task/worker');
const TaskEvent = require('./task/task_event');
const RegisterCache = require('./register_cache');
const Client = require('./remoting/rpc_client');
const EventEmitter = require('events');
const ReceivedConfigDataHandler = require('./remoting/received_config_data_handler');
const ReceivedDataHandler = require('./remoting/received_data_handler');
const SyncConfig = require('./sync_config');
const RegistryCheck = require('./registry_check');
const Publisher = require('./register/publisher');
const Subscriber = require('./register/subscriber');
const Configurator = require('./register/configurator');

class RegistryDataClient extends Base {
  /**
   * @class
   * @param {Object} options -
   * @param {Logger|Console} options.logger -
   * @param {RegistryConfig} options.config -
   * @param {HttpClient} options.httpclient -
   */
  constructor(options) {
    super(Object.assign({}, options, { initMethod: '_init' }));
    this.registerCache = new RegisterCache();
    this.eventBus = new EventEmitter();
    this.serverManager = new ServerManager({
      logger: this.logger,
      config: this.config,
      httpclient: this.httpclient,
    });
    this.handlerMap = {
      'com.alipay.sofa.registry.core.model.ReceivedConfigData': new ReceivedConfigDataHandler({
        logger: this.logger,
        eventBus: this.eventBus,
        registerCache: this.registerCache,
      }),
      'com.alipay.sofa.registry.core.model.ReceivedData': new ReceivedDataHandler({
        logger: this.logger,
        eventBus: this.eventBus,
        registerCache: this.registerCache,
      }),
    };
    this.client = new Client({
      logger: this.logger,
      serverManager: this.serverManager,
      handlerMap: this.handlerMap,
      registerCache: this.registerCache,
      config: this.config,
    });
    this.worker = new Worker({
      registerCache: this.registerCache,
      config: this.config,
      client: this.client,
      logger: this.logger,
    });
    this.registrationPublisherMap = new Map();
    this.registrationSubscriberMap = new Map();
    this.registrationConfiguratorMap = new Map();
    this.registryCheck = new RegistryCheck({
      config: this.config,
      worker: this.worker,
      registerCache: this.registerCache,
    });
    this.syncConfig = new SyncConfig({
      registerCache: this.registerCache,
      config: this.config,
      eventBus: this.eventBus,
      logger: this.logger,
      client: this.client,
    });
  }

  /**
   * @param {object} registration -
   * @param {string} registration.dataId -
   * @param {string} registration.group -
   * @param {string} registration.appname -
   * @param {string} registration.data -
   * @return {Publisher} -
   */
  register(registration) {
    assert(registration && registration.dataId);
    registration.data = registration.data || [];
    registration.group = registration.group || 'DEFAULT_GROUP';
    const key = this.publisherKey(registration);
    // 这里实现与 sofa 不一致, sofa 不允许重复 publisher 对象
    // 由于 cluster-client, apiClient 不能拿到 publisher 对象
    // 所以复用之前注册过的 publisher
    let publisher = this.registrationPublisherMap.get(key);
    if (!publisher) {
      publisher = new Publisher({
        registration,
        config: this.config,
        worker: this.worker,
        logger: this.logger,
      });
      // TODO set auth
      this.registrationPublisherMap.set(key, publisher);
      this.registerCache.addPublisher(publisher);
    }
    publisher.republish(...registration.data);
    this.logger.info(
      '[registry/dataClient] regist publisher success, dataId: %s, group: %s, registerId: %s',
      publisher.dataId, publisher.group, publisher.registId
    );
    return publisher;
  }

  subscribe(registration, listener) {
    if (registration.type === 'address') {
      return this.doSubscribe(registration, listener);
    } else if (registration.type === 'config') {
      return this.doSubscribeConfig(registration, listener);
    }
  }

  /**
   * @param {object} registration -
   * @param {string} registration.dataId -
   * @param {string} registration.group -
   * @param {string} registration.appname -
   * @param {string} registration.scope -
   * @param {function} listener -
   * @return {Subscriber} -
   */
  doSubscribe(registration, listener) {
    assert(listener, 'listener can not be null');
    assert(registration && registration.dataId, 'dataId can not be null');
    registration.group = registration.group || 'DEFAULT_GROUP';
    const key = this.subscriberKey(registration);
    let subscriber = this.registrationSubscriberMap.get(key);
    if (!subscriber) {
      subscriber = new Subscriber({
        config: this.config,
        worker: this.worker,
        eventBus: this.eventBus,
        logger: this.logger,
        registration: Object.assign({}, registration, { listeners: [ listener ] }),
      });
      // TODO set auth
      this.registrationSubscriberMap.set(key, subscriber);
      this.registerCache.addSubscriber(subscriber);
      this.addRegisterTask(subscriber);
    } else {
      subscriber.addListener(listener);
    }
    this.logger.info(
      '[registry/dataClient] regist subscriber success, dataId: %s, group: %s, scope: %s, registerId: %s',
      subscriber.dataId, subscriber.group, subscriber.scope, subscriber.registId
    );
    return subscriber;
  }

  /**
   * @param {object} registration -
   * @param {string} registration.dataId -
   * @param {string} registration.group -
   * @param {string} registration.appname -
   * @param {function} listener -
   * @return {Configurator} -
   */
  doSubscribeConfig(registration, listener) {
    assert(listener, 'listener can not be null');
    assert(registration && registration.dataId, 'dataId can not be null');
    registration.group = registration.group || 'DEFAULT_GROUP';
    const key = this.configuratorKey(registration);
    let configurator = this.registrationConfiguratorMap.get(key);
    if (!configurator) {
      configurator = new Configurator({
        config: this.config,
        worker: this.worker,
        eventBus: this.eventBus,
        logger: this.logger,
        registration: Object.assign({}, registration, { listeners: [ listener ] }),
      });
      // TODO set auth
      this.registerCache.addConfigurator(configurator);
      this.addRegisterTask(configurator);
    } else {
      configurator.addListener(listener);
    }
    this.logger.info(
      '[registry/dataClient] regist configurator success, dataId: %s, registerId: %s',
      configurator.dataId, configurator.registId
    );
    return configurator;
  }

  /**
   * @param {object} config -
   * @param {string} config.group -
   * @param {string} config.dataId -
   */
  unregister(config) {
    assert(config && config.dataId);
    config.group = config.group || 'DEFAULT_GROUP';
    const { dataId, group } = config;
    const registers = this.registerCache.getAllPublisers()
      .filter(t => t.dataId === dataId && t.group === group);
    for (const register of registers) {
      register.unregister();
    }
    const key = this.publisherKey(config);
    this.registrationPublisherMap.delete(key);
  }

  unSubscribe(config) {
    if (config.type === 'address') {
      return this.doUnSubscribe(config);
    } else if (config.type === 'config') {
      return this.doUnSubscribeConfig(config);
    }
  }

  /**
   * @param {object} config -
   * @param {string} config.group -
   * @param {string} config.dataId -
   */
  doUnSubscribe(config) {
    assert(config && config.dataId);
    config.group = config.group || 'DEFAULT_GROUP';
    const { dataId, group } = config;
    const registers = this.registerCache.getAllSubscribers()
      .filter(t => t.dataId === dataId && t.group === group);
    for (const register of registers) {
      register.unregister();
    }
  }

  /**
   * @param {object} config -
   * @param {string} config.group -
   * @param {string} config.dataId -
   */
  doUnSubscribeConfig(config) {
    assert(config && config.dataId);
    config.group = config.group || 'DEFAULT_GROUP';
    const { dataId, group } = config;
    const registers = this.registerCache.getAllConfigurators()
      .filter(t => t.dataId === dataId && t.group === group);
    for (const register of registers) {
      register.unregister();
    }
  }

  async _init() {
    await this.client.ready();
    this.client.worker = this.worker;
  }

  async close() {
    await this.syncConfig.close();
    await this.registryCheck.close();
    await this.serverManager.close();
    await this.worker.close();
    await this.client.close();
  }

  get logger() {
    return this.options.logger;
  }

  get config() {
    return this.options.config;
  }

  get httpclient() {
    return this.options.httpclient;
  }

  publisherKey(registration) {
    return `${registration.group}:${registration.dataId}`;
  }

  subscriberKey(registration) {
    return `${registration.group}:${registration.dataId}:${registration.scope}`;
  }

  configuratorKey(registration) {
    return `${registration.group}:${registration.dataId}`;
  }

  addRegisterTask(register) {
    const event = new TaskEvent(register);
    this.worker.schedule(event);
  }
}

module.exports = RegistryDataClient;
