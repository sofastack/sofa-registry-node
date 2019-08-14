'use strict';

const httpclient = require('urllib');
const path = require('path');
const fs = require('fs');
const sleep = require('mz-modules/sleep');
const META_URL = 'http://localhost:9615/health/check';
const DATA_URL = 'http://localhost:9622/health/check';
const SESSION_URL = 'http://localhost:9603/health/check';
const META_HEALTH = 'raftStatus:Leader';
const DATA_HEALTH = 'status:WORKING';
const MAX_RETRY = 10;
const LOG_FILE = path.join(__dirname, '../registry-integration/logs/registry-integration-std.out');
const ERROR_LOG_FILE = path.join(__dirname, '../registry-integration/logs/common-error.log');

async function checkMeta() {
  const { data: { message } } = await httpclient.curl(META_URL, {
    dataType: 'json',
  });
  if (message.indexOf(META_HEALTH)) {
    console.log('meta is healthy');
    return;
  }
  console.log('meta is unhealthy: ' + message);
}

async function checkData() {
  const { data: { message } } = await httpclient.curl(DATA_URL, {
    dataType: 'json',
  });
  if (message.indexOf(DATA_HEALTH)) {
    console.log('data is healthy');
    return;
  }
  console.log('data is unhealthy: ' + message);
}

async function checkSession() {
  const { data: { success } } = await httpclient.curl(SESSION_URL, {
    dataType: 'json',
  });
  if (success) {
    console.log('session is healthy');
    return;
  }
  console.log('session is unhealthy');
}

function printLog() {
  const stdLog = fs.readFileSync(LOG_FILE, 'utf8');
  console.log(stdLog);
  const errLog = fs.readFileSync(ERROR_LOG_FILE, 'utf8');
  console.log(errLog);
}

async function healthCheck(time = 0) {
  if (time > MAX_RETRY) {
    printLog();
    throw new Error('max retry time');
  }
  try {
    await Promise.all([
      checkMeta(),
      checkData(),
      checkSession(),
    ]);
  } catch (e) {
    console.error('health check failed: ', e);
    await sleep(1000);
    await healthCheck(time + 1);
  }
}

healthCheck()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
