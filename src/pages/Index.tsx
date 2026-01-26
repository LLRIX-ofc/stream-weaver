import React, { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { MediaFullPage } from '@/components/MediaFullPage';
import { HomePage } from '@/pages/HomePage';
import { SearchPage } from '@/pages/SearchPage';
import { WishlistPage } from '@/pages/WishlistPage';
import { LibraryPage } from '@/pages/LibraryPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { AppProvider } from '@/contexts/AppContext';
import { Media } from '@/types/media';

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

  const renderPage = () => {
    switch (activeTab) {
      case 'home':
        return <HomePage onMediaClick={handleMediaClick} />;
      case 'search':
        return <SearchPage onMediaClick={handleMediaClick} />;
      case 'wishlist':
        return <WishlistPage onMediaClick={handleMediaClick} />;
      case 'library':
        return <LibraryPage onMediaClick={handleMediaClick} />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <HomePage onMediaClick={handleMediaClick} />;
    }
  };

  return (
    <AppProvider>
      <div className="min-h-screen bg-background">
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
        
        <main className="md:pt-16">
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
          />
        )}
      </div>
    </AppProvider>
  );
};

export default Index;
