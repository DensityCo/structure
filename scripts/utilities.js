const fs = require('fs-extra');
const path = require('path');
const sorcery = require('sorcery');

// Flatten source maps, applying any middleware to preprocess weird URLs
function flattenSourceMap(bundle, urlMiddleware = null) {
  const mapName = `${bundle}.map`;
  const origName = `${bundle}.map.orig`;

  // Reset from "backup" of last cached sourcemap
  return fs.exists(origName).then(exists => {
    if (exists) {
      return fs.readFile(mapName);
    }
  }).then(data => {
    return fs.writeFile(origName, data.toString());
  }).then(() => {
    // Default middleware setup
    if (!urlMiddleware) {
      urlMiddleware = url => url;
    }

    // Run sorcery to flatten maps
    return sorcery.load(bundle, {urlMiddleware});
  }).then(chain => {
    // Write out flattened source map
    const map = chain.apply().toString();
    return fs.writeFile(mapName, map);
  });
}

/**
 * StackOverflow: http://stackoverflow.com/a/22185855
 * Look ma, it's cp -R.
 * Does not overwrite files at the destination.
 * @param {string} src The path to the thing to copy.
 * @param {string} dest The path to the new copy.
 */
function copyRecursive(src, dest) {
  return fs.exists(src).then(exists => {
    if (exists) {
      return fs.stat(src).then(stats => {
        if (stats.isDirectory()) {
          // Is a directory:
          // 1. If the destination doesn't exist, then create it.
          // 2. Get all things in the directory. Copy them one by one recursively themselves.
          return fs.exists(dest).then(exists => {
            if (exists) {
              return fs.mkdirp(dest);
            } else {
              return Promise.resolve();
            }
          }).then(() => {
            return fs.readdir(src);
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
          return fs.exists(dest).then(exists => {
            if (!exists) {
              return fs.mkdirp(dest).then(() => fs.link(src, dest));
            }
          });
        }
      });
    }
  });
};

// Public API
module.exports = {
  flattenSourceMap,
  copyRecursive,
};
