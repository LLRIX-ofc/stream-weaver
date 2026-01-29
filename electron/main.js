const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const { spawn, exec } = require('child_process');
const fs = require('fs');
const MediaServer = require('./webdav-server');

// Keep a global reference of the window object
let mainWindow = null;
let webviewWindow = null;

// Media server instance
const mediaServer = new MediaServer();

// Determine if we're in development
const isDev = !app.isPackaged;

// Deep link protocol for Trakt OAuth
const PROTOCOL = 'movieapp';

// Set as default protocol client for movieapp:// URLs
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient(PROTOCOL);
}

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine) => {
    // Handle deep link from second instance
    const url = commandLine.find(arg => arg.startsWith(`${PROTOCOL}://`));
    if (url && mainWindow) {
      handleDeepLink(url);
    }
    
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// Handle deep links (Trakt OAuth callback)
function handleDeepLink(url) {
  console.log('Deep link received:', url);
  
  // Parse the URL: movieapp://trakt-callback?code=XXX
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.host === 'trakt-callback') {
      const code = parsedUrl.searchParams.get('code');
      const error = parsedUrl.searchParams.get('error');
      
      if (mainWindow) {
        mainWindow.webContents.send('trakt-callback', { code, error });
      }
    }
  } catch (err) {
    console.error('Failed to parse deep link:', err);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    title: 'MovieHub',
    backgroundColor: '#0a0a0a',
    titleBarStyle: 'hidden',
    frame: false,
    show: false, // Don't show until ready
    icon: path.join(__dirname, '../public/favicon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
  });

  // Set window title explicitly
  mainWindow.setTitle('MovieHub');

  // Show window when ready to prevent flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Load the app - check for dist folder in multiple locations
  if (isDev) {
    // In dev mode, wait for the server and retry
    const loadDevUrl = (retries = 10) => {
      mainWindow.loadURL('http://localhost:5173').catch((err) => {
        if (retries > 0) {
          console.log('Waiting for dev server... retries left:', retries);
          setTimeout(() => loadDevUrl(retries - 1), 1000);
        } else {
          console.error('Failed to connect to dev server:', err);
        }
      });
    };
    loadDevUrl();
    // Open dev tools after a delay
    setTimeout(() => {
      if (mainWindow) mainWindow.webContents.openDevTools();
    }, 2000);
  } else {
    // Production mode - check multiple possible dist locations
    const distPaths = [
      path.join(__dirname, 'dist/index.html'),       // electron/dist (user's setup)
      path.join(__dirname, '../dist/index.html'),    // project root dist
    ];
    
    let indexPath = null;
    for (const p of distPaths) {
      if (fs.existsSync(p)) {
        indexPath = p;
        break;
      }
    }
    
    if (indexPath) {
      mainWindow.loadFile(indexPath);
    } else {
      console.error('Build not found. Run "npm run build" first.');
      dialog.showErrorBox('Build Not Found', 'Please build the app first by running "npm run build" in the project root, then copy the dist folder to the electron folder.');
    }
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Create webview window for download sites
function createWebviewWindow(url) {
  if (webviewWindow) {
    webviewWindow.focus();
    webviewWindow.loadURL(url);
    return;
  }

  webviewWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    parent: mainWindow,
    backgroundColor: '#0a0a0a',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  webviewWindow.loadURL(url);

  // Handle downloads
  webviewWindow.webContents.session.on('will-download', (event, item, webContents) => {
    // Get the user's Videos folder
    const userHome = process.env.USERPROFILE || process.env.HOME;
    const downloadPath = path.join(userHome, 'Videos', 'Movies');

    // Ensure directory exists
    if (!fs.existsSync(downloadPath)) {
      fs.mkdirSync(downloadPath, { recursive: true });
    }

    const fileName = item.getFilename();
    const savePath = path.join(downloadPath, fileName);

    item.setSavePath(savePath);

    item.on('updated', (event, state) => {
      if (state === 'progressing') {
        if (item.isPaused()) {
          console.log('Download paused');
        } else {
          const received = item.getReceivedBytes();
          const total = item.getTotalBytes();
          const percent = total > 0 ? Math.round((received / total) * 100) : 0;
          
          // Send progress to main window
          if (mainWindow) {
            mainWindow.webContents.send('download-progress', {
              fileName,
              percent,
              received,
              total,
            });
          }
        }
      }
    });

    item.once('done', (event, state) => {
      if (state === 'completed') {
        console.log(`Download completed: ${savePath}`);
        if (mainWindow) {
          mainWindow.webContents.send('download-complete', {
            fileName,
            filePath: savePath,
          });
        }
      } else {
        console.log(`Download failed: ${state}`);
      }
    });
  });

  webviewWindow.on('closed', () => {
    webviewWindow = null;
  });
}

// IPC Handlers
ipcMain.handle('select-video-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Video File',
    filters: [
      { name: 'Video Files', extensions: ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm', 'm4v'] },
      { name: 'All Files', extensions: ['*'] },
    ],
    properties: ['openFile'],
  });

  return {
    canceled: result.canceled,
    filePath: result.filePaths[0] || null,
  };
});

ipcMain.handle('launch-player', async (event, { playerPath, filePath }) => {
  try {
    // Validate file exists
    if (!fs.existsSync(filePath)) {
      return { success: false, error: 'Video file not found: ' + filePath };
    }

    // Normalize paths for Windows
    const normalizedPlayerPath = playerPath.replace(/\//g, '\\');
    const normalizedFilePath = filePath.replace(/\//g, '\\');
    
    // Build command with proper argument format
    // Use the format: PlayerPath.exe -"filepath" (dash prefix as specified)
    const args = [`-${normalizedFilePath}`];
    
    console.log('Launching player:', normalizedPlayerPath, 'with args:', args);

    // Try to launch the player
    const playerProcess = spawn(normalizedPlayerPath, args, {
      detached: true,
      stdio: 'ignore',
      shell: true, // Use shell on Windows for better compatibility
    });

    playerProcess.on('error', (err) => {
      console.error('Player spawn error:', err);
    });

    playerProcess.unref();

    return { success: true };
  } catch (error) {
    console.error('Failed to launch player:', error);
    
    // Fallback: try to open with system default
    try {
      await shell.openPath(filePath);
      return { success: true, fallback: true };
    } catch (fallbackError) {
      return { success: false, error: error.message };
    }
  }
});

ipcMain.handle('open-webview', async (event, { url }) => {
  createWebviewWindow(url);
  return { success: true };
});

ipcMain.handle('get-download-path', async () => {
  const userHome = process.env.USERPROFILE || process.env.HOME;
  return path.join(userHome, 'Videos', 'Movies');
});

ipcMain.handle('set-download-path', async (event, customPath) => {
  // Validate the path
  try {
    if (!fs.existsSync(customPath)) {
      fs.mkdirSync(customPath, { recursive: true });
    }
    return { success: true, path: customPath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Window controls (for custom title bar)
ipcMain.on('window-minimize', () => {
  mainWindow?.minimize();
});

ipcMain.on('window-maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.on('window-close', () => {
  mainWindow?.close();
});

// Media server IPC handlers
ipcMain.handle('start-media-server', async () => {
  const url = mediaServer.start();
  return { success: true, url };
});

ipcMain.handle('stop-media-server', async () => {
  mediaServer.stop();
  return { success: true };
});

ipcMain.handle('get-media-server-url', async () => {
  return { url: mediaServer.getServerUrl() };
});

ipcMain.handle('update-media-library', async (event, library) => {
  mediaServer.updateLibrary(library);
  return { success: true };
});

// App lifecycle
app.whenReady().then(() => {
  createWindow();
  
  // Start media server automatically
  const serverUrl = mediaServer.start();
  console.log('Media server started at:', serverUrl);
});

// Handle deep link on macOS
app.on('open-url', (event, url) => {
  event.preventDefault();
  handleDeepLink(url);
});

app.on('window-all-closed', () => {
  // Stop media server when app closes
  mediaServer.stop();
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
