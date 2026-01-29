import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

// This page handles the Trakt OAuth callback
// Works with HashRouter - URL will be: /#/trakt-callback?code=XXX
const TraktCallback: React.FC = () => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Get the authorization code from URL params (works with HashRouter)
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    // Also check for legacy URL search params (for browser popup mode)
    const legacyParams = new URLSearchParams(window.location.search);
    const legacyCode = legacyParams.get('code') || code;
    const legacyError = legacyParams.get('error') || error;

    if (legacyCode) {
      // Send the code back to the opener window
      if (window.opener) {
        window.opener.postMessage({ type: 'trakt-callback', code: legacyCode }, window.location.origin);
      }
    } else if (legacyError) {
      if (window.opener) {
        window.opener.postMessage({ type: 'trakt-callback', error: legacyError }, window.location.origin);
      }
    }

    // Close this window after a short delay
    setTimeout(() => {
      window.close();
    }, 1000);
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center animate-fade-in">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-foreground mb-3">Connecting to Trakt...</h1>
        <p className="text-muted-foreground">This window will close automatically.</p>
      </div>
    </div>
  );
};

export default TraktCallback;
