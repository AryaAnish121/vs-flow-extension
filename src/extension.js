const vscode = require('vscode');
const askQuestion = require('./askQuestion');
const viewQuestion = require('./viewQuestion');
const sidebarProvider = require('./sidebarProvider');
const myQuestions = require('./myQuestions');
const authHandler = require('./authHandler');
const tokenManager = require('./tokenManager');

function activate(context) {
  var panel1;
  var panel2;
  var panel3;

  tokenManager.globalState = context.globalState;

  context.subscriptions.push(
    vscode.commands.registerCommand('vsflow.authenticate', () => {
      authHandler();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('vsflow.askQuestion', () => {
      panel1 = vscode.window.createWebviewPanel(
        'askQuestion',
        'Ask Question',
        vscode.ViewColumn.One,
        {
          enableScripts: true,
        }
      );
      askQuestion(context.extensionUri, panel1);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('vsflow.viewQuestion', (questionId) => {
      panel2 = vscode.window.createWebviewPanel(
        'viewQuestion',
        'View Question',
        vscode.ViewColumn.One,
        {
          enableScripts: true,
        }
      );
      viewQuestion(context.extensionUri, panel2, questionId);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('vsflow.myQuestions', () => {
      panel3 = vscode.window.createWebviewPanel(
        'myQuestions',
        'My Questions',
        vscode.ViewColumn.One,
        {
          enableScripts: true,
        }
      );
      myQuestions(context.extensionUri, panel3);
    })
  );

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      'vsflow-sidebar',
      sidebarProvider(context)
    )
  );
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
