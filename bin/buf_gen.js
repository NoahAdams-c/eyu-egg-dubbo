#!/usr/bin/env node

const { Command } = require('commander');
const { execSync } = require('child_process');
const program = new Command();

// $ edubbo gen
program
  .command('gen')
  .description('Generating cjs by proto-buf ...')
  .action(() => {
    try {
      execSync('npm run buf-gen');
    } catch (err) {
      console.error('Fail to generate:', err.message);
    }
  });

program.parse(process.argv);
