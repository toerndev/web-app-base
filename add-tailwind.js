#!/usr/bin/env node

const exec = require('child_process').exec;
const fs = require('fs');
const path = require('path');

const packages = [
  'tailwindcss',
  'postcss-cli',
  '@fullhuman/postcss-purgecss',
  'cssnano',
  'autoprefixer',
  'concurrently'
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
      const src = path.join(__dirname, file);
      const dst = path.join(appName, file);
      console.log(`${src} -> ${dst}`);
      fs.copyFileSync(src, dst);
    });
    const stylePath = path.join(appName, 'src/style');
    fs.mkdirSync(stylePath);
    fs.writeFileSync(path.join(stylePath, 'tailwind.css'), tailwindConfig);

    const pkgJsonFile = path.join(appName, 'package.json');
    const pkgJsonStr = fs.readFileSync(pkgJsonFile, 'utf8');
    const pkgJson = JSON.parse(pkgJsonStr);

    const postcssScript =
      'postcss src/style/tailwind.css -o src/style/tailwind.min.css';
    pkgJson.scripts['build:style'] = `${postcssScript} --env production`;
    pkgJson.scripts['dev:style'] = `${postcssScript} --watch --verbose`;

    // TODO: Rename start -> dev:app, build -> build:app in index.js to make scripts more coherent.
    pkgJson.scripts['build:all'] = 'yarn build:style && yarn build';
    pkgJson.scripts['dev'] = 'concurrently \"yarn dev:style\" \"yarn start\"';

    fs.writeFileSync(pkgJsonFile, JSON.stringify(pkgJson, null, 2), 'utf8');

    process.chdir(appName);
    await execSyncWithOutput('npx tailwind init');
    await execSyncWithOutput(`yarn build:style`);

    console.log(`\n\nIn App.tsx, add\nimport 'styles/tailwind.min.css';`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
