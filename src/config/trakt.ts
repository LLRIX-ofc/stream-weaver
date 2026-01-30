// Trakt API Configuration
// These values should be set before building the app for production
// Get your Client ID and Secret from https://trakt.tv/oauth/applications

// IMPORTANT: Replace these with your actual Trakt API credentials before building
export const TRAKT_CLIENT_ID = import.meta.env.VITE_TRAKT_CLIENT_ID || 'YOUR_TRAKT_CLIENT_ID';
export const TRAKT_CLIENT_SECRET = import.meta.env.VITE_TRAKT_CLIENT_SECRET || 'YOUR_TRAKT_CLIENT_SECRET';

// Redirect URI for OAuth callback
// For Electron, use the deep link protocol
export const TRAKT_REDIRECT_URI = 'movieapp://trakt-callback';

// For browser/mobile, use web callback
export const getTraktRedirectUri = (): string => {
  // Check if we're in Electron (desktop app)
  if (typeof window !== 'undefined' && window.electronAPI) {
    return TRAKT_REDIRECT_URI;
  }
  
  // Browser/mobile fallback - use current origin with hash router callback
  if (typeof window !== 'undefined') {
    // For mobile PWA or browser, use the web callback
    const origin = window.location.origin;
    const pathname = window.location.pathname.replace(/\/$/, '');
    return `${origin}${pathname}#/trakt-callback`;
  }
  
  return TRAKT_REDIRECT_URI;
};

// Check if current device can use deep links (Electron only)
export const canUseDeepLink = (): boolean => {
  return typeof window !== 'undefined' && window.electronAPI !== undefined;
};

// Validate credentials are configured
export const isTraktConfigured = (): boolean => {
  return (
    TRAKT_CLIENT_ID !== 'YOUR_TRAKT_CLIENT_ID' && 
    TRAKT_CLIENT_ID.length > 10 &&
    TRAKT_CLIENT_SECRET !== 'YOUR_TRAKT_CLIENT_SECRET' &&
    TRAKT_CLIENT_SECRET.length > 10
  );
};
