# eyu-egg-dubbo

[![NPM version][npm-image]][npm-url]
[![npm download][download-image]][download-url]

[npm-image]: https://img.shields.io/npm/v/eyu-egg-dubbo.svg?style=flat-square
[npm-url]: https://npmjs.org/package/eyu-egg-dubbo
[download-image]: https://img.shields.io/npm/dm/eyu-egg-dubbo.svg?style=flat-square
[download-url]: https://npmjs.org/package/eyu-egg-dubbo

<!--
Description here.
-->

## Install

```bash
$ npm i eyu-egg-dubbo --save
```

## Usage

Register with the plugin list

```js
// {app_root}/config/plugin.js
exports.eyuEggDubbo = {
  enable: true,
  package: 'eyu-egg-dubbo',
};
```

Project directory

```bash
- egg-project
    - app
        - dubbo
            - impl
                - example.js // The RPC service implementation, note that it should be the same as the proto file name
        - controller
        - service
    - config
        - config.default.js
        - plugin.js
    - dubbo
        - gen
            - example_dubbo.js // Automatically generated definition file
            - example_pb.js // Automatically generated definition file
        - proto
            - example.proto // Message protocol
    - package.json
    - buf.gen.yaml // Automatically generated protobuf configuration file
    - README.md
```

Initialize and generate protobuf configuration file

```bash
npx edubbo init
```

Generate definition file

```bash
npx edubbo gen
```

## Configuration

```js
// {app_root}/config/config.default.js
exports.eyuEggDubbo = {
  globalServiceVersion: '1.0.0',
  globalServiceGroup: 'eyu-egg-dubbo',
  // nacos naming registry
  registry: {
    serverList: [ '' ],
    namespace: '',
    username: '',
    password: '',
  },
  // services config for dubbo.client
  services: {
    foo: { // service name, note that it should be the same as the proto file name
      baseUrl: '', // service host
    },
    bar: {
      baseUrl: ''
    }
  },
};
```

see [config/config.default.js](config/config.default.js) for more detail.

## Example

Message protocol(app/dubbo/proto/example.proto)

```proto
syntax = "proto3";

package apache.dubbo.demo.example.v1;

message SayRequest {
  string sentence = 1;
}

message SayResponse {
  string sentence = 1;
}

service ExampleService {
  rpc Say(SayRequest) returns (SayResponse) {}
  rpc Talk(SayRequest) returns (SayResponse) {}
}
```

**Server**

Configuring routes

```js
// {app_root}/app/route.js
module.exports = app => {
  const { router, controller } = app;
  router.get('/', controller.home.index);

  router.dubbo({ serviceName: 'example' });
};
```

Service implementation

```js
// {app_root}/app/dubbo/impl/example.js
const { Service } = require('egg');

class ExampleService extends Service {
  say(input) {
    const { ctx } = this;
    ctx.status = 200;
    ctx.body = {
      sentence: `You said: ${input.sentence}`,
    };
  }
  talk(input) {
    const { ctx } = this;
    ctx.status = 200;
    ctx.body = {
      sentence: `You talked: ${input.sentence}`,
    };
  }
}
```

**Client**

Configuration service

```js
// {app_root}/config/config.default.js
exports.dubbo = {
  app: true,
  globalServiceVersion: '1.0.0',
  globalServiceGroup: 'eyu-egg-dubbo',
  services: {
    example: {
      baseUrl: 'http://127.0.0.1:7001',
    },
  },
};
```

Invoke service

```js
// {app_root}/app/controller/home.js
const { Controller } = require('egg');

class HomeController extends Controller {
  async index() {
    const { ctx, app } = this;
    const res = await app.dubbo.client('example').say({ sentence: 'hello' });
    ctx.status = 200;
    ctx.body = res.sentence;
  }
}

module.exports = HomeController;
```

## Questions & Suggestions

Please open an issue [here](https://github.com/NoahAdams-c/eyu-egg-dubbo/issues).

## License

[MIT](LICENSE)
