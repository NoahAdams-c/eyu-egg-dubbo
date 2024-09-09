'use strict';

/**
 * egg-eyu-egg-dubbo default config
 * @member Config#eyuEggDubbo
 * @property {String} SOME_KEY - some description
 */
exports.dubbo = {
  app: true,
  registry: {
    servList: [ '' ],
    namespace: '',
    username: '',
    password: '',
  },
  services: {
    serviceName: {
      proto: '',
      baseUrl: '',
    },
  },
};
