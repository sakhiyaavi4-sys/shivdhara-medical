const { app, BrowserWindow, dialog, shell, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');
const path = require('path');
const fs = require('fs');
const url = require('url');

// Configure electron-log for auto-updater
log.transports.file.level = 'debug';
autoUpdater.logger = log;

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    autoHideMenuBar: true,
    title: "Shivdhara Medical Store"
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  setTimeout(() => {
    mainWindow.loadURL('http://localhost:5000');
  }, 2000);

  mainWindow.on('close', async (e) => {
    // If we are forcefully destroying, allow it
    if (mainWindow.isForceClosing) return;

    e.preventDefault(); // Pause the close event

    try {
      // Check if user is logged in
      const currentUser = await mainWindow.webContents.executeJavaScript('localStorage.getItem("store_currentUser")');
      
      if (!currentUser || currentUser === 'null') {
        // Already logged out, close directly without asking
        mainWindow.isForceClosing = true;
        mainWindow.destroy();
      } else {
        // User is logged in, ask for confirmation
        const choice = dialog.showMessageBoxSync(mainWindow, {
          type: 'question',
          buttons: ['Yes, Logout & Exit', 'Cancel'],
          title: 'Confirm Exit',
          message: 'Are you sure you want to close the application? You will be logged out.',
          defaultId: 1,
          cancelId: 1
        });

        if (choice === 0) {
          // User clicked Yes, Logout & Exit
          await mainWindow.webContents.executeJavaScript('localStorage.removeItem("store_currentUser");');
          mainWindow.isForceClosing = true;
          mainWindow.destroy();
        }
      }
    } catch (err) {
      mainWindow.isForceClosing = true;
      mainWindow.destroy();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  try {
    let appPath = app.getAppPath();
    if (appPath.endsWith('.asar')) {
      appPath = appPath + '.unpacked';
    }

    const setupDbPath = url.pathToFileURL(path.join(appPath, 'src/server/setup-db.js')).href;
    const indexPath = url.pathToFileURL(path.join(appPath, 'src/server/index.js')).href;
    
    await import(setupDbPath);
    await import(indexPath);
    
    createWindow();

    // Configure Auto Updater
    let ghToken = '';
    const tokenPath1 = path.join(path.dirname(app.getPath('exe')), 'github-token.txt');
    const tokenPath2 = path.join(app.getPath('home'), 'shivdhara-token.txt');
    
    if (fs.existsSync(tokenPath1)) {
      ghToken = fs.readFileSync(tokenPath1, 'utf8').trim();
    } else if (fs.existsSync(tokenPath2)) {
      ghToken = fs.readFileSync(tokenPath2, 'utf8').trim();
    }
    
    if (ghToken) {
      autoUpdater.setFeedURL({
        provider: 'github',
        owner: 'sakhiyaavi4-sys',
        repo: 'shivdhara-medical',
        private: true,
        token: ghToken
      });
    }
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;
    
    // Add event listeners for the auto-updater to show UI messages
    autoUpdater.on('update-available', (info) => {
      log.info('Update available.');
      if (mainWindow) {
        mainWindow.webContents.send('updater-message', { type: 'update-available', info });
      }
    });

    autoUpdater.on('download-progress', (progressObj) => {
      if (mainWindow) {
        mainWindow.webContents.send('updater-message', { type: 'download-progress', progress: progressObj });
      }
    });

    ipcMain.on('install-update', () => {
      if (mainWindow) {
        mainWindow.isForceClosing = true;
      }
      autoUpdater.quitAndInstall(false, true);
    });

    autoUpdater.on('update-downloaded', (info) => {
      log.info('Update downloaded, asking user to restart');
      if (mainWindow) {
        mainWindow.webContents.send('updater-message', { type: 'update-downloaded', info });
      }
      const dialogOpts = {
        type: 'info',
        buttons: ['Restart and Install', 'Later'],
        title: 'Update Ready',
        message: 'A new version of Shivdhara Medical Store has been downloaded.',
        detail: 'Click "Restart and Install" to apply the update now. The application will close and restart automatically.'
      };

      dialog.showMessageBox(dialogOpts).then((returnValue) => {
        if (returnValue.response === 0) {
          log.info('User clicked Restart and Install');
          // Important: We need to bypass the 'isForceClosing' check we added earlier
          // so the app can actually quit to install the update without asking for login confirmation again
          if (mainWindow) {
            mainWindow.isForceClosing = true;
          }
          autoUpdater.quitAndInstall(false, true);
        }
      });
    });

    autoUpdater.on('error', (err) => {
      log.error('Error in auto-updater:', err);
    });

    autoUpdater.checkForUpdatesAndNotify();

  } catch (err) {
    fs.writeFileSync(path.join(app.getPath('userData'), 'crash.log'), err.stack || err.toString());
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
