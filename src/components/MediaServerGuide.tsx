import React from 'react';
import { Server, Wifi, Info, Copy, Check, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface MediaServerGuideProps {
  isOpen: boolean;
  onClose: () => void;
  serverUrl: string;
}

export const MediaServerGuide: React.FC<MediaServerGuideProps> = ({
  isOpen,
  onClose,
  serverUrl,
}) => {
  const [copiedField, setCopiedField] = React.useState<string | null>(null);

  // Parse server URL to get parts
  const getServerParts = () => {
    try {
      const url = new URL(serverUrl);
      return {
        protocol: 'HTTP', // WebDAV-like uses HTTP
        address: url.hostname,
        port: url.port || '8765',
        path: '/',
      };
    } catch {
      return {
        protocol: 'HTTP',
        address: 'YOUR_PC_IP',
        port: '8765',
        path: '/',
      };
    }
  };

  const parts = getServerParts();

  const copyToClipboard = (value: string, field: string) => {
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const configFields = [
    { 
      label: 'Protocol', 
      value: parts.protocol,
      description: 'Select "HTTP" or "WebDAV" in Infuse',
    },
    { 
      label: 'Address', 
      value: parts.address,
      description: 'Your PC\'s local IP address on the network',
    },
    { 
      label: 'Port', 
      value: parts.port,
      description: 'Default media server port',
    },
    { 
      label: 'Path', 
      value: parts.path,
      description: 'Leave as "/" to access all library files',
    },
    { 
      label: 'Username', 
      value: '(leave empty)',
      description: 'No authentication required',
    },
    { 
      label: 'Password', 
      value: '(leave empty)',
      description: 'No authentication required',
    },
    { 
      label: 'MAC Address (optional)', 
      value: '(optional - for Wake on LAN)',
      description: 'Enter your PC\'s MAC address for remote wake',
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Server className="w-5 h-5 text-primary" />
            Connect to Media Server in Infuse
          </DialogTitle>
          <DialogDescription className="text-sm">
            Follow these steps to stream your library from this PC to your iPhone, iPad, or Apple TV.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Step 1 */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">1</span>
              Open Infuse Settings
            </h3>
            <p className="text-xs text-muted-foreground pl-7">
              In Infuse, go to <strong>Settings → Shares</strong> and tap the <strong>+</strong> button to add a new share.
            </p>
          </div>

          {/* Step 2 */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">2</span>
              Enter Connection Details
            </h3>
            <div className="pl-7 space-y-2">
              {configFields.map((field) => (
                <div 
                  key={field.label}
                  className="flex items-center justify-between p-2 rounded-lg bg-secondary/50 border border-border"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground">{field.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{field.description}</p>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <code className="text-xs bg-background px-2 py-1 rounded font-mono text-primary">
                      {field.value}
                    </code>
                    {!field.value.includes('leave') && !field.value.includes('optional') && (
                      <button
                        onClick={() => copyToClipboard(field.value, field.label)}
                        className="p-1 rounded hover:bg-accent transition-colors"
                      >
                        {copiedField === field.label ? (
                          <Check className="w-3.5 h-3.5 text-success" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Step 3 */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">3</span>
              Save & Browse
            </h3>
            <p className="text-xs text-muted-foreground pl-7">
              Tap <strong>Save</strong> and you should now see your movie library in Infuse! Browse and play any movie from your library.
            </p>
          </div>

          {/* Important Notes */}
          <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
            <div className="flex gap-2">
              <Wifi className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
              <div className="text-xs text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Requirements</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Both devices must be on the same Wi-Fi network</li>
                  <li>This PC must be on and MovieHub must be running</li>
                  <li>Firewall must allow incoming connections on port {parts.port}</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Full Server URL */}
          <div className="p-3 rounded-lg bg-card border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-foreground mb-0.5">Full Server URL</p>
                <code className="text-xs font-mono text-primary">{serverUrl}</code>
              </div>
              <button
                onClick={() => copyToClipboard(serverUrl, 'url')}
                className="p-2 rounded-lg hover:bg-accent transition-colors"
              >
                {copiedField === 'url' ? (
                  <Check className="w-4 h-4 text-success" />
                ) : (
                  <Copy className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button 
              size="sm" 
              className="gap-1.5"
              onClick={() => window.open('https://support.firecore.com/hc/en-us/articles/215090997-API-for-Third-Party-Apps-Services', '_blank')}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Infuse Docs
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
