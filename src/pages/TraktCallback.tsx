import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { traktService } from '@/services/trakt';
import { getTraktRedirectUri, TRAKT_CLIENT_ID, TRAKT_CLIENT_SECRET, isTraktConfigured } from '@/config/trakt';
import { Check, AlertCircle } from 'lucide-react';

// This page handles the Trakt OAuth callback
// Works with HashRouter - URL will be: /#/trakt-callback?code=XXX
const TraktCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      // Get the authorization code from URL params (works with HashRouter)
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      // Also check for legacy URL search params (for browser popup mode)
      const legacyParams = new URLSearchParams(window.location.search);
      const legacyCode = legacyParams.get('code') || code;
      const legacyError = legacyParams.get('error') || error;

      if (legacyError) {
        setStatus('error');
        setErrorMessage(legacyError);
        
        // If this is a popup, send error back to opener
        if (window.opener) {
          window.opener.postMessage({ type: 'trakt-callback', error: legacyError }, window.location.origin);
          setTimeout(() => window.close(), 2000);
        }
        return;
      }

      if (legacyCode) {
        // Check if we have an opener (popup mode)
        if (window.opener) {
          // Send the code back to the opener window
          window.opener.postMessage({ type: 'trakt-callback', code: legacyCode }, window.location.origin);
          setStatus('success');
          setTimeout(() => window.close(), 1000);
          return;
        }

        // No opener - we're in mobile/redirect mode
        // Exchange the code ourselves and redirect to home
        try {
          // Initialize Trakt with credentials if not done
          if (isTraktConfigured()) {
            traktService.setCredentials(TRAKT_CLIENT_ID, TRAKT_CLIENT_SECRET);
          }

          const redirectUri = getTraktRedirectUri();
          const success = await traktService.exchangeCode(legacyCode, redirectUri);

          if (success) {
            setStatus('success');
            // Redirect to home after successful auth
            setTimeout(() => {
              navigate('/', { replace: true });
            }, 1500);
          } else {
            setStatus('error');
            setErrorMessage('Failed to exchange authorization code');
          }
        } catch (err) {
          console.error('Trakt callback error:', err);
          setStatus('error');
          setErrorMessage(err instanceof Error ? err.message : 'Unknown error');
        }
      } else {
        setStatus('error');
        setErrorMessage('No authorization code received');
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center animate-fade-in max-w-sm">
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-foreground mb-3">Connecting to Trakt...</h1>
            <p className="text-muted-foreground">Please wait while we complete the authentication.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-scale-in">
              <Check className="w-8 h-8 text-success" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-3">Connected Successfully!</h1>
            <p className="text-muted-foreground">Redirecting you back to the app...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-scale-in">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-3">Connection Failed</h1>
            <p className="text-muted-foreground mb-4">{errorMessage}</p>
            <button
              onClick={() => navigate('/', { replace: true })}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Return Home
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default TraktCallback;