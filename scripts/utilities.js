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

// Public API
module.exports = {
  flattenSourceMap,
};
