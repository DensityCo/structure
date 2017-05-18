// Structure file
const structure = require('@density/structure');

// Set up assets copyier thingamajig
const assets = structure.assets(
  './src/index.html',
  './dist/index.html',
  './src/assets',
  './dist/assets'
);

// Set up styles
const styles = structure.sass(
  './src/styles/main.scss',
  './dist/app.css',
  {
    paths: [
      './node_modules/bourbon/app/assets/stylesheets',
      './node_modules/node-reset-scss/scss',
      './node_modules/density-ui/lib',
    ]
  }
);

// Set up transpiler
const transpiler = structure.typescript(
  './src/scripts/**/*.ts*',
  './tmp',
  {
    allowSyntheticDefaultImports: true,
    alwaysStrict: true,
    jsx: 2, // ENUM: JsxEmit.React, CLI: react
    sourceMap: true,
    module: 1, // ENUM: ModuleKind.CommonJS, CLI: commonjs
    target: 1, // ENUM: ScriptTarget.ES5, CLI: es5
    moduleResolution: 2, // ENUM: ModuleResolutionKind.NodeJs, CLI: node
  }
);

// Set up bundler
const bundler = structure.webpack(
  './tmp/main.js',
  './dist/app.js',
  {
    sourceMaps: true,
    production: false,
  }
);

// Run the "start" function!
structure.start({
  assets: assets,
  styles: styles,
  transpiler: transpiler,
  bundler: bundler,
});
