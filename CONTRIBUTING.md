# Contributing

This is a javascript project that uses npm for dependency management. If you're pulling down a fresh
copy of the project, run `npm i`.

# Interfaces

## Transpilers
Transpilers take three arguments:

- A source glob of the files to transpile
- A folder to store the
transpiled output within
- A bunch of optional configuration options to pass to the transpiler.

We support Typescript and Babel out of the box:

- `structure.typescript` transpiles .ts and .tsx source files, which can include JSX and ES2015 features.
- `structure.babel` is an alternative helper for things that babel supports (ES2015/2016/2017/etc, JSX, Flow).

They each return a collection of utilities:

- `transpile` is a function that, when given a filename, transpiles the single file. Returns a promise that resolves when the file is transpiled.
- `transpileAll` is a function that transpiles all files that match a given source glob. Returns a promise that resolves when all files are transpiled.

#### Example Usage
```javascript
// Babel
// Transpile from src/*.js => tmp/*.js
const babel = structure.babel('**/*.js', 'tmp/', {
  presets: ['es2015'],
});

// Usage:
babel.transpile('index.js')
babel.transpileAll()



// Typescript
// Transpile from src/*.js => tmp/*.js
const typescript = structure.typescript('**/*.js', 'tmp/', {
  sourceMap: true,
});

// Usage:
typescript.transpile('index.ts')
typescript.transpileAll()
```

## Bundlers
Bundlers take three arguments:

- A path to the entry point of a module tree
- A bundle output path
- A collection of options:
	- `sourceMap`: a boolean indicating whether to build a sourcemap for the bundle or not.
	- `production`: should the bundle be production optimized?

We support webpack and browserify out of the box: 

- `structure.webpack` is used to bundle ES6 and/or Node modules with webpack. 
- `structure.browserify` is an alternative bundler for Node modules that uses browserify (ES6 support TBD). 


They each return a single utility:

- `bundle` is a function that, when called, performs the given bundling operation.

#### Example Usage
```javascript
// Bundle *.js => bundle.js with webpack
const webpack = structure.webpack('*.js', 'app.js', { sourceMap: true });

// Usage:
webpack.bundle()


// Or bundle *.js => app.js with browserify
const browserify = structure.browserify('*.js', 'app.js', { sourceMap: true });

// Usage:
browserify.bundle()
```

## Styles
Structure also supports the notion of a stylesheet postprocessor. Stylesheet postprocessors take
three options:

- A path to the entry point of a stylesheet tree
- A stylesheet output path
- A collection of options:
	- `paths`: a list of paths to include when resolving styles.

They each return a single utility:

- `compile`: a function that, when called, performs the given css post-processing operation.

#### Example Usage
```javascript
// Bundle *.css => index.css with sass
const sass = structure.sass('*.css', 'index.css', { paths: ['.'] });

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

#### Example Usage
```javascript
// Copy assets
const assets = structure.assets('./src/**/!(*.js|*.css)', './build/**/*');

// Usage:
assets.copy();
```

## Publishing
We've configured CircleCI to automatically publish any changes to our npm registry. Whenever a new
version hits `trunk`, it should be auto-published by our [ci
robot](https://www.npmjs.com/~density-ci). If npm is out of date, [let us know](/issues/new)
