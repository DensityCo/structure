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
    indexInFile: _indexInFile,
    indexOutFile: _indexOutFile,
    assetsInPath: _assetsInPath,
    assetsOutPath: _assetsOutPath,

    copy: function () {
      return new Promise((resolve, reject) => {
        utilities.ensureDirectoryExistence(_indexOutFile);
        fs.writeFileSync(_indexOutFile, fs.readFileSync(_indexInFile));

        utilities.ensureDirectoryExistence(`${_assetsOutPath}/file.txt`);
        utilities.copyRecursiveSync(_assetsInPath, _assetsOutPath);

        console.log(chalk.gray('Assets ready!'));
        resolve();
      });
    }
  };
}

module.exports = assets;
