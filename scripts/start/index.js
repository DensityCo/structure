const chokidar = require('chokidar');
const liveServer = require('live-server');

const assets = require('../assets');
const styles = require('../styles');
const transpiler = require('../transpiler_typescript');
const bundler = require('../bundler_webpack');


// "Lean mode" argument
const fullDebugging = 
  process.argv.length < 3 ||
  process.argv.slice(2).indexOf('lean') < 0;


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
  sourceMap: fullDebugging,
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
bundler.configure(tmpScriptsMain, scriptsBundle, false, fullDebugging);


// BUILD AND START WATCHING
// ...

// Copy static content
assets.copy();

// First-run styles
styles.compile();

// Watcher for all style source files
const styleWatch = chokidar.watch(sourceStylesGlob, {
  persistent: true,
  ignoreInitial: true
}).on('all', (event, fileName) => {

  // // DEBUG: log out all fs events
  // console.log(event, fileName);

  // Ignore vim swap files
  if (fileName.endsWith(".swp") || fileName.endsWith(".swo")) {
    return;
  }

  // Re-compile
  if (event === 'add' || event === 'change' || event === 'unlink') {
    styles.compile();
    liveServer.change(fileName);
  }
});

// First-run transpile and bundle
transpiler.transpileAll();
bundler.bundle(() => liveServer.change(scriptsBundle));

// Watcher for all .ts and .tsx files
const scriptWatch = chokidar.watch(sourceScriptsGlob, { 
  persistent: true,
  ignoreInitial: true
}).on('all', (event, fileName) => {

  // // DEBUG: log out all fs events
  // console.log(event, fileName);

  // Ignore vim swap files
  if (fileName.endsWith(".swp") || fileName.endsWith(".swo")) {
    return;
  }

  // Quick-transpile file on 'add' or 'change'
  if (event === 'add' || event === 'change') {
    transpiler.transpile(fileName);
  }

  // Re-bundle on every change, then optionally typecheck and generate sourcemap
  if (event === 'add' || event === 'change' || event === 'unlink') {
    bundler.bundle(() => {
      liveServer.change(scriptsBundle);
      if (fullDebugging) { 
        setTimeout(transpiler.transpileAll, 1000); 
      }
    });
  }
});


// LIVE SERVER
// ...

var params = {
	port: 8080,
	host: "0.0.0.0",
	root: "./dist",
	file: "index.html",
	mount: [['/node_modules', './node_modules']],
  open: true,
	wait: 0,
	logLevel: 2,
};

// Start monkey-patched live server
// TODO: explain this
liveServer.start(params);
liveServer.change = liveServer.watcher.listeners('change')[0];
liveServer.watcher.removeAllListeners();
