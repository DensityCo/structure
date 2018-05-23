// This template script can be used to start or build:
// `node index.js start`
// `node index.js build`

// Structure dependency
const structure = require('@density/structure');

// Task argument
const task = process.argv.length > 2 ? process.argv[2] : 'start';

// Set up assets copyier thingamajig
const assets = structure.assets('./src', './build');

// Set up styles
const styles = structure.sass(
  './src/index.css',
  './src/**/*.css',
  './build/app.css',
  {
    paths: [
      // TODO: remove these density-ui specific paths
      './node_modules/bourbon/app/assets/stylesheets',
      './node_modules/node-reset-scss/scss',
      './node_modules/density-ui/lib',

      // for nicss
      './styles',
    ]
  }
);

// Set up transpiler
const transpiler = structure.typescript(
  './src/**/*.js',
  './tmp',
  {
    allowSyntheticDefaultImports: true,
    alwaysStrict: true,
    jsx: 2, // ENUM: JsxEmit.React, CLI: react
    sourceMap: task === 'start',
    module: 1, // ENUM: ModuleKind.CommonJS, CLI: commonjs
    target: 1, // ENUM: ScriptTarget.ES5, CLI: es5
    moduleResolution: 2, // ENUM: ModuleResolutionKind.NodeJs, CLI: node
  }
);

// Set up bundler
const bundler = structure.webpack(
  './tmp/index.js',
  './build/app.js',
  {
    sourceMap: task === 'start',
    production: task === 'build'
  }
);

// Run the correct task!
if (task === 'build') {
  structure.build({
    assets: assets,
    styles: styles,
    transpiler: transpiler,
    bundler: bundler
  });
} else if (task === 'start' || task === 'lean') {
  structure.start({
    assets: assets,
    styles: styles,
    transpiler: transpiler,
    bundler: bundler,
    serverOptions: {
      root: './build',
      file: 'index.html',
      mount: [
        ['/node_modules', './node_modules'],
        ['/src', './src'],
        ['/tmp', './tmp']
      ]
    }
  });
} else {
  throw new Error('Unrecognized task!');
}
