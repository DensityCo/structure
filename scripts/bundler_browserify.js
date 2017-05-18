const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const browserify = require('browserify');
const watchify = require('watchify');
const sourcemaps = require('./sourcemaps');

function bundler(inFile, outFile, options) {
  const _inFile = inFile;
  const _outFile = outFile;
  const _options = options || {};
  const _b = browserify(_inFile, {
    cache: {},
    packageCache: {},
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
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const dest = path.dirname(_outFile);
          if (!fs.existsSync(dest)) { fs.mkdirSync(dest); }
          _b.bundle((err, buf) => {
            if (err) {
              console.log(chalk.red('Bundle error!'));
              reject();
            } else {
              fs.writeFileSync(_outFile, buf.toString());
              if (!_options.production && _options.sourceMap) {
                fs.writeFileSync(`${_outFile}.map.orig`, fs.readFileSync(`${_outFile}.map`));
                sourcemaps.flatten(_outFile, url => {
                  if ( url.indexOf('app.js') < 0 && url.indexOf('node_modules') < 0 ) {
                    return url.replace('dist/', '');
                  }
                }).then(() => {     
                  console.log(chalk.gray('Bundle ready!'));
                  resolve();
                });
              } else {
                console.log(chalk.gray('Bundle ready!'));
                resolve();
              }
            }
          });
        }, 100);
      });
    }
  }
}

module.exports = bundler;
