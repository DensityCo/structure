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
function bundle(callback = null, dest = path.dirname(_bundle)) {
  if (!fs.existsSync(dest)) { fs.mkdirSync(dest); }
  _compiler.run((err, stats) => {
    if (err) {
      console.log('Bundle error!');
    } else {
      if (!_production && _maps) { 
        sourcemaps.flatten(_bundle, url => {
          url = url.replace('webpack:/', '');
          url = url.replace('/~/', '/node_modules/');
          if ( url.indexOf('app.js') < 0 && url.indexOf('node_modules') < 0 ) {
            url = url.replace('dist/', '');
          }
          return url;
        }); 
      }
      console.log('Bundle ready!');
      if (callback) { callback(); }
    }
  });
}

// Return a new language service and an initial program
module.exports = {
  compiler: _compiler,
  configure: configure,
  bundle: bundle
};
