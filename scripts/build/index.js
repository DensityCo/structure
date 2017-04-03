const fs = require('fs');
const UglifyJS = require('uglify-js');

const assets = require('../assets');
const styles = require('../styles');
const transpiler = require('../transpiler_typescript');
const bundler = require('../bundler_webpack');


// "dev" argument
const production = 
  process.argv.length < 3 ||
  process.argv.slice(2).indexOf('dev') < 0;


// Style sources
const stylesBundle = './dist/app.css';
const sourceStylesGlob = './src/styles/**/*.scss';
const sourceStylesMain = './src/styles/application.scss';
const sourceStylesPaths = [
  './node_modules/bourbon/app/assets/stylesheets',
  './node_modules/node-reset-scss/scss',
  './node_modules/density-ui/lib'
];

// Script sources and transpiled intermediates
const scriptsBundle = './dist/app.js';
const sourceScriptsGlob = './src/scripts/**/*.ts*';
const tmpScriptsMain = './tmp/main.js';

// TypeScript compiler options
const transpilerOptions = {
  allowSyntheticDefaultImports: true,
  alwaysStrict: true,
  jsx: 2, // ENUM: JsxEmit.React, CLI: react
  sourceMap: !production,
  module: 1, // ENUM: ModuleKind.CommonJS, CLI: commonjs
  target: 1, // ENUM: ScriptTarget.ES5, CLI: es5
  moduleResolution: 2, // ENUM: ModuleResolutionKind.NodeJs, CLI: node
  outDir: './tmp'
}

// Set up style compiler
styles.configure(sourceStylesMain, sourceStylesPaths, stylesBundle);

// Set up ts transpiler
transpiler.configure(sourceScriptsGlob, transpilerOptions);

// Set up webpack bundler
bundler.configure(tmpScriptsMain, scriptsBundle, production, false);


// Run everything
console.log('assets...');
assets.copy();

console.log('styles...');
styles.compile();

console.log('transpile...');
transpiler.transpileAll();

console.log('bundle...');
bundler.bundle(() => {
  if (production) {
    console.log('minify...');
    fs.writeFileSync(
      scriptsBundle, 
      UglifyJS.minify([scriptsBundle], { compress: { dead_code: true } }).code
    );
  }
  console.log('Done!');
});

