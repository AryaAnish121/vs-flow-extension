const sidebar = require('./sidebar');

const sidebarProvider = (context) => {
  return {
    resolveWebviewView: (webviewView) => {
      sidebar(webviewView, context);
    },
  };
};

module.exports = sidebarProvider;
