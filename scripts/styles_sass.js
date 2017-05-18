const chalk = require('chalk');
const fs = require('fs');
const sass = require('node-sass');

const autoprefixer = require('autoprefixer');
const postcss = require('postcss');


// This API is still "opinionated"
// Main is a filename that points to an entry SCSS
// Regular CSS has no concept of including/entry 
function styles(inGlob, outFile, options) {
  const _inGlob = inGlob;
  const _outFile = outFile;
  const _options = options || {};


  // "Common" Styles API
  return {

    name: 'SCSS Post-Processor',
    inGlob: _inGlob,
    outFile: _outFile,
    options: _options,

    compile: function () {
      return new Promise((resolve, reject) => {
        const compiled = sass.renderSync({
          file: _inGlob,
          includePaths: _options.paths || []
        });
        postcss([ autoprefixer ]).process(compiled.css).then(function (prefixed) {
          prefixed.warnings().forEach(function (warn) {
            console.log(chalk.red(warn.toString()));
          });
          fs.writeFileSync(_outFile, prefixed.css);
          console.log(chalk.gray('Styles ready!'));
          resolve();
        });
      });
    }
  }
}

module.exports = styles;
