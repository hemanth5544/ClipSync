import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  getClipboard: () => ipcRenderer.invoke('get-clipboard'),
  setClipboard: (text: string) => ipcRenderer.invoke('set-clipboard', text),
  getDeviceInfo: () => ipcRenderer.invoke('get-device-info'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  showNotification: (title: string, body: string) =>
    ipcRenderer.invoke('show-notification', title, body),
  onClipboardChanged: (callback: (data: { content: string; timestamp: string }) => void) => {
    ipcRenderer.on('clipboard-changed', (_event, data) => callback(data));
  },
  removeClipboardListener: () => {
    ipcRenderer.removeAllListeners('clipboard-changed');
  },
});

// Type definitions for TypeScript
declare global {
  interface Window {
    electronAPI: {
      getClipboard: () => Promise<string>;
      setClipboard: (text: string) => Promise<boolean>;
      getDeviceInfo: () => Promise<{ name: string; platform: string; arch: string }>;
      getAppVersion: () => Promise<string>;
      showNotification: (title: string, body: string) => Promise<void>;
      onClipboardChanged: (callback: (data: { content: string; timestamp: string }) => void) => void;
      removeClipboardListener: () => void;
    };
  }
}
