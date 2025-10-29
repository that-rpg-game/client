const { app, BrowserWindow } = require('electron');
const path = require('path');
const autoUpdater = require('./updater/autoUpdater');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: false,
    },
    title: 'RPG Game',
    resizable: true,
  });

  // Load the game
  mainWindow.loadFile(path.join(__dirname, 'ui', 'index.html'));

  // Open DevTools in development
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  // Initialize auto-updater (will check for updates in production)
  autoUpdater.init();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
