#!/usr/bin/env node

const exec = require('child_process').exec;
const fs = require('fs');
const path = require('path');

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

async function execSyncWithOutput(cmd) {
  return new Promise((resolve, reject) => {
    const proc = exec(cmd, err => {
      reject(err);
    });
    proc.stdout.pipe(process.stdout);
    proc.stderr.pipe(process.stderr);
    proc.on('exit', () => resolve());
  });
}

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
    await execSyncWithOutput(`yarn create react-app ${name} --typescript`);
    console.log('\n');
    process.chdir(name);
    console.log(process.cwd())

    const filesInSrc = ['index.css', 'App.css', 'logo.svg', 'serviceWorker.ts'].map(file => path.join('src', file));
    const filesToDelete = ['README.md', ...filesInSrc];
    filesToDelete.forEach(file => {
      try {
        fs.unlinkSync(file)
      } catch (err) {
        console.error(`${file} suspiciously missing, can't delete`)
      }
    })


    fs.writeFileSync('.prettierrc', JSON.stringify(prettierRc, null, 2));
    fs.writeFileSync(
      '.eslintrc.js',
      `module.exports = ${JSON.stringify(eslintRc, null, 2)}`
    );
    fs.writeFileSync('.env', dotEnv);

    // Enable absolute imports
    tsconfig = JSON.parse(fs.readFileSync('tsconfig.json'));
    tsconfig.compilerOptions.baseUrl = 'src';
    fs.writeFileSync('tsconfig.json', JSON.stringify(tsconfig, null, 2));
  } catch (err) {
    console.error(err);
    process.exit(1);
  }

  // "Gaeron's policy" (?): it's static output anyway so don't bother with peerDeps
  await execSyncWithOutput(
    'yarn add prettier eslint-config-prettier eslint-plugin-prettier'
  );

}

main();
// If the typescript version is too new it prints a version when running through eslint, and this somehow
// prevents vim-ale from fixing (but not linting) files even though the exit code is 0.
