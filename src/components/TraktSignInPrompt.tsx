import React from 'react';
import { Link2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface TraktSignInPromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGoToSettings: () => void;
}

export const TraktSignInPrompt: React.FC<TraktSignInPromptProps> = ({
  open,
  onOpenChange,
  onGoToSettings,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Link2 className="w-6 h-6 text-primary" />
            <DialogTitle>Sign in with Trakt</DialogTitle>
          </div>
          <DialogDescription>
            Connect your Trakt.tv account to sync your library and wishlist across all your devices.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-4 rounded-lg bg-secondary/50 border border-border">
            <h4 className="font-medium text-foreground mb-2">Why connect Trakt?</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                Sync your wishlist and watch history
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                Track what you've watched across devices
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                Continue watching from where you left off
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                Get personalized recommendations
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-2">
            <Button onClick={onGoToSettings} className="w-full gap-2">
              <Link2 className="w-4 h-4" />
              Go to Settings to Connect
            </Button>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => window.open('https://trakt.tv', '_blank')}
            >
              <ExternalLink className="w-4 h-4" />
              Learn More About Trakt
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
