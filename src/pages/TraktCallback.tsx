import React, { useEffect } from 'react';

// This page handles the Trakt OAuth callback
const TraktCallback: React.FC = () => {
  useEffect(() => {
    // Get the authorization code from URL
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const error = params.get('error');

    if (code) {
      // Send the code back to the opener window
      if (window.opener) {
        window.opener.postMessage({ type: 'trakt-callback', code }, window.location.origin);
      }
    } else if (error) {
      if (window.opener) {
        window.opener.postMessage({ type: 'trakt-callback', error }, window.location.origin);
      }
    }

    // Close this window after a short delay
    setTimeout(() => {
      window.close();
    }, 1000);
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-foreground mb-2">Connecting to Trakt...</h1>
        <p className="text-muted-foreground">This window will close automatically.</p>
      </div>
    </div>
  );
};

export default TraktCallback;
