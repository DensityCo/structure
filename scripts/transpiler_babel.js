const fs = require('fs');
const glob = require('glob');
const babel = require('babel-core');
const utilities = require('./utilities');

let _sourceGlob = null;
let _options = null;

// Helper to set configuration
function configure(sourceGlob, options) {
  _sourceGlob = sourceGlob;
  _options = options;
}

// Helper to do a (fast) transpile of a single file
function transpile(name) {
  if (!_options) { 
    console.log('Run `configure` before running `transpile`!');
    return null;
  }
  const dest = name.replace('src/scripts', 'tmp').replace(/\.ts$/, '.js');
  const text = babel.transformFileSync(name, _options);
  utilities.ensureDirectoryExistence(dest);
  fs.writeFileSync(dest, text, 'utf8');
}

// Helper to do a (slow) full transpile with error reporting
function transpileAll(sourceGlob = _sourceGlob, options = _options) {

  // Make a new program with the latest sourceFiles
  glob.sync(sourceGlob).forEach(file => transpile(file));
  console.log('Full transpile done!');
}

// Public API
module.exports = {
  sourceGlob: _sourceGlob,
  options: _options,
  configure: configure,
  transpile: transpile,
  transpileAll: transpileAll
};
