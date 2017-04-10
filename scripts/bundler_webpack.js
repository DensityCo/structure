const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const sorcery = require('sorcery');
const sourcemaps = require('./sourcemaps');

let _main = null;
let _bundle = null;
let _production = null;
let _maps = null;
let _compiler = null;


// Helper to set up the bundler
function configure(main, bundle, production = false, maps = false) {
  _main = main;
  _bundle = bundle;
  _production = production;
  _maps = maps;
  _compiler = webpack({
    entry: _main,
    devtool: (!_production && _maps) ? 'source-map' : false,
    output: { 
      filename: path.basename(_bundle),
      path: path.resolve(path.dirname(_bundle))
    },
    plugins: _production ? [
      new webpack.DefinePlugin({
        'process.env': {
          'NODE_ENV': '"production"'
        }
      })
    ] : []
  });
}

// Re-bundle helper method
function bundle(dest = path.dirname(_bundle)) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(dest)) { fs.mkdirSync(dest); }
    _compiler.run((err, stats) => {
      if (err) {
        console.log(chalk.red('Bundle error!'));
        reject();
      } else {
        if (!_production && _maps) { 
          fs.writeFileSync(`${_bundle}.map.orig`, fs.readFileSync(`${_bundle}.map`));
          sourcemaps.flatten(_bundle, url => {
            
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

// Return a new language service and an initial program
module.exports = {
  compiler: _compiler,
  configure: configure,
  bundle: bundle
};
