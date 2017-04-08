const chalk = require('chalk');
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
  return new Promise((resolve, reject) => {
    if (!_options) { 
      console.log(chalk.red('Run `configure` before running `transpile`!'));
      return null;
    }
    const dest = name.replace('src/scripts', 'tmp').replace(/\.ts$/, '.js');
    babel.transformFile(name, _options, (err, result) => {
      if (err) { 
        console.log(chalk.red(`Transpile ${name} skipped!`));
        reject();
      } else {
        utilities.ensureDirectoryExistence(dest);
        fs.writeFileSync(dest, text, 'utf8');
        console.log(chalk.gray(`Transpile ${name} done!`));
        resolve();
      }
    });
  });
}

// Helper to do a (slow) full transpile with error reporting
function transpileAll(sourceGlob = _sourceGlob, options = _options) {

  // Make a new program with the latest sourceFiles
  return Promise.all(glob.sync(sourceGlob).map(file => transpile(file))).then(results => {
    console.log(chalk.gray('Full transpile done!'));
  });
}

// Public API
module.exports = {
  sourceGlob: _sourceGlob,
  options: _options,
  configure: configure,
  transpile: transpile,
  transpileAll: transpileAll
};
