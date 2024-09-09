
const path = require('path');
const { createPromiseClient } = require('@apachedubbo/dubbo');
const { createDubboTransport, dubboNodeAdapter } = require('@apachedubbo/dubbo-node');
const { expressDubboMiddleware } = require('@apachedubbo/dubbo-express');

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
      const adapter = expressDubboMiddleware({
        routes: dubboRouter => dubboRouter.service(service, impls, { serviceGroup: 'dubbo', serviceVersion: '1.0.0' }),
      });
      app.use((ctx, next) => adapter(ctx.req, ctx.res, next));
    },
    impl: app.dubboImpls,
  };
};

module.exports = createDubboInstance;
