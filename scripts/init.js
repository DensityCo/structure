const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');
const utilities = require('./utilities');

module.exports = function(
  appPath,
  appName,
  verbose,
  originalDirectory,
  template
) {
  console.log(chalk.gray('Update package.json...'));
  const ownPackageName = require(path.join(__dirname, '..', 'package.json')).name;
  const ownPath = path.join(appPath, 'node_modules', ownPackageName);
  const appPackage = require(path.join(appPath, 'package.json'));

  // Copy over some of the devDependencies
  appPackage.dependencies = appPackage.dependencies || {};
  appPackage.devDependencies = appPackage.devDependencies || {};

  // Setup the script rules
  appPackage.scripts = {
    start: 'react-scripts start',
    build: 'react-scripts build',
    test: 'react-scripts test --env=jsdom',
    eject: 'react-scripts eject',
  };

  fs.writeFile(
    path.join(appPath, 'package.json'),
    JSON.stringify(appPackage, null, 2)
  ).then(() => {
    // Copy structure template into the project
    const templateReadStream = fs.createReadStream(path.resolve(__dirname, path.join('..', 'template', 'structure.js')))
    const templateWriteStream = fs.createWriteStream(path.resolve(__dirname, path.join('..', '..', '..', '..', 'structure.js')))
    templateReadStream.on('error', err => console.log("Template copy read stream error:", err))
    templateWriteStream.on('error', err => console.log("Template copy write stream error:", err))
    templateReadStream.pipe(templateWriteStream);

    // Copy template files
    console.log(chalk.gray('Copy template...'));
    const templatePath = template ? path.resolve(originalDirectory, template) : path.join(ownPath, 'template');
    return fs.exists(templatePath).then(exists => {
      if (exists) {
        return fs.copy(templatePath, appPath);
      } else {
        console.error('Could not locate supplied template: ' + chalk.green(templatePath));
        return Promise.resolve();;
      }
    });
  }).then(() => {
    console.log(chalk.gray('Edit init/index.js to add more init tasks!'));
  });
}
