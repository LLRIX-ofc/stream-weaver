// Device detection and platform-specific utilities

// Detect if running on mobile device
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent.toLowerCase();
  const mobileKeywords = [
    'android',
    'webos',
    'iphone',
    'ipad',
    'ipod',
    'blackberry',
    'windows phone',
    'mobile',
  ];
  
  return mobileKeywords.some(keyword => userAgent.includes(keyword));
};

// Detect if running in Electron
export const isElectron = (): boolean => {
  return typeof window !== 'undefined' && window.electronAPI !== undefined;
};

// Expose for import from other modules
export { isElectron as isElectronDevice };

// Detect if this is a host device (PC with Electron)
export const isHostDevice = (): boolean => {
  return isElectron() && !isMobileDevice();
};

// Detect if this is an access device (mobile or non-Electron browser)
export const isAccessDevice = (): boolean => {
  return !isHostDevice();
};

// Get device type for display
export const getDeviceType = (): 'host' | 'access' => {
  return isHostDevice() ? 'host' : 'access';
};

// Infuse API for mobile playback
// Documentation: https://support.firecore.com/hc/en-us/articles/215090997-API-for-Third-Party-Apps-Services
export const launchInfuse = (url: string): void => {
  // Infuse uses the infuse:// URL scheme
  // Format: infuse://x-callback-url/play?url=<encoded_url>
  const infuseUrl = `infuse://x-callback-url/play?url=${encodeURIComponent(url)}`;
  window.location.href = infuseUrl;
};

// Launch media playback based on device type
export const launchMediaPlayback = async (
  filePath: string,
  playerPath: string,
  mediaServerUrl?: string
): Promise<{ success: boolean; error?: string }> => {
  // Mobile device - use Infuse
  if (isMobileDevice()) {
    if (!mediaServerUrl) {
      return { 
        success: false, 
        error: 'No media server URL available. Connect to a host device first.' 
      };
    }
    
    // Construct streaming URL from media server
    const streamUrl = `${mediaServerUrl}/${encodeURIComponent(filePath)}`;
    launchInfuse(streamUrl);
    return { success: true };
  }
  
  // Desktop with Electron - use native player
  if (isElectron() && window.electronAPI) {
    return window.electronAPI.launchPlayer(playerPath, filePath);
  }
  
  // Browser fallback
  return { 
    success: false, 
    error: 'Playback requires either the Electron app or a mobile device with Infuse.' 
  };
};

// VLC URL scheme for fallback on mobile
export const launchVLC = (url: string): void => {
  const vlcUrl = `vlc://${url}`;
  window.location.href = vlcUrl;
};

// Check if Infuse is likely available (iOS/tvOS)
export const isInfuseAvailable = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod') || ua.includes('mac');
};
