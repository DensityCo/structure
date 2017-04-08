const chalk = require('chalk');
const fs = require('fs');
const sass = require('node-sass');

let _main = null;
let _paths = null;
let _bundle = null;

function configure(main, paths, bundle) {
  _main = main;
  _paths = paths;
  _bundle = bundle;
}

function compile(main = _main, paths = _paths, bundle = _bundle) {
  return new Promise((resolve, reject) => {
    const result = sass.renderSync({
      file: main,
      includePaths: paths
    });
    fs.writeFileSync(bundle, result.css);
    console.log(chalk.gray('Styles ready!'));
    resolve();
  });
}

module.exports = {
  configure: configure,
  compile: compile
};
