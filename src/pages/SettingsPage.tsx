import React, { useState, useEffect } from 'react';
import { Settings, FolderOpen, Play, Monitor, Info, Trash2, Link2, Check, ExternalLink, Loader2, Server, Smartphone, HelpCircle } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { traktService } from '@/services/trakt';
import { TRAKT_CLIENT_ID, TRAKT_CLIENT_SECRET, isTraktConfigured, getTraktRedirectUri } from '@/config/trakt';
import { MediaServerGuide } from '@/components/MediaServerGuide';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { isElectron } from '@/lib/electron';
import { isMobileDevice, isHostDevice, getDeviceType } from '@/lib/device';
import { cn } from '@/lib/utils';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, library, wishlist } = useApp();
  
  // Trakt state
  const [traktAuthenticated, setTraktAuthenticated] = useState(false);
  const [traktLoading, setTraktLoading] = useState(false);
  const [traktError, setTraktError] = useState('');
  
  // Media server
  const [showServerGuide, setShowServerGuide] = useState(false);
  const [serverUrl, setServerUrl] = useState('http://localhost:8765');

  // Device info
  const deviceType = getDeviceType();
  const isMobile = isMobileDevice();
  const isElectronApp = isElectron();
  const traktConfigValid = isTraktConfigured();

  // Initialize Trakt with build-time credentials and check auth
  useEffect(() => {
    if (traktConfigValid) {
      traktService.setCredentials(TRAKT_CLIENT_ID, TRAKT_CLIENT_SECRET);
    }
    // Force reload from localStorage to ensure we have latest state
    traktService.reloadConfig();
    setTraktAuthenticated(traktService.isAuthenticated());
  }, [traktConfigValid]);

  // Re-check auth status when page becomes visible (e.g., after redirect)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        traktService.reloadConfig();
        setTraktAuthenticated(traktService.isAuthenticated());
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Get media server URL
  useEffect(() => {
    const getServerUrl = async () => {
      if (isElectronApp && window.electronAPI?.getMediaServerUrl) {
        const result = await window.electronAPI.getMediaServerUrl();
        if (result.url) {
          setServerUrl(result.url);
        }
      }
    };
    getServerUrl();
  }, [isElectronApp]);

  // Listen for Trakt OAuth callback (Electron deep link)
  useEffect(() => {
    if (isElectronApp && window.electronAPI?.onTraktCallback) {
      const unsubscribe = window.electronAPI.onTraktCallback(async (data) => {
        if (data.code) {
          setTraktLoading(true);
          setTraktError('');
          const redirectUri = getTraktRedirectUri();
          const success = await traktService.exchangeCode(data.code, redirectUri);
          setTraktLoading(false);
          
          if (success) {
            setTraktAuthenticated(true);
            setTraktError('');
          } else {
            setTraktError('Failed to authenticate with Trakt. Please check your Client ID and Secret.');
          }
        } else if (data.error) {
          setTraktError(`Trakt authentication error: ${data.error}`);
          setTraktLoading(false);
        }
      });

      return unsubscribe;
    }
  }, [isElectronApp]);

  const handleClearLibrary = () => {
    if (confirm(`Are you sure you want to clear all ${library.length} items from your library? This cannot be undone.`)) {
      localStorage.removeItem('movieapp_library');
      window.location.reload();
    }
  };

  const handleClearWishlist = () => {
    if (confirm(`Are you sure you want to clear all ${wishlist.length} items from your wishlist? This cannot be undone.`)) {
      localStorage.removeItem('movieapp_wishlist');
      window.location.reload();
    }
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all app data? This will reset your library, wishlist, and settings.')) {
      localStorage.removeItem('movieapp_library');
      localStorage.removeItem('movieapp_wishlist');
      localStorage.removeItem('movieapp_settings');
      localStorage.removeItem('movieapp_trakt');
      window.location.reload();
    }
  };

  const handleTraktAuth = () => {
    if (!traktConfigValid) {
      setTraktError('Trakt credentials not configured. Please set VITE_TRAKT_CLIENT_ID and VITE_TRAKT_CLIENT_SECRET before building.');
      return;
    }

    const redirectUri = getTraktRedirectUri();
    const authUrl = traktService.getAuthUrl(redirectUri);
    
    if (isElectronApp) {
      // Open in default browser - Electron will handle the deep link callback
      window.open(authUrl, '_blank');
      setTraktLoading(true);
    } else {
      // Open auth in popup for browser mode
      const authWindow = window.open(authUrl, 'trakt-auth', 'width=600,height=700');
      
      const handleMessage = async (event: MessageEvent) => {
        if (event.data?.type === 'trakt-callback' && event.data?.code) {
          setTraktLoading(true);
          const success = await traktService.exchangeCode(event.data.code, redirectUri);
          setTraktLoading(false);
          
          if (success) {
            setTraktAuthenticated(true);
            setTraktError('');
          } else {
            setTraktError('Failed to authenticate with Trakt');
          }
          
          window.removeEventListener('message', handleMessage);
          authWindow?.close();
        }
      };
      
      window.addEventListener('message', handleMessage);
    }
  };

  const handleTraktDisconnect = () => {
    if (confirm('Are you sure you want to disconnect from Trakt?')) {
      traktService.disconnect();
      setTraktAuthenticated(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 md:pt-24 px-4 md:px-12 pb-24 md:pb-8">
      {/* Header */}
      <div className="max-w-3xl mx-auto mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="w-8 h-8 text-primary animate-pulse" />
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Settings</h1>
        </div>
        <p className="text-muted-foreground">
          Customize your MovieHub experience
        </p>
      </div>

      {/* Settings Sections */}
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Device Info */}
        <section className="p-6 rounded-xl bg-card border border-border transition-all duration-300 hover:shadow-lg hover:border-primary/30">
          <div className="flex items-center gap-2 mb-4">
            {isMobile ? (
              <Smartphone className="w-5 h-5 text-primary" />
            ) : (
              <Monitor className="w-5 h-5 text-primary" />
            )}
            <h2 className="text-lg font-semibold text-foreground">Device Info</h2>
            <span className={cn(
              'ml-auto px-3 py-1 rounded-full text-xs font-semibold transition-all',
              deviceType === 'host' 
                ? 'bg-gradient-to-r from-primary/20 to-primary/10 text-primary border border-primary/30' 
                : 'bg-secondary text-secondary-foreground'
            )}>
              {deviceType === 'host' ? '🖥️ Host Device' : '📱 Access Device'}
            </span>
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">Platform:</span>{' '}
              {isMobile ? 'Mobile' : 'Desktop'}
            </p>
            <p>
              <span className="font-medium text-foreground">Electron:</span>{' '}
              {isElectronApp ? 'Yes (Full Features)' : 'No (Browser Mode)'}
            </p>
            <p>
              <span className="font-medium text-foreground">Role:</span>{' '}
              {deviceType === 'host' 
                ? 'This device can host the media server and run the full app' 
                : 'This device can connect to a host device for media streaming'}
            </p>
          </div>
        </section>

        {/* Trakt Integration */}
        <section className="p-6 rounded-xl bg-card border border-border transition-all duration-300 hover:shadow-lg hover:border-primary/30">
          <div className="flex items-center gap-2 mb-4">
            <Link2 className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Trakt.tv Integration</h2>
            {traktAuthenticated && (
              <span className="ml-auto px-3 py-1 rounded-full bg-success/20 text-success text-xs font-semibold flex items-center gap-1 border border-success/30">
                <Check className="w-3 h-3" />
                Connected
              </span>
            )}
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            Sync your watchlist and watch history across devices with Trakt.tv.
          </p>

          {!traktConfigValid && (
            <div className="mb-4 p-4 rounded-lg bg-warning/10 border border-warning/30 text-sm">
              <p className="font-medium text-foreground mb-2">⚠️ Trakt Not Configured</p>
              <p className="text-muted-foreground mb-2">
                To enable Trakt integration, set these environment variables before building:
              </p>
              <code className="block text-xs text-muted-foreground bg-background/50 p-2 rounded font-mono">
                VITE_TRAKT_CLIENT_ID=your_client_id<br />
                VITE_TRAKT_CLIENT_SECRET=your_client_secret
              </code>
              <a 
                href="https://trakt.tv/oauth/applications/new" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline mt-2 inline-flex items-center gap-1 text-xs"
              >
                Create a Trakt app <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {traktError && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
              {traktError}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {!traktAuthenticated ? (
              <Button 
                onClick={handleTraktAuth} 
                disabled={traktLoading || !traktConfigValid}
                className="gap-2 transition-all duration-300 hover:scale-105"
              >
                {traktLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Link2 className="w-4 h-4" />
                    Sign in with Trakt
                  </>
                )}
              </Button>
            ) : (
              <Button 
                variant="outline" 
                onClick={handleTraktDisconnect}
                className="gap-2"
              >
                Disconnect from Trakt
              </Button>
            )}
          </div>
        </section>

        {/* Playback Settings - only show on non-mobile */}
        {!isMobile && (
          <section className="p-6 rounded-xl bg-card border border-border transition-all duration-300 hover:shadow-lg hover:border-primary/30">
            <div className="flex items-center gap-2 mb-4">
              <Play className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Playback</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 transition-colors hover:bg-secondary">
                <div>
                  <Label className="text-foreground">Auto-play trailers</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically play trailers when viewing details
                  </p>
                </div>
                <Switch
                  checked={settings.autoPlay}
                  onCheckedChange={(checked) => updateSettings({ autoPlay: checked })}
                />
              </div>

              <div>
                <Label className="text-foreground mb-2 block">Player Path</Label>
                <Input
                  value={settings.playerPath}
                  onChange={(e) => updateSettings({ playerPath: e.target.value })}
                  placeholder="EnergyPlayer.exe"
                  className="bg-secondary border-border transition-all focus:ring-2 focus:ring-primary/50"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  The video player executable used for library playback
                </p>
              </div>

              <div>
                <Label className="text-foreground mb-2 block">Default Quality</Label>
                <Select
                  value={settings.defaultQuality}
                  onValueChange={(v) => updateSettings({ defaultQuality: v as any })}
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto</SelectItem>
                    <SelectItem value="720p">720p</SelectItem>
                    <SelectItem value="1080p">1080p</SelectItem>
                    <SelectItem value="4k">4K</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>
        )}

        {/* Mobile Playback Info */}
        {isMobile && (
          <section className="p-6 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/30">
            <div className="flex items-center gap-2 mb-4">
              <Smartphone className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Mobile Playback</h2>
            </div>

            <p className="text-muted-foreground mb-4">
              On mobile devices, playback uses the Infuse app. Make sure you have Infuse installed for the best experience.
            </p>

            <Button
              variant="outline"
              className="w-full gap-2 transition-all hover:bg-primary hover:text-primary-foreground"
              onClick={() => window.open('https://apps.apple.com/app/infuse-7/id1136220934', '_blank')}
            >
              <ExternalLink className="w-4 h-4" />
              Get Infuse from App Store
            </Button>
          </section>
        )}

        {/* Download Settings - only on desktop */}
        {!isMobile && (
          <section className="p-6 rounded-xl bg-card border border-border transition-all duration-300 hover:shadow-lg hover:border-primary/30">
            <div className="flex items-center gap-2 mb-4">
              <FolderOpen className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Downloads</h2>
            </div>

            <div>
              <Label className="text-foreground mb-2 block">Download Location</Label>
              <Input
                value={settings.downloadPath}
                onChange={(e) => updateSettings({ downloadPath: e.target.value })}
                placeholder="C:\Users\{USER}\Videos\Movies"
                className="bg-secondary border-border"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Where downloaded movies will be saved (requires Electron helper)
              </p>
            </div>
          </section>
        )}

        {/* Media Server Info - only on host devices */}
        {isElectronApp && !isMobile && (
          <section className="p-6 rounded-xl bg-gradient-to-br from-card to-secondary/30 border border-border transition-all duration-300 hover:shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <Server className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Media Server</h2>
              <span className="ml-auto px-3 py-1 rounded-full bg-success/20 text-success text-xs font-semibold flex items-center gap-1.5 border border-success/30">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                Running
              </span>
            </div>

            <p className="text-muted-foreground mb-4">
              The built-in media server allows other devices on your network to stream content from your library.
            </p>

            <div className="p-3 rounded-lg bg-secondary/50 text-sm mb-4">
              <p className="font-medium text-foreground mb-1">Server URL:</p>
              <code className="text-primary font-mono">{serverUrl}</code>
            </div>

            <Button 
              variant="outline" 
              className="w-full gap-2"
              onClick={() => setShowServerGuide(true)}
            >
              <HelpCircle className="w-4 h-4" />
              How to Connect in Infuse
            </Button>
          </section>
        )}

        {/* Data Management */}
        <section className="p-6 rounded-xl bg-card border border-border transition-all duration-300 hover:shadow-lg hover:border-primary/30">
          <div className="flex items-center gap-2 mb-4">
            <Trash2 className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Data Management</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 transition-colors hover:bg-secondary">
              <div>
                <p className="font-medium text-foreground">Library</p>
                <p className="text-sm text-muted-foreground">{library.length} items</p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleClearLibrary}
                disabled={library.length === 0}
                className="transition-all hover:scale-105"
              >
                Clear
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 transition-colors hover:bg-secondary">
              <div>
                <p className="font-medium text-foreground">Wishlist</p>
                <p className="text-sm text-muted-foreground">{wishlist.length} items</p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleClearWishlist}
                disabled={wishlist.length === 0}
                className="transition-all hover:scale-105"
              >
                Clear
              </Button>
            </div>

            <div className="pt-4 border-t border-border">
              <Button variant="destructive" onClick={handleClearAll} className="w-full transition-all hover:scale-[1.02]">
                Reset All App Data
              </Button>
              <p className="text-sm text-muted-foreground mt-2 text-center">
                This will clear your library, wishlist, and all settings
              </p>
            </div>
          </div>
        </section>

        {/* About */}
        <section className="p-6 rounded-xl bg-card border border-border transition-all duration-300 hover:shadow-lg hover:border-primary/30">
          <div className="flex items-center gap-2 mb-4">
            <Info className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">About</h2>
          </div>

          <div className="space-y-2">
            <p className="text-muted-foreground">
              <span className="font-bold text-foreground bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">MovieHub</span> - Movie & TV Discovery App
            </p>
            <p className="text-sm text-muted-foreground">Version 1.0.0</p>
            <p className="text-sm text-muted-foreground">
              Powered by TMDB API for movie and TV show data.
            </p>
          </div>
        </section>

        {/* Electron Helper Info - only on desktop browser */}
        {!isMobile && !isElectronApp && (
          <section className="p-6 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/30">
            <div className="flex items-center gap-2 mb-4">
              <Monitor className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Electron Helper</h2>
            </div>

            <p className="text-muted-foreground mb-4">
              For full functionality including file downloads, video playback integration, and native file system access, run this app with the Electron helper.
            </p>

            <div className="p-3 rounded-lg bg-card text-sm font-mono text-muted-foreground overflow-x-auto border border-border">
              cd electron && npm install && npm start
            </div>
          </section>
        )}
      </div>

      {/* Media Server Guide Modal */}
      <MediaServerGuide 
        isOpen={showServerGuide}
        onClose={() => setShowServerGuide(false)}
        serverUrl={serverUrl}
      />
    </div>
  );
};
