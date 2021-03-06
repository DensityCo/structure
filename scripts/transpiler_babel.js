const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const glob = require('glob');
const babel = require('babel-core');
const utilities = require('./utilities');

// Helper to set configuration
function transpiler(inFile, inGlob, outPath, options) {
  const _inFile = inFile;
  const _inGlob = inGlob;
  const _outPath = outPath;
  const _options = options || {};


  // Common Transpiler API
  return  {
    name: 'Babel Transpiler',
    inFile: _inFile,
    inGlob: _inGlob,
    outPath: _outPath,
    options: _options,

    // Helper to do a (fast) transpile of a single file
    transpile: function(name) {
      const dest = _outPath + path.basename(name).replace(/\.ts$/, '.js');
      return new Promise((resolve, reject) => {
        babel.transformFile(name, _options, (err, result) => {
          if (err) { 
            console.log(chalk.red(`Transpile ${name} skipped!`));
            reject();
          } else {
            resolve(result);
          }
        });
      }).then(result => {
        return fs.outputFile(dest, text, 'utf8');
      }).then(() => {
        console.log(chalk.gray(`Transpile ${name} done!`));
      });
    },

    // Helper to do a (slow) full transpile
    transpileAll: function() {
      return Promise.all(glob.sync(_inGlob).map(transpile))
        .then(results => {
          console.log(chalk.gray('Full transpile done!'));
        });
    }
  }
}

module.exports = transpiler;
