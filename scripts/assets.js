const chalk = require('chalk');
const copy = require('recursive-copy');

function assets(inPath, outPath, filter) {
  const _inPath = inPath;
  const _outPath = outPath;

  return {
    name: 'Assets Copier',
    inPath: _inPath,
    outPath: _outPath,

    copy: function () {
      return copy(_inPath, _outPath, {
        overwrite: true,
        filter: filter || function (name) {
          return !name.endsWith('.css') && !name.endsWith('.js');
        }
      }).then(() => {
        console.log(chalk.gray('Assets ready!'));
      });
    }
  };
}

module.exports = assets;
