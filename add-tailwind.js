#!/usr/bin/env node

const exec = require('child_process').exec;
const fs = require('fs');
const path = require('path');

const packages = [
  'tailwindcss',
  'postcss-cli',
  'purgecss',
  '@fullhuman/postcss-purgecss',
  'autoprefixer'
];
const configFiles = ['postcss.config.js'];
const tailwindConfig = `@tailwind base;
@tailwind components;
@tailwind utilities;
`;

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
  const appName = process.argv[2];
  if (!appName) {
    console.error('You must provide an app name.');
    process.exit(1);
  }
  try {
    fs.accessSync(appName);
  } catch (err) {
    // empty
    console.error(`${appName} does not exist.`);
    process.exit(1);
  }

  try {
    await execSyncWithOutput(
      `yarn --cwd ./${appName} add ${packages.join(' ')}`
    );
    configFiles.forEach(file => {
      const src = path.join(__dirname, file)
      const dst = path.join(appName, file)
      console.log(`${src} -> ${dst}`)
      fs.copyFileSync(src, dst);
    });
    const stylesPath = path.join(appName, 'src/styles');
    fs.mkdirSync(stylesPath);
    fs.writeFileSync(path.join(stylesPath, 'index.css'), tailwindConfig);

    const pkgJsonFile = path.join(appName, 'package.json');
    const pkgJsonStr = fs.readFileSync(pkgJsonFile, 'utf8');
    const pkgJson = JSON.parse(pkgJsonStr);
    pkgJson.scripts['tailwind'] =
      'tailwind build src/styles/index.css -o src/styles/tailwind.src.css';
    pkgJson.scripts['postcss'] =
      'postcss src/styles/tailwind.src.css -o src/styles/tailwind.css --env production';
    pkgJson.scripts['build:style'] = 'yarn tailwind && yarn postcss';
    fs.writeFileSync(pkgJsonFile, JSON.stringify(pkgJson, null, 2), 'utf8');

    process.chdir(appName);
    await execSyncWithOutput('npx tailwind init');

    console.log(`In App.tsx, add\nimport 'styles/tailwind.css';`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
