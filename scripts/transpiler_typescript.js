const chalk = require('chalk');
const fs = require('fs-extra');
const glob = require('glob');
const ts = require('typescript');
const utilities = require('./utilities');

// Configuration returns new transpiler instance
function transpiler(inGlob, outPath, options) {
  const _inGlob = inGlob;
  const _outPath = outPath;
  const _options = options || {};
  const _metadata = {};

  // Override some default options
  _options.outDir = _options.outDir || _outPath;
  _options.allowJs = _options.allowJs || true;

  // Create the language service host to allow the LS to communicate with the host
  const _host = {
    getScriptFileNames: () => { return glob.sync(_inGlob); },
    getScriptVersion: name => _metadata[name] && _metadata[name].version.toString(),
    getScriptSnapshot: name => {
      if (!fs.existsSync(name)) { return undefined; }
      return ts.ScriptSnapshot.fromString(fs.readFileSync(name).toString());
    },
    getCurrentDirectory: () => process.cwd(),
    getCompilationSettings: () => _options,
    getDefaultLibFileName: options => ts.getDefaultLibFilePath(options),
  };

  // Create the language service
  const _service = ts.createLanguageService(_host, ts.createDocumentRegistry());


  // Common Transpiler API
  return {
    name: 'TypeScript Transpiler',
    inGlob: _inGlob,
    outPath: _outPath,
    options: _options,

    transpile: function (name) {
      // TODO: handle weird filename formats better
      if (name.startsWith('src')) { name = './' + name; }

      // Bump the file version
      if (_metadata[name]) {
        _metadata[name].version++;
      } else {
        _metadata[name] = { version: 0 };
      }

      // Emit the output
      const output = _service.getEmitOutput(name);
      if (output.emitSkipped) {
        console.log(chalk.red(`Transpile ${name} skipped!`));
        return Promise.reject();
      } else {
        // Write output files to disk
        return Promise.all(output.outputFiles.map(o => {
          return fs.outputFile(o.name, o.text, "utf8");
        })).then(() => {
          console.log(chalk.gray(`Transpile ${name} done!`));
        });
      }
    },

    // Helper to do a (slow) full transpile with error reporting
    transpileAll: function () {
      // Make a new program with the latest sourceFiles
      const sourceFiles = glob.sync(_inGlob);
      const program = ts.createProgram(sourceFiles, _options);

      // Emit and get diagnostics
      const emitResult = program.emit();
      const allDiagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);

      // Log out all diagnostics
      allDiagnostics.forEach(diagnostic => {
        const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
        if (!diagnostic.file) {
          console.log(chalk.yellow(`Transpile Error: ${message}`));
        } else {
          const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
          console.log(chalk.yellow(`Transpile Error: ${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`));
        }
      });

      // Log out skipped or complete message
      if (emitResult.emitSkipped) {
        console.log(chalk.red('Full transpile skipped!'));
      } else {
        console.log(chalk.gray('Full transpile done!'));
        return Promise.resolve(emitResult);
      }
    }
  }
}

module.exports = transpiler;
