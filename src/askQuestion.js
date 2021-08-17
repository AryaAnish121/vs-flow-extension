const vscode = require('vscode');
const apiUrl = require('./apiUrl');
const KEY = require('./key');
const tokenManager = require('./tokenManager');

const askQuestion = (extensionUri, panel) => {
  const stylesResetUri = panel.webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, 'media', 'reset.css')
  );

  const stylesMainUri = panel.webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, 'media', 'vscode.css')
  );

  const askQuestionUri = panel.webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, 'media', 'askq.css')
  );

  panel.webview.onDidReceiveMessage((message) => {
    switch (message.command) {
      case 'token':
        panel.webview.postMessage({
          command: 'token',
          value: tokenManager.globalState.get(KEY),
        });
        break;
      case 'question':
        vscode.commands.executeCommand(
          'vsflow.viewQuestion',
          String(message.value)
        );
        break;
      default:
        break;
    }
  });

  const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link href="${stylesResetUri}" rel="stylesheet" />
          <link href="${stylesMainUri}" rel="stylesheet" />
          <link href="${askQuestionUri}" rel="stylesheet" />
      </head>
      <body>
        <h1>Ask a new question</h1>
        <input placeholder="Title" class="title" />
        <textarea placeholder="Body / Question..." class="body" ></textarea>
        <div class="error-div"></div>
        <button class="ask-button">Ask Question</button>
        <script>
          const vscode = acquireVsCodeApi();
          const init = (token) => {
            const title = document.querySelector('.title');
            const body = document.querySelector('.body');
            const button = document.querySelector('.ask-button');
            const errorSelector = document.querySelector('.error-div');

            button.addEventListener('click', async () => {
              const res = await fetch('${apiUrl}/new-question', {
                  method: 'POST',
                  body: JSON.stringify({
                    title: title.value,
                    body: body.value
                  }),
                  headers: {
                    "Content-Type": "application/json",
                    authorization: 'Bearer ' + token
                  }
              })
              const data = await res.json();
              if(res.status === 200){
                vscode.postMessage({
                  command: 'question',
                  value: data.question._id
                })
              }
              else if(res.status === 401) {
                errorSelector.innerHTML = '<p class="error">You need to be authenticated to do that</p>';
              }
              else{
                errorSelector.innerHTML = '<p class="error">' + data.message + '</p>';
              }
            });
          }

          window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'token':
                    init(message.value);
                    break;
            }
          });

          vscode.postMessage({
            command: 'token'
          })
          
        </script>
      </body>
      </html>
  `;

  panel.webview.html = html;
};

module.exports = askQuestion;
