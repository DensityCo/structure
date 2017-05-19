const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const sorcery = require('sorcery');
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
    plugins: _options.production ? [
      new webpack.DefinePlugin({
        'process.env': {
          'NODE_ENV': '"production"'
        }
      })
    ] : [
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

    bundle: function () {
      return new Promise((resolve, reject) => {
        const dest = path.dirname(_outFile);
        if (!fs.existsSync(dest)) { fs.mkdirSync(dest); }

        _compiler.run((err, stats) => {
          if (err) {
            console.log(chalk.red('Bundle error!'));
            reject();
          } else {
            if (!_options.production && _options.sourceMap) { 
              fs.writeFileSync(`${_outFile}.map.orig`, fs.readFileSync(`${_outFile}.map`));
              utilities.flattenSourceMap(_outFile, url => {
                
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

                // All source files are mapped from outside the /dist directory
                if ( url.indexOf('dist/app.js') < 0 ) {
                  const currentPath = path.resolve('.')
                  url = url.replace(`${currentPath}/dist`, currentPath);
                }

                // Good to go!
                return url;
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
      });
    }
  }
}

module.exports = bundler;
