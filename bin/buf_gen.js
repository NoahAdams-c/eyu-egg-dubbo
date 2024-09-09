#!/usr/bin/env node

const { program } = require('commander');
const { execSync } = require('child_process');

// $ edubbo gen
program
  .command('gen')
  .description('Generating cjs by proto-buf ...')
  .action(() => {
    execSync('npm run buf-gen');
  });

program.parse(process.argv);
