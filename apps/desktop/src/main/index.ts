import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#000000',
    title: 'SOS',
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(currentDir, '../preload/index.cjs'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show();
  });

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  // In development, load web dev server or built web index
  const devUrl = process.env.ELECTRON_RENDERER_URL || 'http://127.0.0.1:5173';
  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    mainWindow.loadURL(devUrl).catch(() => {
      // Fallback to local built web app if dev server isn't running
      const webDistPath = path.resolve(currentDir, '../../../apps/web/dist/index.html');
      mainWindow?.loadFile(webDistPath);
    });
  } else {
    const webDistPath = path.resolve(currentDir, '../../../apps/web/dist/index.html');
    mainWindow.loadFile(webDistPath);
  }
}

app.whenReady().then(() => {
  ipcMain.handle('app:get-version', () => app.getVersion());

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
