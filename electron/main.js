import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import ytDlpExec from 'yt-dlp-exec';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fix yt-dlp path in production (ASAR)
let ytDlpBinary = ytDlpExec.constants?.YTDLP_URL || '';
if (!ytDlpBinary) {
  // Try to find the binary manually
  ytDlpBinary = path.join(__dirname, '../node_modules/yt-dlp-exec/bin/yt-dlp.exe');
}
if (ytDlpBinary.includes('app.asar')) {
  ytDlpBinary = ytDlpBinary.replace('app.asar', 'app.asar.unpacked');
}
const ytDlp = ytDlpExec.create(ytDlpBinary);


let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#00000000',
      symbolColor: '#74b1be',
      height: 48
    },
    icon: path.join(__dirname, '../build/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    autoHideMenuBar: true,
  });

  const isDev = !app.isPackaged;
  
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
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

// IPC Handlers for yt-dlp
ipcMain.handle('get-video-info', async (event, url) => {
  try {
    const output = await ytDlp(url, {
      dumpJson: true,
      noWarnings: true,
      preferFreeFormats: true
    });
    return { success: true, data: output };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('start-download', async (event, id, url, outputDir, customOptions) => {
  try {
    const options = {
      output: path.join(outputDir, '%(title)s.%(ext)s'),
      noWarnings: true,
      encoding: 'utf8',
      ...customOptions
    };
    const ytDlpProcess = ytDlp.exec(url, options);
    
    let finalPath = '';

    ytDlpProcess.stdout.on('data', (data) => {
      const output = data.toString();
      const progressMatch = output.match(/\[download\]\s+([\d\.]+)%/);
      if (progressMatch) {
        event.sender.send('download-progress', { id, url, progress: parseFloat(progressMatch[1]) });
      }
      
      const destMatch = output.match(/Destination:\s+(.+)/);
      if (destMatch) finalPath = destMatch[1].trim();
      
      const mergeMatch = output.match(/Merging formats into\s+"([^"]+)"/);
      if (mergeMatch) finalPath = mergeMatch[1].trim();
      
      const alreadyMatch = output.match(/\[download\]\s+(.+?)\s+has already been downloaded/);
      if (alreadyMatch) finalPath = alreadyMatch[1].trim();
    });

    await ytDlpProcess;
    
    return { success: true, fullPath: finalPath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('show-in-folder', async (event, fullPath) => {
  shell.showItemInFolder(fullPath);
  return true;
});

ipcMain.handle('open-path', async (event, fullPath) => {
  const error = await shell.openPath(fullPath);
  return { success: !error, error };
});

// IPC Handlers for Folder Selection
ipcMain.handle('get-default-download-path', () => {
  return app.getPath('downloads');
});

ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  if (result.canceled) {
    return null;
  } else {
    return result.filePaths[0];
  }
});
