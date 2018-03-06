<img src="https://cdn.rawgit.com/DensityCo/structure/trunk/logo.svg" height="50" />

<br />

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
- **Transparency.** When you buy into the "Webpack way", you end up using tons of plugins that are
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
2. Create a build script. Here's an example (more details found in [contributing](CONTRIBUTING.md)):

```javascript
// structure.js

const structure = require('@density/structure');

// Copy assets
const assets = structure.assets(
  './src/index.html',
  './dist/index.html',
  './src/assets',
  './dist/assets'
);

// Compile sass to css
const styles = structure.sass('./src/main.scss', './dist/app.css');

// Transpile all typescript files to their javascript equivalents.
const transpiler = structure.typescript('./src/**/*.ts', './tmp');

// Bundle all transpiled files with webpack
const bundler = structure.webpack('./tmp/main.js', './dist/app.js');

// Start the dev server
structure.start({

  // Pass in the modules we set up above
  assets: assets,
  styles: styles,
  transpiler: transpiler,
  bundler: bundler,

  // These are defaults but any live-server options can go here
  serverOptions: {
    root: './dist',
    file: 'index.html'
  }
});
```

3. Run the script to get a live-reloading dev server: `node structure.js`.

4. *BONUS: add a `start` script in your package.json file that runs the build script: `"start": "node structure.js"`*

An end to end example:

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

## Transpiler/bundler Build System
Structure has scripts to set up and run each step in the build process. Right now it uses the TypeScript compiler API to transpile and watch, and Webpack's API to bundle. The reason for using these specific APIs directly is that we get faster compile times by keeping the compilers in memory. Alternate configurations utilize Babel and Browserify for transpiling and bundling, respectively.

## NodeJS Scripts

Subfolders in this project are for purpose-built scripts, like `build` and `start`. Let's look at each of those:

### build

`structure.build` is pretty straightforward. It imports the parts used to compile everything and runs a full transpile and bundle with CSS and assets.

This script runs the final ES5 output through UglifyJS by default.

### start

`structure.start` is more complicated. We want incremental or "fast" compilation when we're developing, and a live reload function. The `transpiler.transpile()` function can be passed a filename to fast-transpile individual files on each save.

With the TypeScript transpiler, each source file is immediately transpiled on every save for a quick refresh, before the full program is typechecked. This is because we're not sure if it is possible to incrementally update the program representation that TypeScript works with internally, and checking the whole program again takes a few extra seconds.

The logic on every TS change is this:

1) Run the added or updated file through the transpiler right away and write the transpiled output. This uses a persistent reference to a "language service" to process and emit the new file.

2) Call `run` or whatever on the bundler instance in memory. This has an entry point `main.js` and walks the file system to get the rest of the bundle.

3) In the bundler callback, we can now force the dev server to refresh. The `live-server` instance is actually monkey-patched at the end of the `start` script. It has a `.change()` method and doesn't actually watch files (so we can be sure everything is done before the reload happens).

4) Finally queue up a "slow" full typecheck + transpile after a one-second delay. This will get us comprehensive error checking in the console, so a few seconds after the browser reloads, any compile-time errors will show up in the console. It makes a brand-new "program" instance every time that processes all files in the project.

The result is we get full typechecking on every change, and fast reload for all valid changes (a *very* fast reload if sourcemaps are disabled).


# Internals & Contributing
There's much more detail in [CONTRIBUTING.md](CONTRIBUTING.md).
