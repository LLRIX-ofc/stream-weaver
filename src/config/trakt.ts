// Trakt API Configuration
// These values should be set before building the app for production
// Get your Client ID and Secret from https://trakt.tv/oauth/applications

// IMPORTANT: Replace these with your actual Trakt API credentials before building
export const TRAKT_CLIENT_ID = import.meta.env.VITE_TRAKT_CLIENT_ID || 'YOUR_TRAKT_CLIENT_ID';
export const TRAKT_CLIENT_SECRET = import.meta.env.VITE_TRAKT_CLIENT_SECRET || 'YOUR_TRAKT_CLIENT_SECRET';

// Redirect URI for OAuth callback
// For Electron, use the deep link protocol
export const TRAKT_REDIRECT_URI = 'movieapp://trakt-callback';

// For browser development, use the current origin
export const getTraktRedirectUri = (): string => {
  // Check if we're in Electron
  if (typeof window !== 'undefined' && window.electronAPI) {
    return TRAKT_REDIRECT_URI;
  }
  
  // Browser fallback - use current origin
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/#/trakt-callback`;
  }
  
  return TRAKT_REDIRECT_URI;
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
