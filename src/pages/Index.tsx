import React, { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { TitleBar } from '@/components/TitleBar';
import { MediaFullPage } from '@/components/MediaFullPage';
import { HomePage } from '@/pages/HomePage';
import { SearchPage } from '@/pages/SearchPage';
import { WishlistPage } from '@/pages/WishlistPage';
import { LibraryPage } from '@/pages/LibraryPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { AppProvider } from '@/contexts/AppContext';
import { Media } from '@/types/media';
import { isElectron } from '@/lib/electron';

type TabId = 'home' | 'search' | 'wishlist' | 'library' | 'settings';

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);

  const handleMediaClick = (media: Media) => {
    setSelectedMedia(media);
  };

  const handleCloseFullPage = () => {
    setSelectedMedia(null);
  };

  const handleNavigateToSettings = () => {
    setActiveTab('settings');
  };

  const renderPage = () => {
    switch (activeTab) {
      case 'home':
        return <HomePage onMediaClick={handleMediaClick} onNavigateToSettings={handleNavigateToSettings} />;
      case 'search':
        return <SearchPage onMediaClick={handleMediaClick} />;
      case 'wishlist':
        return <WishlistPage onMediaClick={handleMediaClick} />;
      case 'library':
        return <LibraryPage onMediaClick={handleMediaClick} />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <HomePage onMediaClick={handleMediaClick} onNavigateToSettings={handleNavigateToSettings} />;
    }
  };

  // Add padding for custom title bar in Electron
  const hasTitleBar = isElectron();

  return (
    <AppProvider>
      <div className="min-h-screen bg-background">
        {/* Custom Title Bar for Electron */}
        <TitleBar title="MovieHub" />
        
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
        
        <main className={hasTitleBar ? 'pt-8 md:pt-24' : 'md:pt-16'}>
          {renderPage()}
        </main>

        {/* Full Page Modal */}
        {selectedMedia && (
          <MediaFullPage
            media={selectedMedia}
            onClose={handleCloseFullPage}
            onMediaClick={(media) => {
              setSelectedMedia(media);
            }}
            onNavigateToSettings={handleNavigateToSettings}
          />
        )}
      </div>
    </AppProvider>
  );
};

export default Index;
