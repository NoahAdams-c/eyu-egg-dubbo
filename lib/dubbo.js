
const path = require('path');
const { createPromiseClient } = require('@apachedubbo/dubbo');
const { createDubboTransport, dubboNodeAdapter } = require('@apachedubbo/dubbo-node');

const requireDubboService = (app, protoName) => {
  const modulePath = path.join(app.baseDir, 'dubbo', 'gen', `${protoName}_dubbo`);
  return require(modulePath).default;
};

const createDubboInstance = app => {
  return {
    services: app.config.dubbo.services,
    client(serviceInfo) {
      const { proto, baseUrl } = this.services[serviceInfo];
      const service = requireDubboService(app, proto);
      return createPromiseClient(service, createDubboTransport({
        baseUrl,
        httpVersion: '1.1',
      }), { serviceGroup: 'dubbo', serviceVersion: '1.0.0' });
    },
    registRoute(protoName, impls) {
      const service = requireDubboService(app, protoName);
      app.use(dubboNodeAdapter({
        routes: dubboRouter => dubboRouter.service(service, impls, { serviceGroup: 'dubbo', serviceVersion: '1.0.0' }),
      }));
    },
    impl: {},
  };
};

exports.initPlugin = app => {
  app.dubbo = createDubboInstance(app);
};
