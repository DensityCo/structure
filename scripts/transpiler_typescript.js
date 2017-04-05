const chalk = require('chalk');
const fs = require('fs');
const glob = require('glob');
const ts = require('typescript');
const utilities = require('./utilities');

let _host = null;
let _service = null;
let _program = null;
let _metadata = null;
let _sourceGlob = null;
let _options = null;

// Helper to set up the language service
function configure(sourceGlob, options) {
  _sourceGlob = sourceGlob;
  _options = options;
  _metadata = {};

  // Create the language service host to allow the LS to communicate with the host
  _host = {
    getScriptFileNames: () => { return glob.sync(_sourceGlob); },
    getScriptVersion: (name) => _metadata[name] && _metadata[name].version.toString(),
    getScriptSnapshot: (name) => {
      if (!fs.existsSync(name)) { return undefined; }
      return ts.ScriptSnapshot.fromString(fs.readFileSync(name).toString());
    },
    getCurrentDirectory: () => process.cwd(),
    getCompilationSettings: () => _options,
    getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
  };

  // Create the language service
  _service = ts.createLanguageService(_host, ts.createDocumentRegistry());
}

// Helper to do a (fast) transpile of a single file
function transpile(name) {

  // Abort if language service isn't configured yet
  if (!_service) { 
    console.error('Run `configure` before running `transpile`!');
    return null;
  }
  
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
    console.log(chalk.gray(`Quick transpile ${name} skipped!`));
  } else {
    console.log(chalk.gray(`Quick transpile ${name} done!`));
  }

  // Write output files
  output.outputFiles.forEach(o => {
    utilities.ensureDirectoryExistence(o.name);
    fs.writeFileSync(o.name, o.text, "utf8");
  });
}

// Helper to do a (slow) full transpile with error reporting
function transpileAll(sourceGlob = _sourceGlob, options = _options) {

  // Make a new program with the latest sourceFiles
  const sourceFiles = glob.sync(sourceGlob);
  _program = ts.createProgram(sourceFiles, options);

  // Emit and get diagnostics
  const emitResult = _program.emit();
  const allDiagnostics = ts.getPreEmitDiagnostics(_program).concat(emitResult.diagnostics);

  // Log out all diagnostics
  allDiagnostics.forEach(diagnostic => {
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
    if (!diagnostic.file) {
      console.log(chalk.yellow(`TS: ${message}`));
    } else {
      const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
      console.log(chalk.yellow(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`));
    }
  });

  // Log out skipped or complete message
  if (emitResult.emitSkipped) {
    console.log(chalk.gray('Full transpile skipped!'));
  } else {
    console.log(chalk.gray('Full transpile done!'));
  }
}

// Public API
module.exports = {
  sourceGlob: _sourceGlob,
  options: _options,
  service: _service,
  program: _program,
  configure: configure,
  transpile: transpile,
  transpileAll: transpileAll
};
