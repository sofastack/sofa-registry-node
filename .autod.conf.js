'use strict';

module.exports = {
  write: true,
  prefix: '^',
  devprefix: '^',
  exclude: [
    'test/fixtures',
  ],
  keep: [],
  devdep: [
    'autod',
    'egg-bin',
    'eslint',
    'eslint-config-egg',
    'webstorm-disable-index',
    'egg-ci'
  ],
  semver: [],
};
