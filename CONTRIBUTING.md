# Contributing

This is a javascript project that uses npm for dependency management. If you're pulling down a fresh
copy of the project, run `npm i`.

# Interfaces

## Transpilers
Transpilers take three arguments, a source glob of the files to transpile, a folder to store the
transpiled output within, and a bunch of options (optional).

They each return a collection of utilities:
- `transpile` is a function that, when given a filename, transpiles the single file.
- `transpileAll` is a function that transpiles all files that match a given source glob.

We support Typescript and Babel out of the box:
```javascript
// Babel
// Transpile from src/*.js => transpiled/*.js
const babel = structure.babel('src/*.js', 'transpiled/', {
  presets: ['es2015'],
});

// Usage:
babel.transpile('src/foo.js')
babel.transpileAll()



// Typescript
// Transpile from src/*.js => transpiled/*.js
const typescript = structure.typescript('src/*.ts', 'transpiled/', {
  sourceMap: true,
});

// Usage:
typescript.transpile('src/foo.ts')
typescript.transpileAll()
```

## Bundlers
Bundlers take three arguments, a path to the entry point of a module tree, a bundle output path, and
a collection of options:
- `sourceMap`: a boolean indicating whether to build a sourcemap for the bundle or not.
- `production`: should the bundle be production optimized?

They each return a single utility:
- `bundle` is a function that, when called, performs the given bundling operation.

```javascript
// Bundle *.js => bundle.js with webpack
const webpack = structure.webpack('*.js', 'bundle.js', {
  sourceMap: true,
});

// Usage:
webpack.bundle()



// Bundle *.js => bundle.js with browserify
const browserify = structure.browserify('*.js', 'bundle.js', {
  sourceMap: true,
});

// Usage:
browserify.bundle()
```

## Styles
Structure also supports the notion of a stylesheet postprocessor. Stylesheet postprocessors take
three options, a path to the entry point of a stylesheet tree, a stylesheet output path, and
a collection of options:
- `paths`: a list of paths to include when resolving styles. If using a tool like
  [nicss](https://github.com/densityco/nicss), add `./styles` to automatically resolve stylesheets
  from packages.

They each return a single utility:
- `compile` is a function that, when called, performs the given css post-processing operation.

```javascript
// Bundle *.scss => main.css with sass
const sass = structure.sass('*.scss', 'main.css', {
  paths: ['./styles'], // Use nicss! https://github.com/densityco/nicss
});

// Usage:
sass.compile()
```

## Assets
Finally, structure supports a asset transform / copy as an additional compile step. By default,
structure's `assets` step does a number of basic things:
- Copies a user-defined `index.html` into the output folder.
- Copies an assets folder into the output folder.

Assets transforms take a few options:
- A path to an index.html file
- A path to copy the index.html into
- A path to a collection of assets
- A path to copy the collection of assets into

```javascript
const assets = structure.assets(
  './src/index.html',
  './dist/index.html',
  './src/assets',
  './dist/assets'
);

assets.copy();
```

## Publishing
We've configured CircleCI to automatically publish any changes to our npm registry. Whenever a new
version hits `master`, it should be auto-published by our [ci
robot](https://www.npmjs.com/~density-ci). If npm is out of date, [let us know](/issues/new)
