const fs = require('fs');
const chalk = require('chalk');
const UglifyJS = require('uglify-js');

const assets = require('../assets');
const styles = require('../styles');
const transpiler = require('../transpiler_typescript');
const bundler = require('../bundler_webpack');


// Options
const options = {};

// "dev" argument
options.production = 
  process.argv.length < 3 ||
  process.argv.slice(2).indexOf('dev') < 0;

// Default style sources
options.stylesDest = process.env.STRUCT_STYLES_DEST || './dist/app.css';
options.stylesEntry = process.env.STRUCT_STYLES_ENTRY || './src/styles/main.scss';
options.stylesGlob = process.env.STRUCT_STYLES_GLOB || './src/styles/**/*.scss';
options.stylesPaths = (
  process.env.STRUCT_STYLES_PATHS && 
  process.env.STRUCT_STYLES_PATHS.split(',')
) || [
  './node_modules/bourbon/app/assets/stylesheets',
  './node_modules/node-reset-scss/scss',
  './node_modules/density-ui/lib'
];

// Default script sources and transpiled intermediates
options.scriptsDest = process.env.STRUCT_SCRIPTS_DEST || './dist/app.js';
options.scriptsEntry = process.env.STRUCT_SCRIPTS_ENTRY || './tmp/main.js';
options.scriptsGlob = process.env.STRUCT_SCRIPTS_GLOB || './src/scripts/**/*.ts*';

// TypeScript compiler options
options.transpilerOptions = {
  allowSyntheticDefaultImports: true,
  alwaysStrict: true,
  jsx: 2, // ENUM: JsxEmit.React, CLI: react
  sourceMap: !options.production,
  module: 1, // ENUM: ModuleKind.CommonJS, CLI: commonjs
  target: 1, // ENUM: ScriptTarget.ES5, CLI: es5
  moduleResolution: 2, // ENUM: ModuleResolutionKind.NodeJs, CLI: node
  outDir: './tmp'
}

// Overwrite defaults with options from config file ᕕ(ᐛ)ᕗ
if (fs.existsSync('./build.json')) {
  Object.assign(options, JSON.parse(fs.readFileSync('./build.json').toString()));
}

// Set up style compiler
styles.configure(options.stylesEntry, options.stylesPaths, options.stylesDest);

// Set up ts transpiler
transpiler.configure(options.scriptsGlob, options.transpilerOptions);

// Set up webpack bundler
bundler.configure(options.scriptsEntry, options.scriptsDest, options.production, false);


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
    if (options.production) {
      console.log(chalk.green('Minify Scripts...'));
      fs.writeFileSync(
        options.scriptsDest, 
        UglifyJS.minify([options.scriptsDest], { compress: { dead_code: true } }).code
      );
    }
    console.log(chalk.green('Done!'));
  });
