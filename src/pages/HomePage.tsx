import React, { useEffect, useState } from 'react';
import { Media } from '@/types/media';
import { getTrending, getPopular, getNowPlaying, getUpcoming, getAiringToday, getImageUrl } from '@/services/tmdb';
import { MediaRow } from '@/components/MediaRow';
import { ContinueWatchingRow } from '@/components/ContinueWatchingRow';
import { Info, Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { useTraktSync } from '@/hooks/useTraktSync';
import { TraktSignInPrompt } from '@/components/TraktSignInPrompt';

interface HomePageProps {
  onMediaClick: (media: Media) => void;
  onNavigateToSettings?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onMediaClick, onNavigateToSettings }) => {
  const [trending, setTrending] = useState<Media[]>([]);
  const [popular, setPopular] = useState<Media[]>([]);
  const [newReleases, setNewReleases] = useState<Media[]>([]);
  const [seasonal, setSeasonal] = useState<Media[]>([]);
  const [upcoming, setUpcoming] = useState<Media[]>([]);
  const [heroItems, setHeroItems] = useState<Media[]>([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const { isInWishlist, addToWishlist, removeFromWishlist } = useApp();
  const { 
    isAuthenticated: isTraktAuthenticated,
    continueWatching,
    fetchContinueWatching,
    showSignInPrompt,
    setShowSignInPrompt,
    syncWishlistToTrakt,
  } = useTraktSync();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [trendingData, popularData, newData, seasonalData, upcomingData] = await Promise.all([
          getTrending('all', 'week'),
          getPopular('movie'),
          getNowPlaying('movie'),
          getAiringToday(),
          getUpcoming(),
        ]);

        setTrending(trendingData);
        setPopular(popularData);
        setNewReleases(newData);
        setSeasonal(seasonalData);
        setUpcoming(upcomingData);

        // Get top 5 trending items with backdrop for hero rotation
        const heroCandidates = trendingData.filter(m => m.backdrop_path).slice(0, 5);
        if (heroCandidates.length > 0) {
          setHeroItems(heroCandidates);
        }
      } catch (error) {
        console.error('Failed to fetch home data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Hero rotation every 5 seconds
  useEffect(() => {
    if (heroItems.length <= 1) return;
    
    const interval = setInterval(() => {
      setHeroIndex(prev => (prev + 1) % heroItems.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [heroItems.length]);

  const heroItem = heroItems[heroIndex] || null;

  useEffect(() => {
    if (isTraktAuthenticated) {
      fetchContinueWatching();
    }
  }, [isTraktAuthenticated, fetchContinueWatching]);

  const heroTitle = heroItem?.title || heroItem?.name || '';
  const heroMediaType = heroItem?.media_type || 'movie';
  const heroInWishlist = heroItem ? isInWishlist(heroItem.id, heroMediaType) : false;

  const handleHeroWishlist = async () => {
    if (!heroItem) return;
    
    if (heroInWishlist) {
      removeFromWishlist(heroItem.id, heroMediaType);
    } else {
      if (!isTraktAuthenticated) {
        setShowSignInPrompt(true);
      }
      
      addToWishlist({
        mediaId: heroItem.id,
        mediaType: heroMediaType,
        addedAt: new Date().toISOString(),
        title: heroTitle,
        posterPath: heroItem.poster_path,
        releaseDate: heroItem.release_date || heroItem.first_air_date,
        voteAverage: heroItem.vote_average,
      });
      
      if (isTraktAuthenticated) {
        await syncWishlistToTrakt(heroItem.id, heroMediaType);
      }
    }
  };

  const handleGoToSettings = () => {
    setShowSignInPrompt(false);
    onNavigateToSettings?.();
  };

  return (
    <>
      <TraktSignInPrompt
        open={showSignInPrompt}
        onOpenChange={setShowSignInPrompt}
        onGoToSettings={handleGoToSettings}
      />
      
      <div className="min-h-screen pb-24 md:pb-8">
        {/* Hero Section */}
        {heroItem && (
          <section className="relative h-[70vh] md:h-[85vh] overflow-hidden">
            {/* Hero image with crossfade */}
            <div className="absolute inset-0">
              {heroItems.map((item, idx) => (
                <div
                  key={item.id}
                  className={`absolute inset-0 transition-opacity duration-1000 ${
                    idx === heroIndex ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  {item.backdrop_path && (
                    <img
                      src={getImageUrl(item.backdrop_path, 'original')!}
                      alt={item.title || item.name || ''}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              ))}
              <div className="absolute inset-0 hero-gradient" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
              <div className="absolute inset-x-0 top-0 h-24 hero-gradient-top" />
            </div>

            {/* Hero indicators */}
            {heroItems.length > 1 && (
              <div className="absolute bottom-32 md:bottom-40 right-6 md:right-12 flex gap-2 z-20">
                {heroItems.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setHeroIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      idx === heroIndex 
                        ? 'bg-primary w-6' 
                        : 'bg-white/40 hover:bg-white/60'
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 md:pb-24">
              <div className="max-w-2xl">
                <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-3 text-shadow-lg animate-slide-up">
                  {heroTitle}
                </h1>
                <div 
                  className="flex items-center gap-3 mb-4 animate-fade-in"
                  style={{ animationDelay: '100ms' }}
                >
                  <span className="px-2.5 py-1 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-xs font-bold rounded-full shadow-md">
                    {heroMediaType === 'tv' ? '📺 TV SERIES' : '🎬 MOVIE'}
                  </span>
                  <span className="text-muted-foreground">
                    {(heroItem.release_date || heroItem.first_air_date || '').split('-')[0]}
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-success font-semibold flex items-center gap-1">
                    ★ {heroItem.vote_average.toFixed(1)}
                  </span>
                </div>
                <p 
                  className="text-base md:text-lg text-foreground/90 mb-6 line-clamp-3 text-shadow animate-fade-in"
                  style={{ animationDelay: '200ms' }}
                >
                  {heroItem.overview}
                </p>
                <div 
                  className="flex flex-wrap gap-3 animate-fade-in"
                  style={{ animationDelay: '300ms' }}
                >
                  <Button
                    size="lg"
                    onClick={() => onMediaClick(heroItem)}
                    className="gap-2 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
                  >
                    <Info className="w-5 h-5" />
                    More Info
                  </Button>
                  <Button
                    size="lg"
                    variant={heroInWishlist ? 'secondary' : 'outline'}
                    onClick={handleHeroWishlist}
                    className="gap-2 transition-all duration-300 hover:scale-105"
                  >
                    {heroInWishlist ? (
                      <>
                        <Check className="w-5 h-5" />
                        In Wishlist
                      </>
                    ) : (
                      <>
                        <Plus className="w-5 h-5" />
                        My List
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Continue Watching Section */}
        {continueWatching.length > 0 && (
          <ContinueWatchingRow
            items={continueWatching}
            onItemClick={onMediaClick}
          />
        )}

        {/* Content Rows */}
        <div className="relative z-10 -mt-16 md:-mt-24 space-y-2">
          <MediaRow
            title="🔥 Trending This Week"
            items={trending}
            onItemClick={onMediaClick}
            isLoading={isLoading}
          />

          <MediaRow
            title="Popular Movies"
            items={popular}
            onItemClick={onMediaClick}
            isLoading={isLoading}
          />

          <MediaRow
            title="New Releases"
            items={newReleases}
            onItemClick={onMediaClick}
            isLoading={isLoading}
          />

          <MediaRow
            title="📺 Airing This Season"
            items={seasonal}
            onItemClick={onMediaClick}
            isLoading={isLoading}
          />

          <MediaRow
            title="Coming Soon"
            items={upcoming}
            onItemClick={onMediaClick}
            isLoading={isLoading}
          />
        </div>
      </div>
    </>
  );
};
