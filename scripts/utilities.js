const fs = require('fsp');
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
function copyRecursive(src, dest) {
  return fs.existsP(src).then(exists => {
    if (exists) {
      return fs.statP(src).then(stats => {
        if (stats.isDirectory()) {
          // Is a directory:
          // 1. If the destination doesn't exist, then create it.
          // 2. Get all things in the directory. Copy them one by one recursively themselves.
          return fs.existsP(dest).then(exists => {
            if (exists) {
              return fs.mkdir(dest);
            } else {
              return Promise.resolve();
            }
          }).then(() => {
            return fs.readdirP(src);
          }).then(dirContent => {
            const all = dirContent.map(childItemName => {
              return copyRecursive(
                path.join(src, childItemName),
                path.join(dest, childItemName)
              );
            });
            return Promise.all(all);
          });
        } else {
          // Is a file. Make a new hard link to the file at `src`, effectively copying it.
          return fs.existsP(dest).then(exists => {
            if (!exists) {
              return fs.linkP(src, dest);
            }
          });
        }
      });
    }
  });
};

/**
 * Helper to make necessary directory structure for a file.
 * @param {string} name The path to the file.
 */
function ensureDirectoryExistence(name) {
  const dirname = path.dirname(name);
  return fs.existsP(dirname).then(exists => {
    if (exists) {
      return true;
    } else {
      return ensureDirectoryExistence(dirname).then(() => {
        return fs.mkdirP(dirname);
      });
    }
  });
}

// Public API
module.exports = {
  flattenSourceMap,
  copyRecursive,
  ensureDirectoryExistence,
};
