# Contributing

This is a javascript project that uses npm for dependency management. If you're pulling down a fresh
copy of the project, run `npm i`.

## Publishing

We've configured CircleCI to automatically publish any changes to our npm registry. Just check in
and push up a new change to `master`!

If you'd like to publish manually, simply run `make publish`. Make will transpile your source and
put the output in `dist/index.js`. Then, it'll publish your changes to npm.

If you'd like to make a build but not publish, run `make build`. Also, `make clean` is a thing too.
