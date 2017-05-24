const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const liveServer = require('live-server');

function start(options) {

  // Extract options
  let { assets, styles, transpiler, bundler, serverOptions } = options;

  // Default values for modules and server options
  assets = assets || { copy: () => Promise.resolve() }
  styles = styles || { compile: () => Promise.resolve() }
  transpiler = transpiler || { transpileAll: () => Promise.resolve() }
  bundler = bundler || { bundle: () => Promise.resolve() }
  serverOptions = serverOptions || {};

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
        styles.compile().then(() => {
          liveServer.change(fileName);
          stylesPending--;
          resolve();
        });;
      }
    }).catch(err => {
      console.log(chalk.red('ERROR: ' + err));
      stylesPending--;
      resolve();
    });
  }

  // Helper to update the scripts bundle
  function updateScripts(event, fileName) {
    return new Promise((resolve, reject) => {
      let pending = null;

      // Quick-transpile file on 'add' or 'change'
      if (event === 'add' || event === 'change') {
        pending = transpiler.transpile(fileName).then(bundler.bundle);
      } else if (event === 'unlink') {
        pending = bundler.bundle();
      }

      // Re-bundle on every change, then optionally typecheck and generate sourcemap
      if (pending) {

        // Update live server last
        pending.then(() => {
          liveServer.change(bundler.outFile || assets.indexOutFile);
          scriptsPending--;
          resolve();
        });

        // Queue a full transpile if we're doing type checking
        pending.then(setTimeout.bind(null, transpiler.transpileAll, 1000));
      } else {
        resolve();
      }

    }).catch(err => {
      console.log(chalk.red('ERROR: ' + err));
      scriptsPending--;
      resolve();
    });
  }

  // Helper to start live-server
  function startLiveServer () {
    return new Promise((resolve, reject) => {

      // Configure live-server
      const params = Object.assign({
        port: 8080,
        host: "0.0.0.0",
        root: "./dist",
        file: "index.html",
        open: true,
        wait: 50,
        logLevel: 2
      }, serverOptions);

      // Start monkey-patched live-server.
      // We remove the listeners so it doesn't watch any files.
      // And add a "change" helper so we can manually run the change listener. 
      liveServer.start(params);
      liveServer.change = liveServer.watcher.listeners('change')[0];
      liveServer.watcher.removeAllListeners();
      resolve();
    });
  }


  // BUILD AND START WATCHING
  // ...

  // Run build first
  assets.copy()
    .then(() => styles.compile())
    .then(() => transpiler.transpileAll())
    .then(() => bundler.bundle())
    .then(() => startLiveServer())
    .then(() => {

      // Watcher for all style source files
      if (styles.inGlob) {
        chokidar.watch(styles.inGlob, {
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
        })
      };

      // Watcher for all .ts and .tsx files
      if (transpiler.inGlob || bundler.inFile) {
        chokidar.watch(transpiler.inGlob || path.dirname(bundler.inFile), { 
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
      }
    });
}

module.exports = start;
