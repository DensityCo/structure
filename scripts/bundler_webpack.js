const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');
const webpack = require('webpack');
const utilities = require('./utilities');


function bundler(inFile, outFile, options) {
  const _inFile = inFile;
  const _outFile = outFile;
  const _options = options || {};
  const _compiler = webpack({
    entry: _inFile,
    devtool: (!_options.production && _options.sourceMap) ? 'source-map' : false,
    output: { 
      filename: path.basename(_outFile),
      path: path.resolve(path.dirname(_outFile))
    },
    plugins: [
      _options.production ?
      new webpack.DefinePlugin({
        'process.env': {
          'NODE_ENV': '"production"'
        }
      }) :
      new webpack.DefinePlugin({
        'process.env': {
          'NODE_ENV': '"development"'
        }
      })
    ]
  });


  // Common Bundler API
  return {
    name: 'Webpack Bundler',
    inFile: _inFile,
    outFile: _outFile,
    options: _options,

    bundle: function() {
      const dest = path.dirname(_outFile);
      return fs.exists(dest).then(exists => { // Create the folder for the out file if is doesn't exist.
        if (!exists) {
          return fs.mkdir(dest);
        } else {
          return Promise.resolve();
        }
      }).then(() => { // Bundle with Webpack
        return new Promise((resolve, reject) => {
          _compiler.run((err, stats) => {
            if (err) {
              reject(err);
            } else {
              resolve(stats);
            }
          });
        });
      }).then(stats => { // Add source maps
        if (!_options.production && _options.sourceMap) { 
          return fs.readFile(`${outFile}.map`).then(mapContent => {
            return fs.writeFile(`${_outFile}.map.orig`, mapContent);
          }).then(() => {
            return utilities.flattenSourceMap(_outFile, url => {
              // Fix various webpack stuff
              url = url.replace('/~/', '/node_modules/');
              url = url.replace('webpack:/', '');
              url = url.replace('/(webpack)/', '/node_modules/webpack/');          
              url = url.replace(/\/webpack\/bootstrap [a-z0-9]+/, '/node_modules/webpack/lib/webpack.js');

              // Module-specific fixes
              url = url.replace('/moment/locale ^/.*$', '/moment/locale/en-gb.js');
              url = url.replace('/@blueprintjs/core/dist/components/src/components/', '/@blueprintjs/core/src/components/');
              url = url.replace('/@blueprintjs/core/dist/src/', '/@blueprintjs/core/src/');
              url = url.replace('/@blueprintjs/datetime/dist/src/', '/@blueprintjs/datetime/src/');
              url = url.replace('/airbnb-prop-types/index.js', null);

              // All source files are mapped from outside the /build directory
              if (url.indexOf('build/app.js') === -1) {
                const currentPath = path.resolve('.');
                url = url.replace(`${currentPath}/build`, currentPath);
              }

              // Good to go!
              return url;
            });
          });
        } else {
          return Promise.resolve();
        }
      }).then(() => {
        console.log(chalk.gray('Bundle ready!'));
      }).catch(err => {
        console.error(chalk.red(`Error bundling: ${err}`));
      });
    },
  };
}

module.exports = bundler;
