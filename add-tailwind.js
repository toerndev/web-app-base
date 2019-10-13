#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const util = require('./util');

const packages = [
  'tailwindcss',
  'postcss-cli',
  '@fullhuman/postcss-purgecss',
  'cssnano',
  'autoprefixer',
  'concurrently',
];
const configFiles = ['postcss.config.js'];
const tailwindConfig = `@tailwind base;
@tailwind components;
@tailwind utilities;
`;

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
    await util.execSyncWithOutput(
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

    await util.modifyJson(path.join(appName, 'package.json'), obj => {
      const postcssScript =
        'postcss src/style/tailwind.css -o src/style/tailwind.min.css';

      obj.scripts['build:app'] = obj.scripts['build'];
      obj.scripts['build:style'] = `${postcssScript} --env production --verbose`;
      obj.scripts['build'] = 'yarn build:style && yarn build:app';

      obj.scripts['dev:app'] = obj.scripts['dev'];
      // Only --watch without --poll seemed to get stuck after a few changes
      obj.scripts[
        'dev:style'
      ] = `${postcssScript} --watch --poll 500 --verbose`;
      obj.scripts['dev'] = 'concurrently "yarn dev:style" "yarn dev:app"';
    });

    process.chdir(appName);
    await util.execSyncWithOutput('npx tailwind init');
    await util.execSyncWithOutput(`yarn build:style`);

    console.log(`\n\nIn App.tsx, add\nimport 'styles/tailwind.min.css';`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
