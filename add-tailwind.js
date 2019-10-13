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
  'concurrently'
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

    const packageDotJson = path.join(appName, 'package.json');
    await util.modifyJson(packageDotJson, obj => {
      const postcssScript =
        'postcss src/style/tailwind.css -o src/style/tailwind.min.css';
      obj.scripts['build:style'] = `${postcssScript} --env production`;
      obj.scripts['dev:style'] = `${postcssScript} --watch --poll 500 --verbose`;

      // TODO: Rename start -> dev:app, build -> build:app in index.js to make scripts more coherent.
      obj.scripts['build:all'] = 'yarn build:style && yarn build';
      obj.scripts['dev'] = 'concurrently \"yarn dev:style\" \"yarn start\"';
    })

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
