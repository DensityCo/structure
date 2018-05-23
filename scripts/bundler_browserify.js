const chalk = require('chalk');
const path = require('path');
const fs = require('fs-extra');
const browserify = require('browserify');
const watchify = require('watchify');
const utilities = require('./utilities');

function bundler(inFile, outFile, options) {
  const _inFile = inFile;
  const _outFile = outFile;
  const _options = options || {};
  const _b = browserify(_inFile, {
    cache: {},
    packageCache: {},
    sourceType: 'module',
    paths: _options.paths || ['./node_modules/'],
    debug: _options.sourceMap
  });
  _b.plugin(watchify);


  // Common Bundler API
  return {
    name: 'Browserify Bundler',
    inFile: _inFile,
    outFile: _outFile,
    options: _options,

    bundle: function () {
      return fs.exists(dest).then(exists => { // Create the folder for the out file if is doesn't exist.
        if (exists) {
          return fs.mkdir(dest);
        } else {
          return Promise.resolve();
        }
      }).then(() => { // Bundle with Browserify
        return new Promise((resolve, reject) => {
          _b.bundle((err, buf) => {
            if (err) {
              reject(err);
            } else {
              resolve(buf);
            }
          });
        });
      }).catch(err => { // Handle bundling errors
        console.error(chalk.red(`Error bundling: ${err}`));
      }).then(buf => { // Write bundled code to output file.
        fs.writeFile(_outFile, buf.toString());
      }).then(() => { // If sourcemaps were turned on, then flatten source maps
        if (!_options.production && _options.sourceMap) {
          return fs.readFile(`${outFile}.map`).then(mapContent => {
            return fs.writeFile(`${_outFile}.map.orig`, mapContent);
          }).then(() => {
            // Attempt to flatten the source map with sourcery.
            return utilities.flattenSourceMap(_outFile, url => {
              if (url.indexOf('app.js') === -1 && url.indexOf('node_modules') === -1) {
                return url.replace('build/', '');
              }
            });
          });
        }
      }).then(() => {
        console.log(chalk.gray('Bundle ready!'));
      });
    },
  };
}

module.exports = bundler;
