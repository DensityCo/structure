const chalk = require('chalk');
const fs = require('fs-extra');
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
      return fs.copy(_assetsInPath, _assetsOutPath).then(() => {
        return fs.readFile(_indexInFile);
      }).then(contents => {
        return fs.outputFile(_indexOutFile, contents.toString());
      }).then(() => {
        console.log(chalk.gray('Assets ready!'));
      });
    }
  };
}

module.exports = assets;
