const assets = require('./scripts/assets');
const sass = require('./scripts/styles_sass');
const typescript = require('./scripts/transpiler_typescript');
const babel = require('./scripts/transpiler_babel');
const webpack = require('./scripts/bundler_webpack');
const browserify = require('./scripts/bundler_browserify');
const start = require('./scripts/start');
const build = require('./scripts/build');

module.exports = {

  // Assets and styles
  assets: assets,
  sass: sass,

  // Transpilers
  typescript: typescript,
  babel: babel,

  // Bundlers
  webpack: webpack,
  browserify: browserify,

  // Tasks
  start: start,
  build: build,

};
