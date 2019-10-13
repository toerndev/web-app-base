const tailwindcss = require('tailwindcss');
const purgecss = require('@fullhuman/postcss-purgecss')({
  content: ['./src/**/*.ts', './src/**/*.tsx', './public/index.html'],
  css: ['./src/styles/tailwind.css'],
  defaultExtractor: content => content.match(/[A-Za-z0-9-_:/]+/g) || [],
});
const cssnano = require('cssnano');
const autoprefixer = require('autoprefixer');

module.exports = {
  plugins: [
    tailwindcss('./tailwind.config.js'),
    ...(process.env.NODE_ENV === 'production' ? [purgecss, cssnano] : []),
    autoprefixer,
  ],
};
