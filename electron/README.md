# Movie Discovery App - Electron Helper

This folder contains the Electron main process code that provides native functionality for the Movie Discovery App.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

## Setup

1. Navigate to the electron folder:
   ```bash
   cd electron
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the web app first (from the project root):
   ```bash
   cd ..
   npm run build
   ```

4. Run the Electron app:
   ```bash
   cd electron
   npm start
   ```

## Development Mode

For development with hot reload:

1. Start the Vite dev server (from project root):
   ```bash
   npm run dev
   ```

2. In another terminal, run Electron:
   ```bash
   cd electron
   npm start
   ```

The Electron app will automatically connect to `http://localhost:5173` in development mode and retry if the server isn't ready yet.

## Features Provided by Electron

- **Custom frameless window** with custom title bar controls
- **Native file dialogs** for selecting video files with full path access
- **External player launch** - Launches EnergyPlayer.exe with video file path using `-filepath` format
- **Download management** - Webview for download sites with automatic file saving
- **System integration** - Downloads saved to `C:\Users\{USER}\Videos\Movies`

## IPC Channels

### `select-video-file`
Opens native file dialog for video file selection.
Returns: `{ canceled: boolean, filePath?: string }`

### `launch-player`
Launches the video player with specified file.
Args: `{ playerPath: string, filePath: string }`

### `open-webview`
Opens a URL in a webview window.
Args: `{ url: string }`

### `get-download-path`
Returns the current download path.

### `set-download-path`
Sets a custom download path.
Args: `path: string`

### Window Controls
- `window-minimize` - Minimizes the window
- `window-maximize` - Toggles maximize/restore
- `window-close` - Closes the window

## Packaging for Distribution

To create a distributable package:

1. Install electron-builder globally or as dev dependency:
   ```bash
   npm install -g electron-builder
   ```

2. Build the app:
   ```bash
   electron-builder
   ```

## Troubleshooting

### App shows blank screen
- Make sure you built the web app first (`npm run build` from root)
- In development, ensure the Vite dev server is running on port 5173
- The app will retry connecting to the dev server for up to 10 seconds

### Player doesn't launch
- Ensure EnergyPlayer.exe is in your system PATH or provide the full path in settings
- The app will fall back to the system default player if EnergyPlayer is not found
- Check that the video file path is valid and the file exists

### Downloads not working
- Check that the download folder exists and is writable
- The app will create `C:\Users\{USER}\Videos\Movies` if it doesn't exist

### Single Instance
- The app prevents multiple instances from running
- If you try to open it again, the existing window will be focused
