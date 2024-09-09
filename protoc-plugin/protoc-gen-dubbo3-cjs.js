const protobuf = require('@bufbuild/protobuf');
const { createEcmaScriptPlugin, runNodeJs } = require('@bufbuild/protoplugin');

const generateService = (schema, f, service) => {
  const { MethodKind: rtMethodKind, MethodIdempotency: rtMethodIdempotency } = schema.runtime;
  // f.print((0, ecmascript_1.makeJsDoc)(service));
  f.print('const ', service.name, ' = {');
  f.print('  typeName: "', service.typeName, '",');
  f.print('  methods: {');
  for (const method of service.methods) {
    // f.print((0, ecmascript_1.makeJsDoc)(method, "    "));
    f.print('    ', method.name.replace(/^./, match => match.toLowerCase()), ': {');
    f.print('      name: "', method.name, '",');
    f.print('      I: ', method.input, ',');
    f.print('      O: ', method.output, ',');
    f.print('      kind: ', rtMethodKind, '.', protobuf.MethodKind[method.methodKind], ',');
    if (method.idempotency !== undefined) {
      f.print('      idempotency: ', rtMethodIdempotency, '.', protobuf.MethodIdempotency[method.idempotency], ',');
    }
    // In case we start supporting options, we have to surface them here
    f.print('    },');
  }
  f.print('  }');
  f.print('};');
  f.print();
  f.print('exports.default = ', service.name);
};

const plugin = createEcmaScriptPlugin({
  name: 'protoc-gen-dubbo3-cjs',
  version: 'v1',
  generateJs(schema) {
    for (const protoFile of schema.files) {
      const file = schema.generateFile(protoFile.name + '_dubbo.js');
      file.preamble(protoFile);
      for (const service of protoFile.services) {
        generateService(schema, file, service);
      }
    }
  },
});

runNodeJs(plugin);
