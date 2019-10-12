const purgecss = require('@fullhuman/postcss-purgecss')({
  content: ['./src/**/*.ts', './src/**/*.tsx', './public/index.html'],
  css: ['./src/styles/tailwind.css'],
  defaultExtractor: content => content.match(/[A-Za-z0-9-_:/]+/g) || []
});
const tailwindcss = require('tailwindcss');
module.exports = {
  plugins: [
    tailwindcss('./tailwind.config.js'),
    require('autoprefixer'),
    ...(process.env.NODE_ENV === 'production' ? [purgecss] : [])
  ]
};
