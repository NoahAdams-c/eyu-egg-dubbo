/**
 * @param app 应用对象
 * @Description: 启动初始化
 * @Author: chenchen
 * @Date: 2024-09-03 10:11:21
 * @LastEditors: chenchen
 * @LastEditTime: 2024-09-03 14:29:28
 */
const path = require('path');
const { initPlugin } = require('./lib/dubbo');

module.exports = app => {
  // TODO: 初始化
  app.beforeStart(async () => {
    if (app.config.dubbo.app) {
      initPlugin(app);
    }
    app.loader.loadToApp(path.join(app.baseDir, 'app/dubbo/impl'), 'dubbo.impl');
    Object.defineProperty(app, 'router', {
      dubbo(protoName, impls) {
        app.dubbo.registRoute(protoName, impls);
      },
    });
  });
};
