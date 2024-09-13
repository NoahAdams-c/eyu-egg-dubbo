
const path = require('path');
const { createPromiseClient } = require('@apachedubbo/dubbo');
const { createDubboTransport } = require('@apachedubbo/dubbo-node');
const { expressDubboMiddleware } = require('@apachedubbo/dubbo-express');
const { NacosNamingClient } = require('nacos');

const getIPAddress = () => {
  const interfaces = require('os').networkInterfaces();
  for (const devName in interfaces) {
    const iface = interfaces[devName];
    for (let i = 0; i < iface.length; i++) {
      const alias = iface[i];
      if (
        alias.family === 'IPv4' &&
        alias.address !== '127.0.0.1' &&
        !alias.internal
      ) {
        return alias.address;
      }
    }
  }
};

const requireDubboService = (app, protoName) => {
  const modulePath = path.join(app.baseDir, 'dubbo', 'gen', `${protoName}_dubbo`);
  return require(modulePath).default;
};

const registServiceToNacos = (app, serviceOpts = {}) => {
  const { serviceName, version, label = 'provider', group, metadata = {} } = serviceOpts;
  if (!serviceName || !version || !group) {
    console.warn('[eyu-egg-dubbo] Regist service fail: missing parameter.');
    return;
  }
  if (app.nacosClient) {
    app.nacosClient.registerInstance(
      `${serviceName}_${version}_${label}`,
      {
        ip: app.curIP, // 服务实例IP
        port: app.config.cluster.listen.port, // 服务实例端口
        weight: 1, // 服务实例权重
        healthy: true, // 是否健康
        enabled: true, // 是否启用
        ephemeral: true, // 是否临时实例
        metadata,
      },
      group
    );
  } else {
    app.nacosServicePendingQueue.push(serviceOpts);
  }
};

const adapter = (app, serviceName, serviceOpts, middlewares) => {
  const service = requireDubboService(app, serviceName);
  const package = service.typeName;
  const implMethodNames = Object.keys(service.methods);
  for (const implMethodName of implMethodNames) {
    const mdw = (ctx, next) => {
      ctx.req.body = ctx.request.body;
      // service实例化并携带当前请求context
      const impl = new app.dubboServiceClass[serviceName](ctx);
      const traceId = Date.now();
      app.logger.info('[eyu-egg-dubbo] (%s)RPC Invoke: %s\nInput: %s', traceId, `${package}.${service.methods[implMethodName].name}`, ctx.request.body);
      expressDubboMiddleware({
        routes: dubboRouter => dubboRouter.rpc(
          service,
          service.methods[implMethodName],
          async (input, context) => {
            await impl[implMethodName](input, context);
            const result = impl.ctx.response.body;
            app.logger.info('[eyu-egg-dubbo] (%s)RPC Invoke: %s\nOutput: %s', traceId, `${package}.${service.methods[implMethodName].name}`, result);
            return result;
          },
          serviceOpts),
      })(ctx.req, ctx.res, next);
    };
    app.router.register(`/${package}/${service.methods[implMethodName].name}`, [ 'post' ], [ ...middlewares, mdw ]);
  }
  registServiceToNacos(app, {
    serviceName,
    version: serviceOpts.serviceVersion,
    group: serviceOpts.serviceGroup,
    metadata: {
      package,
      methods: JSON.stringify(Object.values(service.methods).map(item => item.name)),
    },
  });
};

const createDubboClient = (app, serviceName, serviceOpts) => {
  const { baseUrl } = app.config.dubbo.services[serviceName];
  const service = requireDubboService(app, serviceName);

  registServiceToNacos(app, {
    serviceName,
    version: serviceOpts.serviceVersion,
    group: serviceOpts.serviceGroup,
    label: 'consumer',
    metadata: {
      who: app.name,
    },
  });

  return createPromiseClient(service, createDubboTransport({
    baseUrl,
    useBinaryFormat: false,
    // interceptors: [ next => async req => {
    //   // TODO 请求拦截器
    //   await next(req);
    // } ],
    httpVersion: serviceOpts.httpVersion,
  }), { serviceGroup: serviceOpts.serviceGroup, serviceVersion: serviceOpts.serviceVersion });

};

const createNacosClient = async app => {
  const registry = app.config.dubbo.registry;
  let nacosClient = null;
  if (registry) {
    try {
      nacosClient = new NacosNamingClient({ ...registry, logger: console });
      await nacosClient.ready();
      console.log('[eyu-egg-dubbo] Nacos client start success.');
    } catch (err) {
      console.error('[eyu-egg-dubbo] Nacos client start fail:', err);
      nacosClient = null;
    }
  }
  return nacosClient;
};

const createDubboInstance = app => {
  app.curIP = getIPAddress();
  const { globalServiceVersion = '1.0.0', globalServiceGroup = 'eyu-egg-dubbo' } = app.config.dubbo;
  const DEFAULT_HTTP_VERSION = '2.0';
  const dubboInstance = {
    client(serviceName, serviceOpts = { httpVersion: DEFAULT_HTTP_VERSION, serviceGroup: globalServiceGroup, serviceVersion: globalServiceVersion }) {
      if (!app.config.dubbo.services || !app.config.dubbo.services[serviceName]) {
        throw (new Error('[eyu-egg-dubbo] Dubbo client init fail: service is undefined.'));
      }
      return createDubboClient(app, serviceName, serviceOpts);
    },
    _registRoute(serviceName, version = globalServiceVersion, group = globalServiceGroup, middlewares) {
      adapter(app, serviceName, { serviceGroup: group, serviceVersion: version }, middlewares);
    },
    impl: {},
  };

  return dubboInstance;
};

module.exports = { createDubboInstance, createNacosClient, registServiceToNacos };
