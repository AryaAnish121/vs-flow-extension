const vscode = require('vscode');
const apiUrl = require('./apiUrl');
const authHandler = require('./authHandler');
const KEY = require('./key');
const tokenManager = require('./tokenManager');

const sidebar = function (webviewView, context) {
  const stylesResetUri = webviewView.webview.asWebviewUri(
    vscode.Uri.joinPath(context.extensionUri, 'media', 'reset.css')
  );

  const stylesMainUri = webviewView.webview.asWebviewUri(
    vscode.Uri.joinPath(context.extensionUri, 'media', 'vscode.css')
  );

  const sidebarUri = webviewView.webview.asWebviewUri(
    vscode.Uri.joinPath(context.extensionUri, 'media', 'sidebar.css')
  );

  const refreshImageUri = webviewView.webview.asWebviewUri(
    vscode.Uri.joinPath(context.extensionUri, 'media', 'refresh.svg')
  );

  webviewView.webview.onDidReceiveMessage(
    async (message) => {
      switch (message.command) {
        case 'logout':
          tokenManager.globalState.update(KEY, '');
          webviewView.webview.postMessage({
            command: 'token',
            value: tokenManager.globalState.get(KEY),
          });
          break;
        case 'login':
          authHandler(webviewView);
          return;
        case 'newQuestion':
          vscode.commands.executeCommand('vsflow.askQuestion');
          break;
        case 'myQuestion':
          vscode.commands.executeCommand('vsflow.myQuestions');
          break;
        case 'viewQuestion':
          vscode.commands.executeCommand(
            'vsflow.viewQuestion',
            String(message.value)
          );
          break;
        case 'token':
          webviewView.webview.postMessage({
            command: 'token',
            value: tokenManager.globalState.get(KEY),
          });
          break;
        default:
          break;
      }
    },
    undefined,
    context.subscriptions
  );

  const html = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <link href="${stylesResetUri}" rel="stylesheet" />
              <link href="${stylesMainUri}" rel="stylesheet" />
              <link href="${sidebarUri}" rel="stylesheet" />
          </head>
          <body>
            <div class="sidebar">
              <div class="loader" />
            </div>
            <script>
              const vscode = acquireVsCodeApi();

              const init = async (token) => {
                const authCheck = async () => {
                  const res = await fetch('${apiUrl}/me', {
                      headers: {
                        authorization: 'Bearer ' + token
                      }
                  })
                  const data = await res.json();
                  if(res.status === 401){
                    document.querySelector('.sidebar').innerHTML = '<button class="login-button">Login with github</button>';
                  }
                  else{
                    document.querySelector('.sidebar').innerHTML = '<div class="sidebar-top"><a class="my-ques">My questions</a><img src="${refreshImageUri}" alt="refresh" class="refresh-button" /></div><form class="find-form"><input class="question-finder" type="text" placeholder="Find..." /></form><div class="questions"></div><button class="new-ques-button">New Question</button><button class="logout-button">Logout</button>';
                  }
                };

                const addQuestions = (array) => {
                  const questions = document.querySelector('.questions');
                  questions.innerHTML = '';

                  array.forEach(obj => {
                    const questionDiv = document.createElement('div');
                    questionDiv.classList.add('question');
                    questionDiv.innerHTML = '<h3 class="question-title">' + obj.title + '</h3><p class="main-question">' + obj.body.substring(0, 125) + '</p>';
                    questionDiv.addEventListener('click', () => {
                      vscode.postMessage({
                        command: 'viewQuestion',
                        value: obj._id
                      })
                    });
    
                    questions.appendChild(questionDiv);
                  });
                };
              
                const logoutFunction = () => {
                  const logoutButton = document.querySelector('.logout-button');
                  if(logoutButton){
                    logoutButton.addEventListener('click', () => {
                      vscode.postMessage({
                        command: 'logout'
                      })
                    })
                  }
                }
                
                const loginFunction = () => {
                  const logoutButton = document.querySelector('.login-button');
                  if(logoutButton){
                    logoutButton.addEventListener('click', () => {
                      vscode.postMessage({
                        command: 'login'
                      })
                    })
                  }
                }
                
                const newQuestionFunction = () => {
                  const logoutButton = document.querySelector('.new-ques-button');
                  if(logoutButton){
                    logoutButton.addEventListener('click', () => {
                      vscode.postMessage({
                        command: 'newQuestion'
                      })
                    })
                  }
                }

                const myQuesFunction = () => {
                  const myQuesButton = document.querySelector('.my-ques');
                  if(myQuesButton){
                    myQuesButton.addEventListener('click', () => {
                      vscode.postMessage({
                        command: 'myQuestion'
                      })
                    })
                  }
                };

                const getNewQuestion = async () => {
                  const res = await fetch('${apiUrl}/getQuestions', {
                    headers: {
                      authorization: 'Bearer ' + token
                    }
                  });
                  const data = await res.json();

                  if(res.status === 200){
                    addQuestions(data);
                  }
                };

                const refreshFunction = () => {
                  const refreshButton = document.querySelector('.refresh-button');
                  if(refreshButton){
                    refreshButton.addEventListener('click', async () => {
                      const res = await fetch('${apiUrl}/getQuestions', {
                        headers: {
                          authorization: 'Bearer ' + token
                        }
                      });
                      const data = await res.json();
    
                      if(res.status === 200){
                        addQuestions(data);
                      }
                    })
                  }
                };

                const findFunction = () => {
                  const findForm = document.querySelector('.find-form');
                  const input = document.querySelector('.question-finder');

                  if(findForm){
                    findForm.addEventListener('submit', async (e) => {
                      e.preventDefault();
                      const res = await fetch('${apiUrl}/search', {
                        method: 'POST',
                        body: JSON.stringify({
                          query: input.value
                        }),
                        headers: {
                          "Content-Type": "application/json",
                          authorization: 'Bearer ' + token
                        }
                      });
                      const data = await res.json();
    
                      if(res.status === 200){
                        addQuestions(data);
                      }
                    })
                  }
                };
                
                await authCheck();
                await logoutFunction();
                await loginFunction();
                await newQuestionFunction();
                await myQuesFunction();
                await getNewQuestion();
                await refreshFunction();
                await findFunction();
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

  webviewView.webview.options = {
    enableScripts: true,
  };
  webviewView.webview.html = html;
};

module.exports = sidebar;
