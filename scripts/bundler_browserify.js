const chalk = require('chalk');
const path = require('path');
const fs = require('fsp');
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
      return fs.existsP(dest).then(exists => { // Create the folder for the out file if is doesn't exist.
        if (exists) {
          return fs.mkdirP(dest);
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
        fs.writeFileP(_outFile, buf.toString());
      }).then(() => { // If sourcemaps were turned on, then flatten source maps
        if (!_options.production && _options.sourceMap) {
          return fs.readFileP(`${outFile}.map`).then(mapContent => {
            return fs.writeFileP(`${_outFile}.map.orig`, mapContent);
          }).then(() => {
            // Attempt to flatten the source map with sourcery.
            return utilities.flattenSourceMap(_outFile, url => {
              if (url.indexOf('app.js') === -1 && url.indexOf('node_modules') === -1) {
                return url.replace('dist/', '');
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
