'use strict';

const assert = require('assert');

class RegisterCache {
  constructor() {
    /** @type {Map<string, Publisher>} */
    this.publisherMap = new Map();
    /** @type {Map<string, Subscriber>} */
    this.subscriberMap = new Map();
    /** @type {Map<string, Configurator>} */
    this.configuratorMap = new Map();
  }

  addPublisher(publisher) {
    assert(publisher && publisher.dataId);
    this.publisherMap.set(publisher.registId, publisher);
  }

  addSubscriber(subscriber) {
    assert(subscriber && subscriber.dataId);
    this.subscriberMap.set(subscriber.registId, subscriber);
  }

  addConfigurator(configurator) {
    assert(configurator && configurator.dataId);
    this.configuratorMap.set(configurator.registId, configurator);
  }

  remove(registId) {
    if (this.publisherMap.delete(registId)) {
      return;
    }
    if (this.subscriberMap.delete(registId)) {
      return;
    }
    if (this.configuratorMap.delete(registId)) {
      return;
    }
  }

  getSubscriber(registId) {
    return this.subscriberMap.get(registId);
  }

  getConfigurator(registId) {
    return this.configuratorMap.get(registId);
  }

  getAllSubscribers() {
    return Array.from(this.subscriberMap.values());
  }

  getAllPublisers() {
    return Array.from(this.publisherMap.values());
  }

  getAllConfigurators() {
    return Array.from(this.configuratorMap.values());
  }
}

module.exports = RegisterCache;
