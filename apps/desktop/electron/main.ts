import { app, BrowserWindow, Tray, Menu, globalShortcut, clipboard, ipcMain, nativeImage } from 'electron';
import { autoUpdater } from 'electron-updater';
import * as path from 'path';
import * as os from 'os';
import { config } from 'dotenv';

// Load environment variables from .env file (for Electron)
// In production, env vars should be set by the system or bundled
const envPath = path.resolve(__dirname, '../../.env');
config({ path: envPath });

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let lastClipboardContent = '';
let clipboardCheckInterval: NodeJS.Timeout | null = null;
let isQuitting = false;

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
      // CSP warning in dev (unsafe-eval from Next.js Fast Refresh) goes away when packaged.
      // See https://electronjs.org/docs/tutorial/security
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
    if (!isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    mainWindow?.focus();
  });
}

function createTray() {
  const iconPath = path.join(__dirname, '../assets/icon.png');
  const icon = nativeImage.createFromPath(iconPath);
  
  // Fallback to a simple icon if file doesn't exist
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
            isQuitting = true;
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
  
  clipboardCheckInterval = setInterval(() => {
    const currentContent = clipboard.readText();
    
    if (currentContent !== lastClipboardContent && currentContent.trim() !== '') {
      lastClipboardContent = currentContent;
      
      // Send clipboard change to renderer
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('clipboard-changed', {
          content: currentContent,
          timestamp: new Date().toISOString(),
        });
      }
    }
  }, 500); // Check every 500ms
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
  startClipboardMonitoring();
  registerGlobalShortcut();

  // Auto-updater (only in production)
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

// IPC handlers
ipcMain.handle('get-clipboard', () => {
  return clipboard.readText();
});

ipcMain.handle('set-clipboard', (_event, text: string) => {
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
