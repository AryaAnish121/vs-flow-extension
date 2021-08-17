const vscode = require('vscode');
const polka = require('polka');
const apiUrl = require('./apiUrl');
const tokenManager = require('./tokenManager');
const KEY = require('./key');

const authHandler = (webviewView) => {
  const app = polka();

  app.get('/auth/:token', async (req, res) => {
    const { token } = req.params;
    if (!token) {
      res.end('<h1>please provide the token</h1>');
    } else {
      await tokenManager.globalState.update(KEY, token);
      if (webviewView) {
        webviewView.webview.postMessage({
          command: 'token',
          value: token,
        });
      }
      res.end('<h1>Auth was successfull, you can now close this window</h1>');
    }
    app.server.close();
  });

  app.listen(54321, (err) => {
    if (!err) {
      vscode.commands.executeCommand(
        'vscode.open',
        vscode.Uri.parse(`${apiUrl}/auth/github`)
      );
    } else {
      console.log(err);
      vscode.window.showErrorMessage('err');
    }
  });
};

module.exports = authHandler;
