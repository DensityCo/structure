const fs = require('fs');
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

// Style sources
options.stylesBundle = './dist/app.css';
options.sourceStylesGlob = './src/styles/**/*.scss';
options.sourceStylesMain = './src/styles/application.scss';
options.sourceStylesPaths = [
  './node_modules/bourbon/app/assets/stylesheets',
  './node_modules/node-reset-scss/scss',
  './node_modules/density-ui/lib'
];

// Script sources and transpiled intermediates
options.scriptsBundle = './dist/app.js';
options.sourceScriptsGlob = './src/scripts/**/*.ts*';
options.tmpScriptsMain = './tmp/main.js';

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
styles.configure(options.sourceStylesMain, options.sourceStylesPaths, options.stylesBundle);

// Set up ts transpiler
transpiler.configure(options.sourceScriptsGlob, options.transpilerOptions);

// Set up webpack bundler
bundler.configure(options.tmpScriptsMain, options.scriptsBundle, options.production, false);


// Run everything
console.log('assets...');
assets.copy();

console.log('styles...');
styles.compile();

console.log('transpile...');
transpiler.transpileAll();

console.log('bundle...');
bundler.bundle(() => {
  if (options.production) {
    console.log('minify...');
    fs.writeFileSync(
      options.scriptsBundle, 
      UglifyJS.minify([options.scriptsBundle], { compress: { dead_code: true } }).code
    );
  }
  console.log('Done!');
});

