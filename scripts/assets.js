const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const utilities = require('./utilities');

function copy(
  paths = ['./src/assets'],
  index = null,
  dest = './dist'
) {
  return new Promise((resolve, reject) => {
    const indexPath = `${dest}/index.html`;
    utilities.ensureDirectoryExistence(indexPath);
    if (typeof(index) === String) { index = fs.readFileSync(index); }
    fs.writeFileSync(indexPath, index || `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <title>App</title>
      <meta name="description" content="">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <link href="https://fonts.googleapis.com/css?family=Roboto" rel="stylesheet">
      <link rel="stylesheet" href="/app.css">
    </head>
    <body>
      <div id="react-mount"></div>
      <script src="/app.js"></script>
    </body>
  </html>`);

    paths.forEach((path) => utilities.copyRecursiveSync(path, `${dest}/assets`));
    console.log(chalk.gray('Assets ready!'));
    resolve();
  });
}

module.exports = {
  copy: copy
};
