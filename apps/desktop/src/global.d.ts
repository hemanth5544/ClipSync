interface ElectronAPI {
  getClipboard: () => Promise<string>;
  setClipboard: (text: string) => Promise<void>;
  getDeviceInfo: () => Promise<{ name: string; platform: string; arch: string }>;
  getAppVersion: () => Promise<string>;
  testIPC: () => Promise<{ success: boolean; message: string }>;
  openExternal: (url: string) => Promise<void>;
  onClipboardChanged: (callback: (data: { content: string; timestamp: string }) => void) => void;
  removeClipboardListener: () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
