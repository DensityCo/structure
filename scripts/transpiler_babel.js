const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const glob = require('glob');
const babel = require('babel-core');
const utilities = require('./utilities');

// Helper to set configuration
function transpiler(inGlob, outPath, options) {
  const _inGlob = inGlob;
  const _outPath = outPath;
  const _options = options || {};


  // Common Transpiler API
  return  {

    name: 'Babel Transpiler',
    inGlob: _inGlob,
    outPath: _outPath,
    options: _options,

    // Helper to do a (fast) transpile of a single file
    transpile: function (name) {
      return new Promise((resolve, reject) => {
        const dest = _outPath + path.basename(name).replace(/\.ts$/, '.js');
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
    },

    // Helper to do a (slow) full transpile
    transpileAll: function () {
      return Promise.all(glob.sync(_inGlob)
        .map(file => transpile(file)))
        .then(results => {
          console.log(chalk.gray('Full transpile done!'));
        });
    }
  }
}

module.exports = transpiler;
