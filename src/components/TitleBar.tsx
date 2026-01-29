import React from 'react';
import { Minus, Square, X, Maximize2 } from 'lucide-react';
import { isElectron } from '@/lib/electron';
import { cn } from '@/lib/utils';

interface TitleBarProps {
  title?: string;
}

export const TitleBar: React.FC<TitleBarProps> = ({ title = 'MovieHub' }) => {
  // Only show custom title bar in Electron
  if (!isElectron()) return null;

  const handleMinimize = () => window.electronAPI?.minimize();
  const handleMaximize = () => window.electronAPI?.maximize();
  const handleClose = () => window.electronAPI?.close();

  return (
    <div 
      className="fixed top-0 left-0 right-0 z-[100] h-8 flex items-center justify-between bg-background/95 border-b border-border/50 select-none"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* App Icon and Title */}
      <div className="flex items-center gap-2 px-3">
        <div className="w-4 h-4 rounded-sm bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-[10px]">M</span>
        </div>
        <span className="text-xs font-medium text-foreground/80">{title}</span>
      </div>

      {/* Window Controls */}
      <div 
        className="flex items-center h-full"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <button
          onClick={handleMinimize}
          className={cn(
            "h-8 w-12 flex items-center justify-center transition-colors",
            "text-muted-foreground hover:bg-accent hover:text-foreground"
          )}
          aria-label="Minimize"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          onClick={handleMaximize}
          className={cn(
            "h-8 w-12 flex items-center justify-center transition-colors",
            "text-muted-foreground hover:bg-accent hover:text-foreground"
          )}
          aria-label="Maximize"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleClose}
          className={cn(
            "h-8 w-12 flex items-center justify-center transition-colors",
            "text-muted-foreground hover:bg-destructive hover:text-destructive-foreground"
          )}
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
