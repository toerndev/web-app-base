#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const util = require('./util');

const prettierRc = { singleQuote: true, trailingComma: 'es5' };
const eslintRc = {
  extends: ['react-app', 'plugin:prettier/recommended', 'prettier/react'],
  overrides: [
    {
      files: ['**.ts', '**.tsx'],
      extends: [
        // root 'extends' from above is inherited and applied to these files too.
        // If order turns out to matter, these should probably go right after 'react-app'.
        'plugin:@typescript-eslint/recommended',
        'prettier/@typescript-eslint'
      ]
    }
  ]
};
const dotEnv = `BROWSER=none
GENERATE_SOURCEMAP=false`;

async function main() {
  const name = process.argv[2];
  if (!name) {
    console.error('You must provide an app name.');
    process.exit(1);
  }
  try {
    fs.accessSync(name);
    console.error(`${name} already exists.`);
    process.exit(1);
  } catch (err) {
    // empty
  }

  try {
    await util.execSyncWithOutput(`yarn create react-app ${name} --typescript`);
    console.log('\n');
    process.chdir(name);

    const filesInSrc = [
      'index.css',
      'App.css',
      'logo.svg',
      'serviceWorker.ts'
    ].map(file => path.join('src', file));
    const filesToDelete = ['README.md', ...filesInSrc];
    filesToDelete.forEach(file => {
      try {
        fs.unlinkSync(file);
      } catch (err) {
        console.error(`${file} suspiciously missing, can't delete`);
      }
    });

    // CRA file modifications
    const sedPatterns = [
      {file: 'src/App.tsx', pattern: '/css/d; /logo/d' },
      {file: 'src/index.tsx', pattern: '/css/d; /serviceWorker/d'},
    ]
    for (let idx = 0; idx < sedPatterns.length; idx++) {
      const { file, pattern } = sedPatterns[idx];
      await util.runSed(file, pattern);
    }
    console.log('\n')

    // Write config files
    fs.writeFileSync('.prettierrc', JSON.stringify(prettierRc, null, 2));
    fs.writeFileSync(
      '.eslintrc.js',
      `module.exports = ${JSON.stringify(eslintRc, null, 2)}`
    );
    fs.writeFileSync('.env', dotEnv);

    // Enable absolute imports
    await util.modifyJson('tsconfig.json', obj => {
      obj.compilerOptions.baseUrl = 'src';
    })
  } catch (err) {
    console.error(err);
    process.exit(1);
  }

  // "Gaeron's policy" (?): it's static output anyway so don't bother with peerDeps
  await util.execSyncWithOutput(
    'yarn add prettier eslint-config-prettier eslint-plugin-prettier'
  );
}

main();
// If the typescript version is too new it prints a version when running through eslint, and this somehow
// prevents vim-ale from fixing (but not linting) files even though the exit code is 0.
