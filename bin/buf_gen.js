#!/usr/bin/env node

const { Command } = require('commander');
const yaml = require('js-yaml');
const fs = require('fs');
const { execSync } = require('child_process');
const program = new Command();

const bufGenYamlTemplate = {
  version: 'v2',
  clean: true,
  plugins: [
    {
      local: 'node_modules/.bin/protoc-gen-es',
      out: './dubbo/gen',
      opt: [
        'target=js',
        'js_import_style=legacy_commonjs',
      ],
    },
    {
      local: 'node_modules/.bin/protoc-gen-dubbo3-cjs',
      out: './dubbo/gen',
      opt: [
        'target=js',
        'js_import_style=legacy_commonjs',
      ],
    },
  ],
  inputs: [
    {
      directory: './dubbo/proto/',
    },
  ],
};

// $ edubbo init 初始化，生产buf.gen.yaml文件
program
  .command('init')
  .description('Generating buf.gen.yaml ...')
  .action(() => {
    try {
      const yamlContent = yaml.dump(bufGenYamlTemplate);
      fs.writeFileSync('./buf.gen.yaml', yamlContent);
    } catch (err) {
      console.error('Fail to generate:', err.message);
    }
  });

// $ edubbo gen 根据proto定义文件生成cjs定义文件
program
  .command('gen')
  .description('Generating cjs by proto-buf ...')
  .action(() => {
    try {
      execSync('node node_modules/.bin/buf generate');
    } catch (err) {
      console.error('Fail to generate:', err.message);
    }
  });

program.parse(process.argv);
