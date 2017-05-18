const assets = require('./scripts/assets');

const sass = require('./scripts/styles_sass');

const typescript = require('./scripts/transpiler_typescript');
const babel = require('./scripts/transpiler_babel');

const webpack = require('./scripts/bundler_webpack');
const browserify = require('./scripts/bundler_browserify');

const start = require('./scripts/start');
const build = require('./scripts/build');

module.exports = {
  assets: assets,

  sass: sass,

  typescript: typescript,
  babel: babel,

  webpack: webpack,
  browserify: browserify,

  start: start,
  build: build,
};
