import { useCallback, useEffect, useState } from 'react';
import { traktService, TraktWatchlistItem, TraktHistoryItem } from '@/services/trakt';
import { useApp } from '@/contexts/AppContext';
import { toast } from '@/hooks/use-toast';

export interface ContinueWatchingItem {
  mediaId: number;
  mediaType: 'movie' | 'tv';
  title: string;
  posterPath: string | null;
  progress: number; // Percentage 0-100
  watchedAt: string;
  episodeInfo?: {
    season: number;
    episode: number;
    episodeTitle: string;
  };
}

export const useTraktSync = () => {
  const { 
    wishlist, 
    addToWishlist, 
    removeFromWishlist,
    library,
    addToLibrary,
  } = useApp();
  
  const [isAuthenticated, setIsAuthenticated] = useState(traktService.isAuthenticated());
  const [isSyncing, setIsSyncing] = useState(false);
  const [continueWatching, setContinueWatching] = useState<ContinueWatchingItem[]>([]);
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);

  // Check auth status on mount
  useEffect(() => {
    setIsAuthenticated(traktService.isAuthenticated());
  }, []);

  // Sync wishlist item to Trakt when added locally
  const syncWishlistToTrakt = useCallback(async (mediaId: number, mediaType: 'movie' | 'tv') => {
    if (!traktService.isAuthenticated()) {
      setShowSignInPrompt(true);
      return false;
    }

    try {
      const type = mediaType === 'tv' ? 'show' : 'movie';
      await traktService.addToWatchlist(mediaId, type);
      return true;
    } catch (error) {
      console.error('Failed to sync wishlist to Trakt:', error);
      return false;
    }
  }, []);

  // Remove from Trakt watchlist
  const removeFromTraktWatchlist = useCallback(async (mediaId: number, mediaType: 'movie' | 'tv') => {
    if (!traktService.isAuthenticated()) return false;

    try {
      const type = mediaType === 'tv' ? 'show' : 'movie';
      await traktService.removeFromWatchlist(mediaId, type);
      return true;
    } catch (error) {
      console.error('Failed to remove from Trakt watchlist:', error);
      return false;
    }
  }, []);

  // Sync library item to Trakt (mark as collected)
  const syncLibraryToTrakt = useCallback(async (mediaId: number, mediaType: 'movie' | 'tv') => {
    if (!traktService.isAuthenticated()) {
      setShowSignInPrompt(true);
      return false;
    }

    try {
      // Mark as watched in Trakt
      const type = mediaType === 'tv' ? 'show' : 'movie';
      await traktService.markAsWatched(mediaId, type);
      return true;
    } catch (error) {
      console.error('Failed to sync library to Trakt:', error);
      return false;
    }
  }, []);

  // Fetch continue watching from Trakt history
  const fetchContinueWatching = useCallback(async () => {
    if (!traktService.isAuthenticated()) {
      setContinueWatching([]);
      return;
    }

    try {
      const [movieHistory, tvHistory] = await Promise.all([
        traktService.getHistory('movies', 1, 10),
        traktService.getHistory('shows', 1, 10),
      ]);

      const items: ContinueWatchingItem[] = [];

      // Process movie history
      movieHistory.forEach((item) => {
        if (item.movie?.ids.tmdb) {
          items.push({
            mediaId: item.movie.ids.tmdb,
            mediaType: 'movie',
            title: item.movie.title,
            posterPath: null, // Will be fetched from TMDB
            progress: 100, // Trakt doesn't provide progress, assume watched
            watchedAt: item.watched_at,
          });
        }
      });

      // Process TV history
      tvHistory.forEach((item) => {
        if (item.show?.ids.tmdb && item.episode) {
          items.push({
            mediaId: item.show.ids.tmdb,
            mediaType: 'tv',
            title: item.show.title,
            posterPath: null,
            progress: 100,
            watchedAt: item.watched_at,
            episodeInfo: {
              season: item.episode.season,
              episode: item.episode.number,
              episodeTitle: item.episode.title,
            },
          });
        }
      });

      // Sort by watched_at descending and take most recent
      items.sort((a, b) => new Date(b.watchedAt).getTime() - new Date(a.watchedAt).getTime());
      setContinueWatching(items.slice(0, 10));
    } catch (error) {
      console.error('Failed to fetch continue watching:', error);
    }
  }, []);

  // Import Trakt watchlist to local wishlist
  const importTraktWatchlist = useCallback(async () => {
    if (!traktService.isAuthenticated()) return;

    setIsSyncing(true);
    try {
      const traktWatchlist = await traktService.getWatchlist();
      let importCount = 0;

      traktWatchlist.forEach((item: TraktWatchlistItem) => {
        const tmdbId = item.movie?.ids.tmdb || item.show?.ids.tmdb;
        const mediaType = item.type === 'movie' ? 'movie' : 'tv';
        const title = item.movie?.title || item.show?.title || 'Unknown';

        if (tmdbId) {
          addToWishlist({
            mediaId: tmdbId,
            mediaType,
            addedAt: item.listed_at,
            title,
            posterPath: null,
            voteAverage: 0,
          });
          importCount++;
        }
      });

      toast({
        title: 'Trakt Sync Complete',
        description: `Imported ${importCount} items from your Trakt watchlist.`,
      });
    } catch (error) {
      console.error('Failed to import Trakt watchlist:', error);
      toast({
        title: 'Sync Failed',
        description: 'Failed to import your Trakt watchlist.',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  }, [addToWishlist]);

  // Mark as watched (scrobble) on Trakt
  const scrobbleToTrakt = useCallback(async (
    mediaId: number, 
    mediaType: 'movie' | 'tv',
    progress: number = 100
  ) => {
    if (!traktService.isAuthenticated()) return false;

    try {
      const type = mediaType === 'tv' ? 'show' : 'movie';
      await traktService.markAsWatched(mediaId, type);
      return true;
    } catch (error) {
      console.error('Failed to scrobble to Trakt:', error);
      return false;
    }
  }, []);

  return {
    isAuthenticated,
    setIsAuthenticated,
    isSyncing,
    continueWatching,
    showSignInPrompt,
    setShowSignInPrompt,
    syncWishlistToTrakt,
    removeFromTraktWatchlist,
    syncLibraryToTrakt,
    fetchContinueWatching,
    importTraktWatchlist,
    scrobbleToTrakt,
  };
};
