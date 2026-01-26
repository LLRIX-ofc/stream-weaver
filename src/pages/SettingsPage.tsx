import React from 'react';
import { Settings, Palette, FolderOpen, Play, Monitor, Moon, Sun, Info, Trash2 } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, library, wishlist } = useApp();

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
      window.location.reload();
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
        {/* Playback Settings */}
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

        {/* Download Settings */}
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

        {/* Electron Helper Info */}
        <section className="p-6 rounded-lg bg-primary/10 border border-primary/30">
          <div className="flex items-center gap-2 mb-4">
            <Monitor className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Electron Helper</h2>
          </div>

          <p className="text-muted-foreground mb-4">
            For full functionality including file downloads, video playback integration, and native file system access, run this app with the Electron helper.
          </p>

          <div className="p-3 rounded-lg bg-card text-sm font-mono text-muted-foreground overflow-x-auto">
            npm run electron
          </div>
        </section>
      </div>
    </div>
  );
};
