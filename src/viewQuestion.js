const vscode = require('vscode');
const apiUrl = require('./apiUrl');
const KEY = require('./key');
const tokenManager = require('./tokenManager');

const viewQuestion = (extensionUri, panel, questionId) => {
  const stylesResetUri = panel.webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, 'media', 'reset.css')
  );

  const stylesMainUri = panel.webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, 'media', 'vscode.css')
  );

  const viewQuestionUri = panel.webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, 'media', 'viewq.css')
  );

  panel.webview.onDidReceiveMessage((message) => {
    switch (message.command) {
      case 'token':
        panel.webview.postMessage({
          command: 'token',
          value: {
            token: tokenManager.globalState.get(KEY),
            id: questionId,
          },
        });
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
          <link href="${viewQuestionUri}" rel="stylesheet" />
      </head>
      <body>
        <div class="question-wrapper">
          <div class="loader" />
        </div>
        <script>
          const vscode = acquireVsCodeApi();
          const questionWrapper = document.querySelector('.question-wrapper');

          const init = async (token, id) => {
            const res = await fetch('${apiUrl}/question', {
              method: 'POST',
              body: JSON.stringify({
                id
              }),
              headers: {
                "Content-Type": "application/json",
                authorization: 'Bearer ' + token
              }
            })
            const data = await res.json();

            if (res.status === 200) {
              const ansArray = data.answers;

              const addHtml = () => {
                questionWrapper.innerHTML = '<div class="question-title"><h1>' + data.title + '</h1><hr /></div><div class="question"><p>' + data.body + '</p><p class="questioner">Question by <span>' + data.creatorName + '</span></p></div><h2 class="answer-count">' + data.answers.length + ' answers</h2><div class="answers"></div><div class="answer-feild"><textarea placeholder="Your answer.." class="answer-textarea"></textarea><div class="error-div"></div><button class="answer-sumbit">Submit</button></div>';
              }

              const showAns = (array) => {
                const ans = document.querySelector('.answers');
                ans.innerHTML = '';
                
                array.forEach(obj => {
                  const answerDiv = document.createElement('div');
                  answerDiv.classList.add('answer');

                  answerDiv.innerHTML = '<div class="answer"><p>' + obj.value + '</p><p class="author">Answer by <span>' + obj.answerer +'</span></p></div>';
                  
                  ans.appendChild(answerDiv);
                })

              };

              const addAnswerFeild = () => {
                const textarea = document.querySelector('.answer-textarea');
                const button = document.querySelector('.answer-sumbit');
                const errorDiv = document.querySelector('.error-div');

                button.addEventListener('click', async () => {
                  const answerRes = await fetch('${apiUrl}/answer-question', {
                    method: 'POST',
                    body: JSON.stringify({
                      id,
                      value: textarea.value
                    }),
                    headers: {
                      "Content-Type": "application/json",
                      authorization: 'Bearer ' + token
                    }
                  })
                  const answerData = await answerRes.json();

                  if(answerRes.status === 200){
                    ansArray.push({answerer: answerData.name, value: textarea.value})
                    showAns(ansArray);
                    textarea.value = '';
                    errorDiv.innerHTML = '';
                  }
                  else if (answerRes.status === 401) {
                    errorDiv.innerHTML = '<p class="error-answer">You need to be authenticated to do that</p>';
                  }
                  else{
                    errorDiv.innerHTML = '<p class="error-answer">' + answerData.message + '</p>'
                  }
                });
              };

              const showQuestions = () => {
                const ans = document.querySelector('.answers');
                showAns(data.answers)
              };

              await addHtml();
              await addAnswerFeild();
              await showQuestions();
              
            } else if (res.status === 206) {
              questionWrapper.innerHTML = '<p class="error">' + data.message + '</p>'
            } else {
              questionWrapper.innerHTML = '<p class="error">You need to be authenticated to do that</p>';
            }

          };

          window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'token':
                    init(message.value.token, message.value.id)
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

module.exports = viewQuestion;
