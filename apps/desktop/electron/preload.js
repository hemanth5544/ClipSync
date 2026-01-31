"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    getClipboard: () => electron_1.ipcRenderer.invoke('get-clipboard'),
    setClipboard: (text) => electron_1.ipcRenderer.invoke('set-clipboard', text),
    getDeviceInfo: () => electron_1.ipcRenderer.invoke('get-device-info'),
    getAppVersion: () => electron_1.ipcRenderer.invoke('get-app-version'),
    showNotification: (title, body) => electron_1.ipcRenderer.invoke('show-notification', title, body),
    onClipboardChanged: (callback) => {
        electron_1.ipcRenderer.on('clipboard-changed', (_event, data) => callback(data));
    },
    removeClipboardListener: () => {
        electron_1.ipcRenderer.removeAllListeners('clipboard-changed');
    },
});
