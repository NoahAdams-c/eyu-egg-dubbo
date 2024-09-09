'use strict';

const mock = require('egg-mock');

describe('test/index.test.js', () => {
  let app;
  before(() => {
    app = mock.app({
      baseDir: 'apps/example',
    });
    return app.ready();
  });

  after(() => app.close());
  afterEach(mock.restore);

  it('should GET /', () => {
    console.log(app);
    return app.httpRequest()
      .get('/')
      .expect('hi, eyuEggDubbo')
      .expect(200);
  });
});
