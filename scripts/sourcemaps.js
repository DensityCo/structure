const chalk = require('chalk');
const fs = require('fs');
const sorcery = require('sorcery');

// HACK: make tmp sourcemaps webpack-protocol-crap-compatible
function flatten(bundle, urlMiddleware = null) {
  return new Promise((resolve, reject) => {
    const mapName = `${bundle}.map`;
    const origName = `${bundle}.map.orig`;

    // Reset from "backup" of last cached sourcemap
    if (fs.existsSync(origName)) {
      fs.writeFileSync(mapName, fs.readFileSync(origName))
    }

    // Default middleware setup
    if (!urlMiddleware) { urlMiddleware = url => url; }

    // Run sorcery to flatten maps
    const chain = sorcery.loadSync(bundle, {
      urlMiddleware: urlMiddleware
    });

    // Write out flattened source map
    let map = chain.apply().toString();
    fs.writeFileSync(mapName, map);
    console.log(chalk.gray('Sourcemaps ready!'));
    resolve();
  })
}

// Public API
module.exports = {
  flatten: flatten
};
