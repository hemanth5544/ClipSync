// This file will be generated from main.ts by TypeScript compiler
// For now, we'll create a basic version

const { app, BrowserWindow, Tray, Menu, globalShortcut, clipboard, ipcMain, nativeImage, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const os = require('os');

let mainWindow = null;
let tray = null;
let lastClipboardContent = '';
let clipboardCheckInterval = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: true,
    titleBarStyle: 'default',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false,
  });

  const startUrl = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../out/index.html')}`;

  mainWindow.loadURL(startUrl);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    console.log('Window ready to show');
  });
}

function createTray() {
  const iconPath = path.join(__dirname, '../assets/icon.png');
  const icon = nativeImage.createFromPath(iconPath);
  
  if (icon.isEmpty()) {
    tray = new Tray(nativeImage.createEmpty());
  } else {
    tray = new Tray(icon);
  }

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show ClipSync',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        } else {
          createWindow();
        }
      },
    },
    {
      label: 'Settings',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
          mainWindow.webContents.send('navigate', '/settings');
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setToolTip('ClipSync - Clipboard Manager');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    } else {
      createWindow();
    }
  });
}

function startClipboardMonitoring() {
  lastClipboardContent = clipboard.readText();
  console.log('Clipboard monitoring started, initial content:', lastClipboardContent.substring(0, 30));
  
  clipboardCheckInterval = setInterval(() => {
    try {
      const currentContent = clipboard.readText();
      
      if (currentContent !== lastClipboardContent && currentContent.trim() !== '') {
        console.log('Clipboard content changed:', currentContent.substring(0, 50));
        lastClipboardContent = currentContent;
        
        // Send to renderer if window exists
        if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents && !mainWindow.webContents.isDestroyed()) {
          mainWindow.webContents.send('clipboard-changed', {
            content: currentContent,
            timestamp: new Date().toISOString(),
          });
          console.log('✓ Clipboard change sent to renderer');
        } else {
          console.log('⚠ Window not ready, cannot send clipboard change');
        }
      }
    } catch (error) {
      console.error('Error in clipboard monitoring:', error);
    }
  }, 500);
}

function registerGlobalShortcut() {
  const ret = globalShortcut.register('CommandOrControl+Shift+V', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    } else {
      createWindow();
    }
  });

  if (!ret) {
    console.log('Global shortcut registration failed');
  }
}

app.whenReady().then(() => {
  createWindow();
  createTray();
  registerGlobalShortcut();

  // Wait for window to be ready before starting clipboard monitoring
  if (mainWindow) {
    mainWindow.webContents.once('did-finish-load', () => {
      console.log('Window loaded, starting clipboard monitoring');
      startClipboardMonitoring();
    });
  } else {
    // Fallback: start monitoring after a short delay
    setTimeout(() => {
      console.log('Starting clipboard monitoring (delayed)');
      startClipboardMonitoring();
    }, 1000);
  }

  if (!isDev) {
    autoUpdater.checkForUpdatesAndNotify();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('will-quit', () => {
  if (clipboardCheckInterval) {
    clearInterval(clipboardCheckInterval);
  }
  globalShortcut.unregisterAll();
});

ipcMain.handle('get-clipboard', () => {
  return clipboard.readText();
});

ipcMain.handle('set-clipboard', (_event, text) => {
  clipboard.writeText(text);
  lastClipboardContent = text;
  return true;
});

ipcMain.handle('get-device-info', () => {
  return {
    name: os.hostname(),
    platform: os.platform(),
    arch: os.arch(),
  };
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// Test IPC communication
ipcMain.handle('test-ipc', () => {
  console.log('IPC test received from renderer');
  return { success: true, message: 'IPC communication working' };
});

// Open external URL in default browser
ipcMain.handle('open-external', (_event, url) => {
  shell.openExternal(url);
  return true;
});
