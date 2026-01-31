import { app, BrowserWindow, Tray, Menu, globalShortcut, clipboard, ipcMain, nativeImage, protocol, net, Notification } from 'electron';
import { autoUpdater } from 'electron-updater';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { pathToFileURL } from 'url';

// Custom protocol so /_next/static/... loads correctly (file:// would resolve to filesystem root).
protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true } }]);

// Only load dotenv in development (unpackaged). Packaged app does not include dotenv.
const isPackaged = app.isPackaged;
if (!isPackaged) {
  try {
    require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
  } catch {
    // dotenv optional in dev
  }
}

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let lastClipboardContent = '';
let clipboardCheckInterval: NodeJS.Timeout | null = null;
let isQuitting = false;

const isDev = process.env.NODE_ENV === 'development' || !isPackaged;

function getOutDir(): string {
  return path.join(__dirname, '..', 'out');
}

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
    : 'app://./index.html';

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
  // Serve exported Next.js app via app:// so /_next/static/... resolves correctly
  if (!isDev) {
    const outDir = getOutDir();
    protocol.handle('app', (request) => {
      let urlPath: string;
      try {
        urlPath = new URL(request.url).pathname;
      } catch {
        return Response.error();
      }
      if (urlPath === '/' || urlPath === '') urlPath = '/index.html';
      const decoded = decodeURIComponent(urlPath).replace(/^\/+/, '');
      let filePath = path.join(outDir, decoded);
      const outResolved = path.resolve(outDir);
      let resolved = path.resolve(filePath);
      if (!resolved.startsWith(outResolved)) {
        return new Response(null, { status: 403 });
      }
      // Next.js static export uses .html files (e.g. auth/login.html for /auth/login)
      if (!fs.existsSync(resolved) && !decoded.endsWith('.html') && !path.extname(decoded)) {
        const withHtml = path.join(outDir, decoded + '.html');
        if (fs.existsSync(withHtml)) {
          resolved = path.resolve(withHtml);
        }
      }
      const fileUrl = pathToFileURL(resolved).href;
      return net.fetch(fileUrl);
    });
  }

  createWindow();
  createTray();
  startClipboardMonitoring();
  registerGlobalShortcut();

  // Auto-updater disabled for local builds. Enable when you have a release server (e.g. GitHub releases).
  // Set ENABLE_UPDATES=1 when publishing and app-update.yml points to a real URL.
  if (!isDev && process.env.ENABLE_UPDATES === '1') {
    autoUpdater.checkForUpdatesAndNotify().catch(() => {});
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

ipcMain.handle('show-notification', (_event, title: string, body: string) => {
  if (Notification.isSupported()) {
    const n = new Notification({ title, body });
    n.on('click', () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.show();
        mainWindow.focus();
      }
    });
    n.show();
  }
});
