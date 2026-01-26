const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getClipboard: () => ipcRenderer.invoke('get-clipboard'),
  setClipboard: (text) => ipcRenderer.invoke('set-clipboard', text),
  getDeviceInfo: () => ipcRenderer.invoke('get-device-info'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  testIPC: () => ipcRenderer.invoke('test-ipc'),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  onClipboardChanged: (callback) => {
    console.log('Preload: Setting up clipboard change listener');
    ipcRenderer.on('clipboard-changed', (_event, data) => {
      console.log('Preload: Received clipboard-changed event', data);
      callback(data);
    });
  },
  removeClipboardListener: () => {
    console.log('Preload: Removing clipboard listener');
    ipcRenderer.removeAllListeners('clipboard-changed');
  },
});
