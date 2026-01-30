import React, { useState, useRef, useEffect } from 'react';
import { X, FolderOpen, Play, Download, Wifi, Server, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { isMobileDevice, isHostDevice, isElectron } from '@/lib/device';
import { cn } from '@/lib/utils';

interface AddToLibraryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mediaTitle: string;
  onAddWithPath: (path: string) => void;
  onAddFromHost?: (hostUrl: string) => void;
  onOpenInfuse?: () => void;
}

export const AddToLibraryDialog: React.FC<AddToLibraryDialogProps> = ({
  open,
  onOpenChange,
  mediaTitle,
  onAddWithPath,
  onAddFromHost,
  onOpenInfuse,
}) => {
  const [filePath, setFilePath] = useState('');
  const [mode, setMode] = useState<'local' | 'host' | 'infuse'>('local');
  const [hostUrl, setHostUrl] = useState('');
  const [isSearchingHosts, setIsSearchingHosts] = useState(false);
  const [discoveredHosts, setDiscoveredHosts] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isMobile = isMobileDevice();
  const isHost = isHostDevice();
  const isDesktopElectron = isElectron() && !isMobile;

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setFilePath('');
      setHostUrl('');
      
      // Set default mode based on device type
      if (isMobile) {
        setMode('infuse');
      } else if (isDesktopElectron) {
        setMode('local');
      } else {
        setMode('host');
      }
    }
  }, [open, isMobile, isDesktopElectron]);

  // Simulate host discovery
  const searchForHosts = async () => {
    setIsSearchingHosts(true);
    // In real implementation, this would scan the network
    // For now, check localStorage for saved host
    const savedHost = localStorage.getItem('movieapp_host_url');
    if (savedHost) {
      setDiscoveredHosts([savedHost]);
    }
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSearchingHosts(false);
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In Electron, we can get the actual path
      const path = (file as any).path || `C:\\Users\\{USER}\\Videos\\Movies\\${file.name}`;
      setFilePath(path);
    }
  };

  const handleSubmit = () => {
    if (mode === 'local' && filePath) {
      onAddWithPath(filePath);
      onOpenChange(false);
    } else if (mode === 'host' && hostUrl) {
      onAddFromHost?.(hostUrl);
      onOpenChange(false);
    } else if (mode === 'infuse') {
      onOpenInfuse?.();
      onOpenChange(false);
    }
  };

  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onOpenChange(false)}
    >
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Add to Library</h2>
            <p className="text-sm text-muted-foreground truncate max-w-[280px]">{mediaTitle}</p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Mode Selection - only show on access devices (not host, not mobile) */}
          {!isMobile && !isHost && (
            <div className="flex gap-2">
              <button
                onClick={() => setMode('local')}
                className={cn(
                  'flex-1 p-3 rounded-lg border transition-all text-sm font-medium',
                  mode === 'local' 
                    ? 'bg-primary/20 border-primary text-primary' 
                    : 'bg-secondary/50 border-border text-muted-foreground hover:border-primary/50'
                )}
              >
                <FolderOpen className="w-5 h-5 mx-auto mb-1" />
                Local File
              </button>
              <button
                onClick={() => {
                  setMode('host');
                  searchForHosts();
                }}
                className={cn(
                  'flex-1 p-3 rounded-lg border transition-all text-sm font-medium',
                  mode === 'host' 
                    ? 'bg-primary/20 border-primary text-primary' 
                    : 'bg-secondary/50 border-border text-muted-foreground hover:border-primary/50'
                )}
              >
                <Wifi className="w-5 h-5 mx-auto mb-1" />
                From Host
              </button>
            </div>
          )}

          {/* PC/Desktop Electron - Local file selection */}
          {(mode === 'local' && isDesktopElectron) && (
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*,.mp4,.mkv,.avi,.mov,.wmv,.flv,.webm"
                className="hidden"
                onChange={handleFileChange}
              />
              
              <div>
                <Label className="text-foreground mb-2 block">Select Video File</Label>
                <div className="flex gap-2">
                  <Input
                    value={filePath}
                    onChange={(e) => setFilePath(e.target.value)}
                    placeholder="C:\Users\{USER}\Videos\Movie.mkv"
                    className="flex-1 bg-secondary border-border"
                  />
                  <Button variant="secondary" onClick={handleFileSelect}>
                    <FolderOpen className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Select the video file from your computer
                </p>
              </div>
            </div>
          )}

          {/* Browser mode - manual path entry */}
          {(mode === 'local' && !isDesktopElectron && !isMobile) && (
            <div className="space-y-3">
              <div>
                <Label className="text-foreground mb-2 block">Enter File Path</Label>
                <Input
                  value={filePath}
                  onChange={(e) => setFilePath(e.target.value)}
                  placeholder="Enter the full path to the video file"
                  className="bg-secondary border-border"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter the path to the video file on your computer
                </p>
              </div>
            </div>
          )}

          {/* Host streaming mode */}
          {mode === 'host' && (
            <div className="space-y-3">
              {isSearchingHosts ? (
                <div className="text-center py-6">
                  <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Searching for hosts on network...</p>
                </div>
              ) : discoveredHosts.length > 0 ? (
                <div>
                  <Label className="text-foreground mb-2 block">Select Host</Label>
                  <div className="space-y-2">
                    {discoveredHosts.map((host, idx) => (
                      <button
                        key={idx}
                        onClick={() => setHostUrl(host)}
                        className={cn(
                          'w-full p-3 rounded-lg border flex items-center gap-3 transition-all',
                          hostUrl === host 
                            ? 'bg-primary/20 border-primary' 
                            : 'bg-secondary/50 border-border hover:border-primary/50'
                        )}
                      >
                        <Server className="w-5 h-5 text-primary" />
                        <div className="text-left">
                          <p className="font-medium text-foreground text-sm">Host Device</p>
                          <p className="text-xs text-muted-foreground">{host}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Wifi className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-sm text-muted-foreground mb-3">No host devices found</p>
                  <div>
                    <Label className="text-foreground mb-2 block text-left">Manual Host URL</Label>
                    <Input
                      value={hostUrl}
                      onChange={(e) => setHostUrl(e.target.value)}
                      placeholder="http://192.168.1.100:8765"
                      className="bg-secondary border-border"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mobile - Infuse mode */}
          {isMobile && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Play className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Open in Infuse</h3>
              <p className="text-sm text-muted-foreground mb-4">
                This will add the movie to your library and open it in the Infuse app for playback.
              </p>
              <p className="text-xs text-muted-foreground">
                Make sure you have Infuse installed and your media server connected.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t border-border">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            className="flex-1 gap-2" 
            onClick={handleSubmit}
            disabled={
              (mode === 'local' && !filePath) ||
              (mode === 'host' && !hostUrl)
            }
          >
            {mode === 'infuse' ? (
              <>
                <Play className="w-4 h-4" />
                Open in Infuse
              </>
            ) : mode === 'host' ? (
              <>
                <Download className="w-4 h-4" />
                Add from Host
              </>
            ) : (
              <>
                <FolderOpen className="w-4 h-4" />
                Add to Library
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};