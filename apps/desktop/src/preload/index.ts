import { contextBridge, ipcRenderer } from 'electron';

export interface SosDesktopBridge {
  isDesktop: boolean;
  platform: string;
  getVersion: () => Promise<string>;
}

const desktopBridge: SosDesktopBridge = {
  isDesktop: true,
  platform: process.platform,
  getVersion: () => ipcRenderer.invoke('app:get-version')
};

contextBridge.exposeInMainWorld('sosDesktop', desktopBridge);
