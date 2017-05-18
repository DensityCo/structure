const fs = require('fs');
const chokidar = require('chokidar');
const liveServer = require('live-server');

function start(options) {

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
        pending = options.transpiler.transpile(fileName).then(options.bundler.bundle);
      } else if (event === 'unlink') {
        pending = options.bundler.bundle();
      }

      // Re-bundle on every change, then optionally typecheck and generate sourcemap
      if (pending) {

        // Update live server last
        pending.then(() => {
          liveServer.change(options.bundler.outFile);
          scriptsPending--;
          resolve();
        });

        // Queue a full transpile if we're doing type checking
        pending.then(setTimeout.bind(null, options.transpiler.transpileAll, 1000));
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
      const params = {
        port: 8080,
        host: "0.0.0.0",
        root: "./dist",
        file: "index.html",
        mount: [
          ['/node_modules', process.env.STRUCT_NODE_MODULES || './node_modules'],
          ['/src', process.env.STRUCT_SRC_FOLDER || './src'],
          ['/tmp', process.env.STRUCT_TMP_FOLDER || './tmp']
        ],
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
      resolve();
    });
  }


  // BUILD AND START WATCHING
  // ...

  // Run build first
  assets.copy()
    .then(() => options.styles.compile())
    .then(() => options.transpiler.transpileAll())
    .then(() => options.bundler.bundle())
    .then(() => startLiveServer())
    .then(() => {

      // Watcher for all style source files
      const styleWatch = chokidar.watch(options.stylesGlob, {
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

      // Watcher for all .ts and .tsx files
      const scriptWatch = chokidar.watch(options.scriptsGlob, { 
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

    });
}

module.exports = start;
