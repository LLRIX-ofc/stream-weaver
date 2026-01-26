# MovieHub Electron Helper

This folder contains the Electron main process code that provides native functionality for the MovieHub app.

## Features

- **Native File Dialogs**: Full path access when selecting video files
- **Download Management**: Intercepts downloads and saves to custom location
- **Player Integration**: Launches external video player (EnergyPlayer) with file paths
- **WebView Support**: Embedded browser for download sites

## Setup

1. Install Electron dependencies:
```bash
npm install electron electron-builder --save-dev
```

2. Add these scripts to your package.json:
```json
{
  "scripts": {
    "electron": "electron electron/main.js",
    "electron:dev": "concurrently \"npm run dev\" \"wait-on http://localhost:5173 && electron electron/main.js\"",
    "electron:build": "npm run build && electron-builder"
  }
}
```

3. Add Electron config to package.json:
```json
{
  "main": "electron/main.js",
  "build": {
    "appId": "com.moviehub.app",
    "productName": "MovieHub",
    "directories": {
      "output": "dist-electron"
    },
    "files": [
      "dist/**/*",
      "electron/**/*"
    ],
    "win": {
      "target": "nsis"
    }
  }
}
```

## File Structure

- `main.js` - Main process entry point
- `preload.js` - Preload script for IPC communication
- `ipc-handlers.js` - IPC handlers for various native operations

## IPC Channels

### `select-video-file`
Opens native file dialog for video file selection.
Returns: `{ canceled: boolean, filePath?: string }`

### `launch-player`
Launches the video player with specified file.
Args: `{ playerPath: string, filePath: string }`

### `download-file`
Downloads a file to the specified location.
Args: `{ url: string, savePath: string }`

### `open-webview`
Opens a URL in a webview window.
Args: `{ url: string }`
