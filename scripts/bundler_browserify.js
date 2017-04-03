const fs = require('fs');
const path = require('path');
const browserify = require('browserify');
const watchify = require('watchify');
const sourcemaps = require('./sourcemaps');

let _main = null;
let _bundle = null;
let _production = null;
let _maps = null;
let _b = null;

function configure(main, bundle, production = false, maps = false) {
  _main = main;
  _bundle = bundle;
  _production = production;
  _maps = maps;
  _b = browserify(_main, {
    cache: {},
    packageCache: {},
    paths: ['./node_modules/'],
    debug: !production
  });
  _b.plugin(watchify);
}

// Re-bundle helper method
function bundle(callback = null, dest = path.dirname(_bundle)) {
  setTimeout(() => {
    if (!fs.existsSync(dest)) { fs.mkdirSync(dest); }
    _b.bundle((err, buf) => {
      fs.writeFileSync(_bundle, buf.toString());
      if (!_production && _maps) { 
        sourcemaps.flatten(_bundle, url => {
          if ( url.indexOf('app.js') < 0 && url.indexOf('node_modules') < 0 ) {
            return url.replace('dist/', '');
          }
        });
      }
      console.log('Bundle ready!');
      if (callback) { callback(); }
    });
  }, 100);
}

module.exports = {
  configure: configure,
  bundle: bundle
}
