import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { LibraryItem, WishlistItem } from '@/types/media';

interface AppSettings {
  autoPlay: boolean;
  defaultQuality: 'auto' | '720p' | '1080p' | '4k';
  downloadPath: string;
  playerPath: string;
}

interface AppContextType {
  // Wishlist
  wishlist: WishlistItem[];
  addToWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (mediaId: number, mediaType: 'movie' | 'tv') => void;
  isInWishlist: (mediaId: number, mediaType: 'movie' | 'tv') => boolean;
  
  // Library
  library: LibraryItem[];
  addToLibrary: (item: LibraryItem) => void;
  removeFromLibrary: (mediaId: number, mediaType: 'movie' | 'tv') => void;
  isInLibrary: (mediaId: number, mediaType: 'movie' | 'tv') => boolean;
  getLibraryItem: (mediaId: number, mediaType: 'movie' | 'tv') => LibraryItem | undefined;
  
  // Settings
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
}

const defaultSettings: AppSettings = {
  autoPlay: true,
  defaultQuality: 'auto',
  downloadPath: 'C:\\Users\\{USER}\\Videos\\Movies',
  playerPath: 'EnergyPlayer.exe',
};

const AppContext = createContext<AppContextType | null>(null);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wishlist, setWishlist] = useState<WishlistItem[]>(() => {
    const stored = localStorage.getItem('movieapp_wishlist');
    return stored ? JSON.parse(stored) : [];
  });

  const [library, setLibrary] = useState<LibraryItem[]>(() => {
    const stored = localStorage.getItem('movieapp_library');
    return stored ? JSON.parse(stored) : [];
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const stored = localStorage.getItem('movieapp_settings');
    return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
  });

  // Persist wishlist
  useEffect(() => {
    localStorage.setItem('movieapp_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  // Persist library
  useEffect(() => {
    localStorage.setItem('movieapp_library', JSON.stringify(library));
  }, [library]);

  // Persist settings
  useEffect(() => {
    localStorage.setItem('movieapp_settings', JSON.stringify(settings));
  }, [settings]);

  const addToWishlist = useCallback((item: WishlistItem) => {
    setWishlist(prev => {
      if (prev.some(w => w.mediaId === item.mediaId && w.mediaType === item.mediaType)) {
        return prev;
      }
      return [...prev, item];
    });
  }, []);

  const removeFromWishlist = useCallback((mediaId: number, mediaType: 'movie' | 'tv') => {
    setWishlist(prev => prev.filter(w => !(w.mediaId === mediaId && w.mediaType === mediaType)));
  }, []);

  const isInWishlist = useCallback((mediaId: number, mediaType: 'movie' | 'tv') => {
    return wishlist.some(w => w.mediaId === mediaId && w.mediaType === mediaType);
  }, [wishlist]);

  const addToLibrary = useCallback((item: LibraryItem) => {
    setLibrary(prev => {
      const existing = prev.findIndex(l => l.mediaId === item.mediaId && l.mediaType === item.mediaType);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = item;
        return updated;
      }
      return [...prev, item];
    });
  }, []);

  const removeFromLibrary = useCallback((mediaId: number, mediaType: 'movie' | 'tv') => {
    setLibrary(prev => prev.filter(l => !(l.mediaId === mediaId && l.mediaType === mediaType)));
  }, []);

  const isInLibrary = useCallback((mediaId: number, mediaType: 'movie' | 'tv') => {
    return library.some(l => l.mediaId === mediaId && l.mediaType === mediaType);
  }, [library]);

  const getLibraryItem = useCallback((mediaId: number, mediaType: 'movie' | 'tv') => {
    return library.find(l => l.mediaId === mediaId && l.mediaType === mediaType);
  }, [library]);

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  return (
    <AppContext.Provider
      value={{
        wishlist,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        library,
        addToLibrary,
        removeFromLibrary,
        isInLibrary,
        getLibraryItem,
        settings,
        updateSettings,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
