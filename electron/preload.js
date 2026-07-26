const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getVideoInfo: (url) => ipcRenderer.invoke('get-video-info', url),
  startDownload: (id, url, outputDir, customOptions) => ipcRenderer.invoke('start-download', id, url, outputDir, customOptions),
  onDownloadProgress: (callback) => ipcRenderer.on('download-progress', (_event, data) => callback(data)),
  getDefaultDownloadPath: () => ipcRenderer.invoke('get-default-download-path'),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  showInFolder: (fullPath) => ipcRenderer.invoke('show-in-folder', fullPath),
  openPath: (fullPath) => ipcRenderer.invoke('open-path', fullPath)
});
