const fs = require('fs');
const chalk = require('chalk');
const UglifyJS = require('uglify-js');

function build(options) {

  // Extract options
  const { assets, styles, transpiler, bundler } = options;

  // Run everything in sequence
  console.log(chalk.green('Copy Assets...'));
  assets.copy()
    .then(() => console.log(chalk.green('Compile Styles...')))
    .then(() => styles.compile())
    .then(() => console.log(chalk.green('Transpile Scripts...')))
    .then(() => transpiler.transpileAll())
    .then(() => console.log(chalk.green('Bundle Scripts...')))
    .then(() => bundler.bundle())
    .then(() => {
      if (bundler.options.production) {
        console.log(chalk.green('Minify Scripts...'));
        fs.writeFileSync(
          bundler.outFile, 
          UglifyJS.minify([bundler.outFile], { compress: { dead_code: true } }).code
        );
      }
      console.log(chalk.green('Done!'));
    });
}

module.exports = build;
