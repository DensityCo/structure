const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const utilities = require('./utilities');

function assets(indexInFile, indexOutFile, assetsInPath, assetsOutPath) {
  const _indexInFile = indexInFile;
  const _indexOutFile = indexOutFile;
  const _assetsInPath = assetsInPath;
  const _assetsOutPath = assetsOutPath;

  return {

    name: 'Assets Copier',
    inFile: _inFile,
    outFile: _outFile,
    options: _options,

    copy: function () {
      return new Promise((resolve, reject) => {
        utilities.copyRecursiveSync(_assetsInPath, _assetsOutPath);
        utilities.ensureDirectoryExistence(_indexOutFile);
        fs.writeFileSync(_indexOutFile, fs.readFileSync(_indexInFile));
        console.log(chalk.gray('Assets ready!'));
        resolve();
      });
    }
  };
}

module.exports = assets;
