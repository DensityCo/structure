const fs = require('fs');
const path = require('path');

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
  copyRecursiveSync: copyRecursiveSync,
  ensureDirectoryExistence: ensureDirectoryExistence
};
