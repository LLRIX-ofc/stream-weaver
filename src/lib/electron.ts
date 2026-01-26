// Type definitions for Electron API exposed via preload
interface ElectronAPI {
  selectVideoFile: () => Promise<{ canceled: boolean; filePath: string | null }>;
  launchPlayer: (playerPath: string, filePath: string) => Promise<{ success: boolean; fallback?: boolean; error?: string }>;
  openWebview: (url: string) => Promise<{ success: boolean }>;
  getDownloadPath: () => Promise<string>;
  setDownloadPath: (path: string) => Promise<{ success: boolean; path?: string; error?: string }>;
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  onDownloadProgress: (callback: (data: { fileName: string; percent: number; received: number; total: number }) => void) => () => void;
  onDownloadComplete: (callback: (data: { fileName: string; filePath: string }) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

// Helper to check if running in Electron
export const isElectron = (): boolean => {
  return typeof window !== 'undefined' && window.electronAPI !== undefined;
};

// File selection with Electron fallback
export const selectVideoFile = async (): Promise<{ canceled: boolean; filePath: string | null }> => {
  if (isElectron() && window.electronAPI) {
    return window.electronAPI.selectVideoFile();
  }
  
  // Fallback for browser: use file input
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*,.mp4,.mkv,.avi,.mov,.wmv,.flv,.webm';
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // In browser, we can only get the file name, not the full path
        resolve({
          canceled: false,
          filePath: file.name,
        });
      } else {
        resolve({ canceled: true, filePath: null });
      }
    };
    
    input.oncancel = () => {
      resolve({ canceled: true, filePath: null });
    };
    
    input.click();
  });
};

// Launch video player
export const launchPlayer = async (playerPath: string, filePath: string): Promise<{ success: boolean; error?: string }> => {
  if (isElectron() && window.electronAPI) {
    return window.electronAPI.launchPlayer(playerPath, filePath);
  }
  
  // Browser fallback: show alert with info
  console.log(`Would launch: ${playerPath} -${filePath}`);
  return {
    success: false,
    error: 'Player launch requires the Electron app. Running in browser mode.',
  };
};

// Open webview for downloads
export const openWebview = async (url: string): Promise<void> => {
  if (isElectron() && window.electronAPI) {
    await window.electronAPI.openWebview(url);
  } else {
    // Browser fallback: open in new tab
    window.open(url, '_blank');
  }
};

// Get download path
export const getDownloadPath = async (): Promise<string> => {
  if (isElectron() && window.electronAPI) {
    return window.electronAPI.getDownloadPath();
  }
  return 'C:\\Users\\{USER}\\Videos\\Movies';
};

// Subscribe to download events
export const subscribeToDownloads = (
  onProgress: (data: { fileName: string; percent: number }) => void,
  onComplete: (data: { fileName: string; filePath: string }) => void
): (() => void) => {
  if (isElectron() && window.electronAPI) {
    const unsubProgress = window.electronAPI.onDownloadProgress(onProgress);
    const unsubComplete = window.electronAPI.onDownloadComplete(onComplete);
    
    return () => {
      unsubProgress();
      unsubComplete();
    };
  }
  
  return () => {};
};
