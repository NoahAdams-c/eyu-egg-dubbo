/**
 * @param app 应用对象
 * @Description: 启动初始化
 * @Author: chenchen
 * @Date: 2024-09-03 10:11:21
 * @LastEditors: chenchen
 * @LastEditTime: 2024-09-03 14:29:28
 */
const createDubboInstance = require('./lib/dubbo');

module.exports = app => {
  // TODO: 初始化
  app.dubbo = createDubboInstance(app);
  app.router.dubbo = (protoName, impls) => {
    app.dubbo.registRoute(protoName, impls);
  };
};
