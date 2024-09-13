/**
 * @param app 应用对象
 * @Description: 启动初始化
 * @Author: chenchen
 * @Date: 2024-09-03 10:11:21
 * @LastEditors: chenchen
 * @LastEditTime: 2024-09-03 14:29:28
 */
const path = require('path');
const { createDubboInstance, createNacosClient, registServiceToNacos } = require('./lib/dubbo');

module.exports = app => {
  // TODO: 初始化
  app.nacosServicePendingQueue = [];
  app.loader.loadToApp(path.join(app.config.baseDir, 'app', 'dubbo', 'impl'), 'dubboServiceClass', {
    initializer(impl, opt) {
      return impl;
    },
  });
  app.dubbo = createDubboInstance(app);
  app.router.dubbo = ({ serviceName, version, group, middlewares = [] }) => app.dubbo._registRoute(serviceName, version, group, middlewares);
  app.ready(async () => {
    app.nacosClient = await createNacosClient(app);
    // 注册Nacos ready前未注册的服务
    for (const pendingService of app.nacosServicePendingQueue) {
      registServiceToNacos(app, pendingService);
    }
  });
};
