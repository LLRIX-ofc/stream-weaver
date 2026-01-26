import React from 'react';
import { Home, Search, Heart, Library, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

type TabId = 'home' | 'search' | 'wishlist' | 'library' | 'settings';

interface NavigationProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'home', label: 'Home', icon: <Home className="w-5 h-5" /> },
  { id: 'search', label: 'Search', icon: <Search className="w-5 h-5" /> },
  { id: 'wishlist', label: 'Wishlist', icon: <Heart className="w-5 h-5" /> },
  { id: 'library', label: 'Library', icon: <Library className="w-5 h-5" /> },
  { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
];

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  return (
    <>
      {/* Desktop Navigation - Top Bar */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="w-full px-6 py-3 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">M</span>
            </div>
            <span className="text-lg font-bold text-foreground">MovieHub</span>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn('nav-tab flex items-center gap-2', activeTab === tab.id && 'active')}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Placeholder for future features */}
          <div className="w-24" />
        </div>
      </nav>

      {/* Mobile Navigation - Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border">
        <div className="flex items-center justify-around py-2 px-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex flex-col items-center gap-1 p-2 rounded-lg transition-colors',
                activeTab === tab.id
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.icon}
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </>
  );
};
