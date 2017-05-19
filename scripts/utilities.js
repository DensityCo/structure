const fs = require('fs');
const path = require('path');
const sorcery = require('sorcery');

// Flatten source maps, applying any middleware to preprocess weird URLs
function flattenSourceMap(bundle, urlMiddleware = null) {
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
    resolve();
  })
}

/**
 * StackOverflow: http://stackoverflow.com/a/22185855
 * Look ma, it's cp -R.
 * Does not overwrite files at the destination.
 * @param {string} src The path to the thing to copy.
 * @param {string} dest The path to the new copy.
 */
function copyRecursiveSync(src, dest) {
  var exists = fs.existsSync(src);
  if (exists) {
    var stats = fs.statSync(src);
    if (stats.isDirectory()) {
      !fs.existsSync(dest) && fs.mkdirSync(dest);
      fs.readdirSync(src).forEach(function(childItemName) {
        copyRecursiveSync(path.join(src, childItemName),
                          path.join(dest, childItemName));
      });
    } else {
      !fs.existsSync(dest) && fs.linkSync(src, dest);
    }
  }
};

/**
 * Helper to make necessary directory structure for a file.
 * @param {string} name The path to the file.
 */
function ensureDirectoryExistence(name) {
  const dirname = path.dirname(name);
  if (fs.existsSync(dirname)) { return true; }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
}

// Public API
module.exports = {
  flattenSourceMap: flattenSourceMap,
  copyRecursiveSync: copyRecursiveSync,
  ensureDirectoryExistence: ensureDirectoryExistence
};
