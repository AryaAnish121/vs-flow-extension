const vscode = require('vscode');

const tokenManager = {
  globalState: vscode.Memento,
};

module.exports = tokenManager;
