const vscode = require('vscode');
const apiUrl = require('./apiUrl');
const KEY = require('./key');
const tokenManager = require('./tokenManager');

const myQuestions = (extensionUri, panel) => {
  const stylesResetUri = panel.webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, 'media', 'reset.css')
  );

  const stylesMainUri = panel.webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, 'media', 'vscode.css')
  );

  const myQuestionsUri = panel.webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, 'media', 'myqs.css')
  );

  panel.webview.onDidReceiveMessage((message) => {
    switch (message.command) {
      case 'token':
        panel.webview.postMessage({
          command: 'token',
          value: tokenManager.globalState.get(KEY),
        });
        break;
      case 'viewQuestion':
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
          <link href="${myQuestionsUri}" rel="stylesheet" />
      </head>
      <body>
        <div class="questions">
          <div class="loader" />
        </div>
        <script>
          const vscode = acquireVsCodeApi();
          const questions = document.querySelector('.questions');

          const init = async (token) => {
            const res = await fetch('${apiUrl}/my-questions', {
              headers: {
                authorization: 'Bearer ' + token
              }
            })
            const data = await res.json();
            
            if(res.status === 200){
              questions.innerHTML = '';
              data.forEach(question => {
                const questionDiv = document.createElement('div');
                questionDiv.classList.add('question');
                questionDiv.innerHTML = '<h2 class="question-title">' + question.title + '</h2><p class="main-question">' + question.body + '</p>';
                questionDiv.addEventListener('click', () => {
                  vscode.postMessage({
                    command: 'viewQuestion',
                    value: question._id
                  })
                });

                questions.appendChild(questionDiv);
              })
            }
            else{
              questions.innerHTML = '<h3 class="error">! You need to be authenticated.</h3>';
            }

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

module.exports = myQuestions;
