const start = require('./scripts/start');
const build = require('./scripts/build');

const sass = require('./scripts/styles_sass');
const typescript = require('./scripts/transpiler_typescript');
const babel = require('./scripts/transpiler_babel');
const webpack = require('./scripts/bundler_webpack');
const browserify = require('./scripts/bundler_browserify');

module.exports = {
  start: start,
  build: build,

  sass: sass,
  typescript: typescript,
  babel: babel,
  webpack: webpack,
  browserify: browserify,
};
