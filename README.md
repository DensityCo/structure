# Structure

[![Dependency Status](https://david-dm.org/density/structure.svg)](https://david-dm.org/density/structure)
[![Package Version](https://img.shields.io/npm/v/@density/structure.svg)](https://npmjs.com/@density/structure)
![License](https://img.shields.io/badge/License-MIT-green.svg)

Structure is a modular build system for frontend projects. It's built to be flexible, transparent, and to supress
lock-in to any one technology (we're looking at you, Webpack). There is out of the box support for a
number of transpilers ([typescript](https://www.typescriptlang.org/), [babel](https://babeljs.io)),
a number of bundlers ([webpack](https://webpack.github.io/), [browserify](http://browserify.org/)),
and a css post-processor ([sass](https://sass-lang.com)).

## Why not use Webpack to do all of this?
- **Flexibility.** Configuring Webpack to support a custom stack can be clunky and complex.
- **Transparency.** When you buy into the "webpack way", you end up using tons of plugins that are really opaque. Because you don't really know what transforms your code goes through, it's hard to "trim the fat" easily.
- **Troubleshootability.** Due to the above, it's difficult to develop and troubleshoot the development server.

## Example
```javascript
const structure = require('@density/structure');

// Compile sass to css
const sass = structure.sass('main.scss', 'dist/app.css');

// Transpile all typescript files to their javascript equivilents.
const typescript = structure.typescript('src/**/*.ts', 'transpiled/');

// Bundle all typescript with webpack
const webpack = structure.webpack('transpiled/**/*.js', 'dist/app.js');

// Start the dev server
structure.start({
  assets: assets,
  styles: styles,
  transpiler: typescript,
  bundler: webpack,
});
```

Then, when the script is run, you have a simple live-reloading development server:
```sh
$ node structure.js
* Assets ready!
* Styles ready!
* Full transpile done!
* Bundle ready!
* Serving "./dist" at http://127.0.0.1:8080
```

## Transpiler/bundler Build System
Structure has scripts to set up and run each step in the build process. Right now it uses the TypeScript compiler API to transpile and watch, and webpack's API to bundle. An alternate transpiler module uses the Babel API instead of TypeScript. An alternate bundler module uses browserify instead of webpack. The reason for using these APIs directly is that we get "fast" compilation for development by keeping the compilers in memory.

## NodeJS Scripts

Subfolders in this project are for purpose-built scripts, like `build` and `start`. Let's look at each of those:

### build

`build` is pretty straightforward. It imports the parts used to compile everything and runs a full transpile and bundle with CSS and assets.

This script runs the final ES5 output through UglifyJS by default.

### start

`start` is more complicated. We want incremental or "fast" compilation when we're developing, plus a nice live reload function. Several steps are run in mostly synchronous fashion to minimize timing bugs.

The TypeScript is transpiled for file changes immediately, before the full program is checked. This is because I haven't figured out if it is possible or easy to update the representation that typescript works with internally, and checking the whole program again takes a few seconds.

The logic on every TS change is this:

1) Slam the added or updated file through the transpiler right away. This uses a persistent reference to a "language service" to emit the new file.

2) Call `run` on a webpack "compiler" instance we also keep in memory. This has an entry point `main.js` and must do a lot of stuff automatically. Also it's asynchronous so we lose track of when it might finish, but everything that needs to happen after bundling is event-based.

3) In the webpack callback, we can now force the live server instance to refresh. This `live-server` instance is monkey-patched at the end of the `start` script. It has a `.change()` method and doesn't actually watch files (so we can be sure everything is done before reload).

4) Additionally we queue up a "slow" transpile after a second delay. This will get us comprehensive error checking in the console, so a few seconds after your browser reloads with an error it will show up in the console. This just uses a brand-new ts "program" every time that gets passed all the files in the source glob. This should probably be configurable because it is CPU-heavy.

The result is we get full type-checking on every change, but also a very fast reload for all valid changes.


## Helper Modules

The scripts make use of some helper abstractions to complete each step in the build process as needed. These scripts are in progress but have a fairly standard API:

### transpiler

`transpiler_typescript` is currently used by internal-dashboard to transpile .ts and .tsx source files, which can include JSX and ES2015 features.

`transpiler_babel` is an alternative helper for things that babel supports (ES2015/2016/2017/etc, JSX, Flow).

Both of these helpers have the same API:

- `configure(sourceGlob, options)`: Set up the transpiler to transpile files matching `sourceGlob` with `options` (typescript `compilerOptions` or babel `options`)
- `transpile(name)`: Transpile a single file by file name. Must run `.configure()` first. Output directory is configured in `compilerOptions` for TypeScript and is currently hard-coded for babel.
- `transpileAll(sourceGlob?, options?)`: Transpiles all files matching `sourceGlob` with `options`. If `.configure()` has already been called these parameters will fall back to formerly configured values.

### bundler

`bundler` is imported into both scripts to bundle ES6 files with webpack. This helper has the following API:

- `configure(main, bundle, production, sourceMap)`: Call this with an entry script and the bundle destination to initialize the bundler instance. `production` will enable production mode and minify code. `sourceMap` will try to preserve source maps in a hacky way using the `sorcery` processor.
- `bundle(callback?, dest?)`: Call this to bundle the output file. `dest` is just used to make sure the destination directory exist before trying to write the bundle, this could be better.

### styles

`styles` is used to run `node-sass` in both scripts, with a separate watcher for styles in the `start` script. Pretty simple helper with the following API:

- `configure(main, paths, bundle)`: Calling this with an entry SCSS file, paths to include, and the bundle destination will set up the bundler.
- `compile(main?, paths?, bundle?)`: Use this method to compile. Parameters are the same as and fall back on values passed in a previous call to `.configure()`.

### assets

Assets are copied with file system calls. This helper has the following API:

- `.copy(paths?, index?, dest?)`: Calling this will copy over assets from the `paths` array to `dest/assets`. If `index` is null, the helper writes a hard-coded ReactJS page to `dest/index.html`.

# Internals
There's much more detail in [CONTRIBUTING.md](CONTRIBUTING.md).
