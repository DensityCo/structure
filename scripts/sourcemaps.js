const fs = require('fs');
const sorcery = require('sorcery');

// HACK: make tmp sourcemaps webpack-protocol-crap-compatible
function flatten(bundle, urlMiddleware = null) {
  const mapName = `${bundle}.map`;

  // Default middleware setup
  if (!urlMiddleware) { urlMiddleware = url => url; }

  // Run sorcery to flatten maps
  const chain = sorcery.loadSync(bundle, {
    urlMiddleware: urlMiddleware
  });

  // Write out flattened source map
  let map = chain.apply().toString();
  fs.writeFileSync(mapName, map);
  console.log('Sourcemaps ready!');
}

// Public API
module.exports = {
  flatten: flatten
};
