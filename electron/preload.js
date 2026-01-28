const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // File selection
  selectVideoFile: () => ipcRenderer.invoke('select-video-file'),
  
  // Player integration
  launchPlayer: (playerPath, filePath) => 
    ipcRenderer.invoke('launch-player', { playerPath, filePath }),
  
  // Webview for downloads
  openWebview: (url) => ipcRenderer.invoke('open-webview', { url }),
  
  // Download path management
  getDownloadPath: () => ipcRenderer.invoke('get-download-path'),
  setDownloadPath: (path) => ipcRenderer.invoke('set-download-path', path),
  
  // Window controls (for custom title bar)
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  
  // Media server
  startMediaServer: () => ipcRenderer.invoke('start-media-server'),
  stopMediaServer: () => ipcRenderer.invoke('stop-media-server'),
  getMediaServerUrl: () => ipcRenderer.invoke('get-media-server-url'),
  updateMediaLibrary: (library) => ipcRenderer.invoke('update-media-library', library),
  
  // Event listeners
  onDownloadProgress: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('download-progress', handler);
    return () => ipcRenderer.removeListener('download-progress', handler);
  },
  
  onDownloadComplete: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('download-complete', handler);
    return () => ipcRenderer.removeListener('download-complete', handler);
  },
  
  // Trakt OAuth callback listener
  onTraktCallback: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('trakt-callback', handler);
    return () => ipcRenderer.removeListener('trakt-callback', handler);
  },
});

// Notify when preload is ready
window.addEventListener('DOMContentLoaded', () => {
  console.log('Electron preload script loaded');
});
