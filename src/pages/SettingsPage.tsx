import React, { useState, useEffect } from 'react';
import { Settings, FolderOpen, Play, Monitor, Info, Trash2, Link2, Check, ExternalLink, Loader2, Server, Smartphone } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { traktService, TRAKT_REDIRECT_URI } from '@/services/trakt';
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
  const [traktClientId, setTraktClientId] = useState('');
  const [traktClientSecret, setTraktClientSecret] = useState('');
  const [traktConfigured, setTraktConfigured] = useState(false);
  const [traktAuthenticated, setTraktAuthenticated] = useState(false);
  const [traktLoading, setTraktLoading] = useState(false);
  const [traktError, setTraktError] = useState('');

  // Device info
  const deviceType = getDeviceType();
  const isMobile = isMobileDevice();
  const isElectronApp = isElectron();

  // Load Trakt config on mount
  useEffect(() => {
    const config = traktService.getConfig();
    if (config) {
      setTraktClientId(config.clientId || '');
      setTraktClientSecret(config.clientSecret || '');
      setTraktConfigured(traktService.isConfigured());
      setTraktAuthenticated(traktService.isAuthenticated());
    }
  }, []);

  // Listen for Trakt OAuth callback (Electron deep link)
  useEffect(() => {
    if (isElectronApp && window.electronAPI?.onTraktCallback) {
      const unsubscribe = window.electronAPI.onTraktCallback(async (data) => {
        if (data.code) {
          setTraktLoading(true);
          const success = await traktService.exchangeCode(data.code, TRAKT_REDIRECT_URI);
          setTraktLoading(false);
          
          if (success) {
            setTraktAuthenticated(true);
            setTraktError('');
          } else {
            setTraktError('Failed to authenticate with Trakt');
          }
        } else if (data.error) {
          setTraktError(`Trakt authentication error: ${data.error}`);
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

  const handleSaveTraktCredentials = () => {
    if (!traktClientId.trim() || !traktClientSecret.trim()) {
      setTraktError('Please enter both Client ID and Client Secret');
      return;
    }
    
    traktService.setCredentials(traktClientId.trim(), traktClientSecret.trim());
    setTraktConfigured(true);
    setTraktError('');
  };

  const handleTraktAuth = () => {
    // For Electron, use deep link redirect
    // For browser, use popup window
    const redirectUri = isElectronApp ? TRAKT_REDIRECT_URI : window.location.origin + '/trakt-callback';
    const authUrl = traktService.getAuthUrl(redirectUri);
    
    if (isElectronApp) {
      // Open in default browser - Electron will handle the deep link callback
      window.open(authUrl, '_blank');
    } else {
      // Open auth in popup
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

  const handleClearTraktConfig = () => {
    if (confirm('Are you sure you want to clear Trakt configuration?')) {
      traktService.clearConfig();
      setTraktClientId('');
      setTraktClientSecret('');
      setTraktConfigured(false);
      setTraktAuthenticated(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 md:pt-24 px-4 md:px-12 pb-24 md:pb-8">
      {/* Header */}
      <div className="max-w-3xl mx-auto mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="w-8 h-8 text-primary" />
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Settings</h1>
        </div>
        <p className="text-muted-foreground">
          Customize your MovieHub experience
        </p>
      </div>

      {/* Settings Sections */}
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Device Info */}
        <section className="p-6 rounded-lg bg-card border border-border">
          <div className="flex items-center gap-2 mb-4">
            {isMobile ? (
              <Smartphone className="w-5 h-5 text-primary" />
            ) : (
              <Monitor className="w-5 h-5 text-primary" />
            )}
            <h2 className="text-lg font-semibold text-foreground">Device Info</h2>
            <span className={cn(
              'ml-auto px-2 py-0.5 rounded-full text-xs font-medium',
              deviceType === 'host' ? 'bg-primary/20 text-primary' : 'bg-secondary text-secondary-foreground'
            )}>
              {deviceType === 'host' ? 'Host Device' : 'Access Device'}
            </span>
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">Platform:</span>{' '}
              {isMobile ? 'Mobile' : 'Desktop'}
            </p>
            <p>
              <span className="font-medium text-foreground">Electron:</span>{' '}
              {isElectronApp ? 'Yes' : 'No (Browser Mode)'}
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
        <section className="p-6 rounded-lg bg-card border border-border">
          <div className="flex items-center gap-2 mb-4">
            <Link2 className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Trakt.tv Integration</h2>
            {traktAuthenticated && (
              <span className="ml-auto px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium flex items-center gap-1">
                <Check className="w-3 h-3" />
                Connected
              </span>
            )}
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            Connect to Trakt.tv to sync your watchlist and watch history across devices.
            <a 
              href="https://trakt.tv/oauth/applications/new" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline ml-1 inline-flex items-center gap-1"
            >
              Create a Trakt app <ExternalLink className="w-3 h-3" />
            </a>
          </p>

          {isElectronApp && (
            <div className="mb-4 p-3 rounded-lg bg-secondary/50 text-sm">
              <p className="font-medium text-foreground mb-1">Redirect URI for Trakt App:</p>
              <code className="text-xs text-muted-foreground bg-background px-2 py-1 rounded">
                {TRAKT_REDIRECT_URI}
              </code>
            </div>
          )}

          {traktError && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {traktError}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <Label className="text-foreground mb-2 block">Client ID</Label>
              <Input
                value={traktClientId}
                onChange={(e) => setTraktClientId(e.target.value)}
                placeholder="Enter your Trakt Client ID"
                className="bg-secondary border-border font-mono text-sm"
                disabled={traktAuthenticated}
              />
            </div>

            <div>
              <Label className="text-foreground mb-2 block">Client Secret</Label>
              <Input
                type="password"
                value={traktClientSecret}
                onChange={(e) => setTraktClientSecret(e.target.value)}
                placeholder="Enter your Trakt Client Secret"
                className="bg-secondary border-border font-mono text-sm"
                disabled={traktAuthenticated}
              />
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {!traktConfigured ? (
                <Button onClick={handleSaveTraktCredentials}>
                  Save Credentials
                </Button>
              ) : !traktAuthenticated ? (
                <>
                  <Button onClick={handleTraktAuth} disabled={traktLoading}>
                    {traktLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      'Sign in with Trakt'
                    )}
                  </Button>
                  <Button variant="outline" onClick={handleClearTraktConfig}>
                    Clear Config
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={handleTraktDisconnect}>
                    Disconnect
                  </Button>
                  <Button variant="ghost" onClick={handleClearTraktConfig}>
                    Clear Config
                  </Button>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Playback Settings - only show on non-mobile */}
        {!isMobile && (
          <section className="p-6 rounded-lg bg-card border border-border">
            <div className="flex items-center gap-2 mb-4">
              <Play className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Playback</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
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
                  className="bg-secondary border-border"
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
          <section className="p-6 rounded-lg bg-primary/10 border border-primary/30">
            <div className="flex items-center gap-2 mb-4">
              <Smartphone className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Mobile Playback</h2>
            </div>

            <p className="text-muted-foreground mb-4">
              On mobile devices, playback uses the Infuse app. Make sure you have Infuse installed for the best experience.
            </p>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.open('https://apps.apple.com/app/infuse-7/id1136220934', '_blank')}
            >
              Get Infuse from App Store
            </Button>
          </section>
        )}

        {/* Download Settings - only on desktop */}
        {!isMobile && (
          <section className="p-6 rounded-lg bg-card border border-border">
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

        {/* Data Management */}
        <section className="p-6 rounded-lg bg-card border border-border">
          <div className="flex items-center gap-2 mb-4">
            <Trash2 className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Data Management</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
              <div>
                <p className="font-medium text-foreground">Library</p>
                <p className="text-sm text-muted-foreground">{library.length} items</p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleClearLibrary}
                disabled={library.length === 0}
              >
                Clear
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
              <div>
                <p className="font-medium text-foreground">Wishlist</p>
                <p className="text-sm text-muted-foreground">{wishlist.length} items</p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleClearWishlist}
                disabled={wishlist.length === 0}
              >
                Clear
              </Button>
            </div>

            <div className="pt-4 border-t border-border">
              <Button variant="destructive" onClick={handleClearAll} className="w-full">
                Reset All App Data
              </Button>
              <p className="text-sm text-muted-foreground mt-2 text-center">
                This will clear your library, wishlist, and all settings
              </p>
            </div>
          </div>
        </section>

        {/* About */}
        <section className="p-6 rounded-lg bg-card border border-border">
          <div className="flex items-center gap-2 mb-4">
            <Info className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">About</h2>
          </div>

          <div className="space-y-2">
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">MovieHub</span> - Movie & TV Discovery App
            </p>
            <p className="text-sm text-muted-foreground">Version 1.0.0</p>
            <p className="text-sm text-muted-foreground">
              Powered by TMDB API for movie and TV show data.
            </p>
          </div>
        </section>

        {/* Electron Helper Info - only on desktop browser */}
        {!isMobile && !isElectronApp && (
          <section className="p-6 rounded-lg bg-primary/10 border border-primary/30">
            <div className="flex items-center gap-2 mb-4">
              <Monitor className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Electron Helper</h2>
            </div>

            <p className="text-muted-foreground mb-4">
              For full functionality including file downloads, video playback integration, and native file system access, run this app with the Electron helper.
            </p>

            <div className="p-3 rounded-lg bg-card text-sm font-mono text-muted-foreground overflow-x-auto">
              cd electron && npm install && npm start
            </div>
          </section>
        )}

        {/* Media Server Info - only on host devices */}
        {isElectronApp && !isMobile && (
          <section className="p-6 rounded-lg bg-card border border-border">
            <div className="flex items-center gap-2 mb-4">
              <Server className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Media Server</h2>
              <span className="ml-auto px-2 py-0.5 rounded-full bg-green-500/20 text-green-500 text-xs font-medium">
                Running
              </span>
            </div>

            <p className="text-muted-foreground mb-4">
              The built-in media server allows other devices on your network to stream content from your library.
            </p>

            <div className="p-3 rounded-lg bg-secondary text-sm">
              <p className="font-medium text-foreground mb-1">Server URL:</p>
              <code className="text-muted-foreground">http://[your-ip]:8765</code>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
