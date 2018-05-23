const chalk = require('chalk');
const fs = require('fs-extra');
const glob = require('glob');
const path = require('path');
const utilities = require('./utilities');

function assets(inGlob, outPath) {
  const _inGlob = inGlob;
  const _outPath = outPath;

  return {
    name: 'Assets Copier',
    inGlob: _inGlob,
    outPath: _outPath,

    copy: function () {
      return Promise.all(glob.sync(_inGlob).map(function (name) {
        const dest = _outPath + path.basename(name);
        return fs.copy(name, dest);
      })).then(() => {
        console.log(chalk.gray('Assets ready!'));
      });
    }
  };
}

module.exports = assets;
