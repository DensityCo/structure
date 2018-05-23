const chalk = require('chalk');
const fs = require('fs-extra');
const sass = require('node-sass');

const autoprefixer = require('autoprefixer');
const postcss = require('postcss');


// This API is still "opinionated"
// Main is a filename that points to an entry SCSS
// Regular CSS has no concept of including/entry 
function styles(inFile, inGlob, outFile, options) {
  const _inFile = inFile;
  const _inGlob = inGlob;
  const _outFile = outFile;
  const _options = options || {};


  // "Common" Styles API
  return {
    name: 'SCSS Post-Processor',
    inFile: _inFile,
    inGlob: _inGlob,
    outFile: _outFile,
    options: _options,

    compile: function () {
      return new Promise((resolve, reject) => {
        sass.render({
          file: _inFile,
          includePaths: _options.paths || []
        }, (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      }).then(compiled => {
        return postcss([ autoprefixer ]).process(compiled.css, { from: undefined });
      }).then(prefixed => {
        prefixed.warnings().forEach(warn => {
          console.log(chalk.red(warn.toString()));
        });

        return prefixed.css;
      }).then(css => {
        return fs.writeFile(_outFile, css);
      }).then(() => {
        console.log(chalk.gray('Styles ready!'));
      });
    }
  }
}

module.exports = styles;
