# Structure

[![Dependency Status](https://david-dm.org/densityco/structure.svg)](https://david-dm.org/densityco/structure)
[![Package Version](https://img.shields.io/npm/v/@density/structure.svg)](https://npmjs.com/@density/structure)
![License](https://img.shields.io/badge/License-MIT-green.svg)

Structure is a modular build system for frontend projects. It's built to be flexible, transparent, and to supress
lock-in to any one technology (we're looking at you, Webpack). There is out of the box support for a
number of transpilers ([typescript](https://www.typescriptlang.org/), [babel](https://babeljs.io)),
a number of bundlers ([webpack](https://webpack.github.io/), [browserify](http://browserify.org/)),
and a css post-processor ([sass](https://sass-lang.com)).

## Why not use Webpack to do all of this?
- **Flexibility.** Configuring Webpack to support a custom stack can be clunky and complex.
- **Transparency.** When you buy into the "webpack way", you end up using tons of plugins that are
  really opaque. Because you don't really know what transforms your code goes through, it's hard to
  optimise your bundle easily.
- **Troubleshootability.** Due to the above, it's difficult to develop and troubleshoot the development server.

## Getting Started

Structure can be installed on its own, or with [create-react-app](https://github.com/facebookincubator/create-react-app/).

### create-react-app

For new React applications, structure can be configured as the `react-scripts` package (does not include a testing framework): 

    create-react-app --scripts-version @density/structure my-app

### NPM

1. Install structure (`npm i -S @density/structure`)
2. Create a build script. Here's an example:
```javascript
// structure.js

const structure = require('@density/structure');

// Copy assets
const assets = structure.assets(
  'src/index.html',
  'dist/index.html',
  'src/assets',
  'dist/assets'
);

// Compile sass to css
const styles = structure.sass('src/main.scss', 'dist/app.css');

// Transpile all typescript files to their javascript equivalents.
const transpiler = structure.typescript('src/**/*.ts', 'transpiled/');

// Bundle all transpiled files with webpack
const bundler = structure.webpack('transpiled/main.js', 'dist/app.js');

// Start the dev server
structure.start({
  assets: assets,
  styles: styles,
  transpiler: transpiler,
  bundler: bundler,
});
```

3. Run the script to get a live-reloading dev server: `node structure.js`
```sh
$ # Set up a tiny project
$ mkdir src/
$ mkdir src/assets/
$ echo "console.log('Hello');" > src/main.ts
$ echo "body { color: red; }" > src/main.scss
$ cat <<EOF > src/index.html
<html>
  <head>
    <link rel="stylesheet" href="/app.css" />
  </head>
  <body>
    <h1>Hello</h1>
    <script src="/app.js"></script>
  </body>
</html>
EOF
$ # Build the project
$ node structure.js
* Assets ready!
* Styles ready!
* Full transpile done!
* Bundle ready!
* Serving "./dist" at http://127.0.0.1:8080
```

4. *BONUS: add a `start` script in your package.json file that runs the build script: `"start": "node structure.js"`*

## Transpiler/bundler Build System
Structure has scripts to set up and run each step in the build process. Right now it uses the TypeScript compiler API to transpile and watch, and webpack's API to bundle. An alternate transpiler module uses the Babel API instead of TypeScript. An alternate bundler module uses browserify instead of webpack. The reason for using these APIs directly is that we get "fast" compilation for development by keeping the compilers in memory.

## NodeJS Scripts

Subfolders in this project are for purpose-built scripts, like `build` and `start`. Let's look at each of those:

### build

`build` is pretty straightforward. It imports the parts used to compile everything and runs a full transpile and bundle with CSS and assets.

This script runs the final ES5 output through UglifyJS by default.

### start

`start` is more complicated. We want incremental or "fast" compilation when we're developing, plus a nice live reload function.

The TypeScript is immediately transpiled on save for quick refresh times, before the full program is checked. This is because we're not sure if it is possible to incrementally update the program representation that typescript works with internally, and checking the whole program again takes a few seconds.

The logic on every TS change is this:

1) Slam the added or updated file through the transpiler right away. This uses a persistent reference to a "language service" to emit the new file.

2) Call `run` on the bundler instance we also keep in memory. This has an entry point `main.js` and walks the file system to get the rest of the bundle.

3) In the webpack callback, we can now force the live server instance to refresh. This `live-server` instance is monkey-patched at the end of the `start` script. It has a `.change()` method and doesn't actually watch files (so we can be sure everything is done before the reload happens).

4) Additionally we queue up a "slow" transpile after a one-second delay. This will get us comprehensive error checking in the console, so a few seconds after your browser reloads any compile-time errors will show up in the console. This just builds a brand-new ts "program" every time that gets passed all the files in the source glob. This is configurable because it is CPU-heavy.

The result is we get full type-checking on every change, but also a very fast reload for all valid changes.


## Helper Modules

The scripts make use of some helper abstractions to complete each step in the build process as needed. These scripts are in progress but have a fairly standard API:

### transpiler

`structure.typescript` transpiles .ts and .tsx source files, which can include JSX and ES2015 features.

`structure.babel` is an alternative helper for things that babel supports (ES2015/2016/2017/etc, JSX, Flow).

These helpers have and return the same API:

- `const transpiler = structure.typescript(inGlob, outPath, options)`: Call to return a transpiler that will transpile files matching `inGlob` using compiler `options` (TypeScript `compilerOptions` or Babel `options`) and write the transpiled files into the `outPath` directory.
- `transpiler.transpile(name)`: Transpile a single file by file name. Returns a promise that resolves when the file is transpiled.
- `transpiler.transpileAll()`: Transpiles all files matching the configured `inGlob`. Returns a promise that resolves when all files are transpiled.

### bundler

`structure.webpack` is used to bundle ES6 and/or Node modules with webpack. 

`structure.browserify` is an alternative bundler for Node modules that uses browserify (ES6 support TBD). 

These helpers have and return the same API:

- `const bundler = structure.webpack(inFile, outFile, options)`: Call this with an entry script and the bundle destination to initialize the bundler instance. Setting `options.production` to `true` will enable production mode and minify code. Setting `options.sourceMap` will try to preserve source maps in a hacky way using the `sorcery` processor.
- `bundler.bundle()`: Call this to bundle the output file. Returns a promise that resolves when the bundle is written.

### styles

`structure.sass` is used to run `node-sass` in both scripts, with a separate watcher for styles in the `start` script. Pretty simple helper with the following API:

- `const styles = structure.sass(main, paths, bundle)`: Call this with an entry SCSS file, paths to include, and the bundle destination. Returns a styles compiler.
- `styles.compile()`: Use this method to compile a CSS bundle with the configured options. Returns a promise that resolves when the CSS bundle is written.

### assets

Assets are copied with file system calls. This helper has the following API:

- `const assets = structure.assets(indexInFile, indexOutFile, assetsInPath, assetsOutPath)`: Returns an assets copier that copies an index page and an assets folder. Not much to it.
- `assets.copy()`: Copies the assets. Returns a promise that resolves when copying is finished.

# Internals
There's much more detail in [CONTRIBUTING.md](CONTRIBUTING.md).
