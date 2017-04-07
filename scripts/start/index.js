const fs = require('fs');
const chokidar = require('chokidar');
const liveServer = require('live-server');

const assets = require('../assets');
const styles = require('../styles');
const transpiler = require('../transpiler_typescript');
const bundler = require('../bundler_webpack');


// Options
const options = {};

// "mode" argument and map to various settings (maybe unnecessary abstraction)
const modeTaskMap = {
  full: { bundleMap: true, transpileMap: true, transpileAll: true },
  bundle: { bundleMap: true },
  transpile: { transpileAll: true },
  lean: {}
};
options.mode = (process.argv.length > 2 && process.argv.slice(2)) || 'full';
options.modeTasks = modeTaskMap[options.mode] || {};

// Default style sources
options.stylesBundle = './dist/app.css';
options.sourceStylesGlob = './src/styles/**/*.scss';
options.sourceStylesMain = './src/styles/main.scss';
options.sourceStylesPaths = [
  './node_modules/bourbon/app/assets/stylesheets',
  './node_modules/node-reset-scss/scss',
  './node_modules/density-ui/lib'
];

// Default script sources and transpiled intermediates
options.scriptsBundle = './dist/app.js';
options.sourceScriptsGlob = './src/scripts/**/*.ts*';
options.tmpScriptsMain = './tmp/main.js';

// Default TypeScript compiler options
options.transpilerOptions = {
  allowSyntheticDefaultImports: true,
  alwaysStrict: true,
  jsx: 2, // ENUM: JsxEmit.React, CLI: react
  sourceMap: options.modeTasks.transpileMap,
  module: 1, // ENUM: ModuleKind.CommonJS, CLI: commonjs
  target: 1, // ENUM: ScriptTarget.ES5, CLI: es5
  moduleResolution: 2, // ENUM: ModuleResolutionKind.NodeJs, CLI: node
  outDir: './tmp'
}

// Overwrite defaults with options from config file ᕕ(ᐛ)ᕗ
if (fs.existsSync('./build.json')) {
  Object.assign(options, JSON.parse(fs.readFileSync('./build.json').toString()));
}

// Pending callbacks
let stylesPromise = null;
let scriptsPromise = null;
let scriptsPending = 0;
let stylesPending = 0;

// Helper to filter out hidden/tmp files
function exclude(fileName, extensions = ['.swp', '.swo']) {
  return extensions.reduce((a, n) => fileName.endsWith(n) || a, false);
}

// Helper to update styles
function updateStyles(event, fileName) {
  return new Promise((resolve, reject) => {
    if (event === 'add' || event === 'change' || event === 'unlink') {
      styles.compile();
      liveServer.change(fileName);
      stylesPending--;
      resolve('Styles done!');
    }
  });
}

// Helper to update the scripts bundle
function updateScripts(event, fileName) {
  return new Promise((resolve, reject) => {

    // Quick-transpile file on 'add' or 'change'
    if (event === 'add' || event === 'change') {
      transpiler.transpile(fileName);
    }

    // Re-bundle on every change, then optionally typecheck and generate sourcemap
    if (event === 'add' || event === 'change' || event === 'unlink') {
      bundler.bundle(() => {
        liveServer.change(options.scriptsBundle);
        if (options.modeTasks.transpileAll) { 
          setTimeout(function () {
            transpiler.transpileAll();       
            scriptsPending--;
            resolve('Scripts done!');
          }, 1000); 
        } else {     
          scriptsPending--;
          resolve('Scripts done!');
        }
      });
    }
  });
}

// Helper to start live-server
function startLiveServer () {

  // Configure live-server
  const params = {
    port: 8080,
    host: "0.0.0.0",
    root: "./dist",
    file: "index.html",
    mount: [['/node_modules', './node_modules']],
    open: true,
    wait: 0,
    logLevel: 2
  };

  // Start monkey-patched live-server.
  // We remove the listeners so it doesn't watch any files.
  // And add a "change" helper so we can manually run the change listener. 
  liveServer.start(params);
  liveServer.change = liveServer.watcher.listeners('change')[0];
  liveServer.watcher.removeAllListeners();
}

// Set up style compiler
styles.configure(
  options.sourceStylesMain,
  options.sourceStylesPaths,
  options.stylesBundle
);

// Set up ts transpiler
transpiler.configure(
  options.sourceScriptsGlob,
  options.transpilerOptions
);

// Set up webpack bundler
bundler.configure(
  options.tmpScriptsMain,
  options.scriptsBundle,
  false,
  options.modeTasks.bundleMap
);


// BUILD AND START WATCHING
// ...

// Copy static content
assets.copy();

// First-run styles
styles.compile();

// Watcher for all style source files
const styleWatch = chokidar.watch(options.sourceStylesGlob, {
  persistent: true,
  ignoreInitial: true
}).on('all', (event, fileName) => {

  // Ignore files
  if (exclude(fileName)) { return; }

  // Run update or queue it up
  if (stylesPending > 0 && stylesPending < 2) {
    stylesPromise = stylesPromise.then(updateStyles.bind(null, event, fileName));
    stylesPending++;
  } else if (stylesPending <= 0) {
    stylesPromise = updateStyles(event, fileName);
    stylesPending = 1;
  }
});

// First-run transpile and bundle
transpiler.transpileAll();
bundler.bundle(startLiveServer);

// Watcher for all .ts and .tsx files
const scriptWatch = chokidar.watch(options.sourceScriptsGlob, { 
  persistent: true,
  ignoreInitial: true
}).on('all', (event, fileName) => {

  // Ignore files
  if (exclude(fileName)) { return; }

  // Run update or queue it up 
  if (scriptsPending > 0 && scriptsPending < 2) {
    scriptsPromise = scriptsPromise.then(updateScripts.bind(null, event, fileName));
    scriptsPending++;
  } else if (scriptsPending <= 0) {
    scriptsPromise = updateScripts(event, fileName);
    scriptsPending = 1;
  }
});
