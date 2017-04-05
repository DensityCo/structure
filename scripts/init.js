const chalk = require('chalk');
const fs = require('fs');
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

  fs.writeFileSync(
    path.join(appPath, 'package.json'),
    JSON.stringify(appPackage, null, 2)
  );

  // Copy template files
  console.log(chalk.gray('Copy template...'));
  var templatePath = template ? path.resolve(originalDirectory, template) : path.join(ownPath, 'template');
  if (fs.existsSync(templatePath)) {
    utilities.copyRecursiveSync(templatePath, appPath);
  } else {
    console.error('Could not locate supplied template: ' + chalk.green(templatePath));
    return;
  }

  console.log(chalk.gray('Edit init/index.js to add more init tasks!'));
}
