"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const electron_updater_1 = require("electron-updater");
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const fs = __importStar(require("fs"));
const url_1 = require("url");
// Custom protocol so /_next/static/... loads correctly (file:// would resolve to filesystem root).
electron_1.protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true } }]);
// Only load dotenv in development (unpackaged). Packaged app does not include dotenv.
const isPackaged = electron_1.app.isPackaged;
if (!isPackaged) {
    try {
        require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
    }
    catch {
        // dotenv optional in dev
    }
}
let mainWindow = null;
let tray = null;
let lastClipboardContent = '';
let clipboardCheckInterval = null;
let isQuitting = false;
const isDev = process.env.NODE_ENV === 'development' || !isPackaged;
function getOutDir() {
    return path.join(__dirname, '..', 'out');
}
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
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
    const icon = electron_1.nativeImage.createFromPath(iconPath);
    // Fallback to a simple icon if file doesn't exist
    if (icon.isEmpty()) {
        tray = new electron_1.Tray(electron_1.nativeImage.createEmpty());
    }
    else {
        tray = new electron_1.Tray(icon);
    }
    const contextMenu = electron_1.Menu.buildFromTemplate([
        {
            label: 'Show ClipSync',
            click: () => {
                if (mainWindow) {
                    mainWindow.show();
                    mainWindow.focus();
                }
                else {
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
                electron_1.app.quit();
            },
        },
    ]);
    tray.setToolTip('ClipSync - Clipboard Manager');
    tray.setContextMenu(contextMenu);
    tray.on('click', () => {
        if (mainWindow) {
            if (mainWindow.isVisible()) {
                mainWindow.hide();
            }
            else {
                mainWindow.show();
                mainWindow.focus();
            }
        }
        else {
            createWindow();
        }
    });
}
function startClipboardMonitoring() {
    lastClipboardContent = electron_1.clipboard.readText();
    clipboardCheckInterval = setInterval(() => {
        const currentContent = electron_1.clipboard.readText();
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
    const ret = electron_1.globalShortcut.register('CommandOrControl+Shift+V', () => {
        if (mainWindow) {
            if (mainWindow.isVisible()) {
                mainWindow.hide();
            }
            else {
                mainWindow.show();
                mainWindow.focus();
            }
        }
        else {
            createWindow();
        }
    });
    if (!ret) {
        console.log('Global shortcut registration failed');
    }
}
electron_1.app.whenReady().then(() => {
    // Serve exported Next.js app via app:// so /_next/static/... resolves correctly
    if (!isDev) {
        const outDir = getOutDir();
        electron_1.protocol.handle('app', (request) => {
            let urlPath;
            try {
                urlPath = new URL(request.url).pathname;
            }
            catch {
                return Response.error();
            }
            if (urlPath === '/' || urlPath === '')
                urlPath = '/index.html';
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
            const fileUrl = (0, url_1.pathToFileURL)(resolved).href;
            return electron_1.net.fetch(fileUrl);
        });
    }
    createWindow();
    createTray();
    startClipboardMonitoring();
    registerGlobalShortcut();
    // Auto-updater disabled for local builds. Enable when you have a release server (e.g. GitHub releases).
    // Set ENABLE_UPDATES=1 when publishing and app-update.yml points to a real URL.
    if (!isDev && process.env.ENABLE_UPDATES === '1') {
        electron_updater_1.autoUpdater.checkForUpdatesAndNotify().catch(() => { });
    }
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('activate', () => {
    if (electron_1.BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
electron_1.app.on('will-quit', () => {
    if (clipboardCheckInterval) {
        clearInterval(clipboardCheckInterval);
    }
    electron_1.globalShortcut.unregisterAll();
});
// IPC handlers
electron_1.ipcMain.handle('get-clipboard', () => {
    return electron_1.clipboard.readText();
});
electron_1.ipcMain.handle('set-clipboard', (_event, text) => {
    electron_1.clipboard.writeText(text);
    lastClipboardContent = text;
    return true;
});
electron_1.ipcMain.handle('get-device-info', () => {
    return {
        name: os.hostname(),
        platform: os.platform(),
        arch: os.arch(),
    };
});
electron_1.ipcMain.handle('get-app-version', () => {
    return electron_1.app.getVersion();
});
electron_1.ipcMain.handle('show-notification', (_event, title, body) => {
    if (electron_1.Notification.isSupported()) {
        const n = new electron_1.Notification({ title, body });
        n.on('click', () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.show();
                mainWindow.focus();
            }
        });
        n.show();
    }
});
