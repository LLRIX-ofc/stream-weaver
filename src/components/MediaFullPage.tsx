import React, { useEffect, useState, useRef } from 'react';
import { X, Play, Plus, Check, Star, Calendar, Clock, ExternalLink, FolderOpen, Download } from 'lucide-react';
import { MediaDetails, Media } from '@/types/media';
import { getDetails, getImageUrl } from '@/services/tmdb';
import { useApp } from '@/contexts/AppContext';
import { MediaCard } from './MediaCard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MediaFullPageProps {
  media: Media;
  onClose: () => void;
  onMediaClick: (media: Media) => void;
}

export const MediaFullPage: React.FC<MediaFullPageProps> = ({
  media,
  onClose,
  onMediaClick,
}) => {
  const [details, setDetails] = useState<MediaDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showWebView, setShowWebView] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const {
    isInWishlist,
    addToWishlist,
    removeFromWishlist,
    isInLibrary,
    addToLibrary,
    getLibraryItem,
    settings,
  } = useApp();

  const mediaType = media.media_type || 'movie';
  const title = media.title || media.name || 'Unknown';
  const inWishlist = isInWishlist(media.id, mediaType);
  const inLibrary = isInLibrary(media.id, mediaType);
  const libraryItem = getLibraryItem(media.id, mediaType);

  useEffect(() => {
    const fetchDetails = async () => {
      setIsLoading(true);
      try {
        const data = await getDetails(media.id, mediaType);
        setDetails(data);
      } catch (error) {
        console.error('Failed to fetch details:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetails();
  }, [media.id, mediaType]);

  const handleWishlistToggle = () => {
    if (inWishlist) {
      removeFromWishlist(media.id, mediaType);
    } else {
      addToWishlist({
        mediaId: media.id,
        mediaType,
        addedAt: new Date().toISOString(),
        title,
        posterPath: media.poster_path,
        releaseDate: media.release_date || media.first_air_date,
        voteAverage: media.vote_average,
      });
    }
  };

  const handleAddToLibrary = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In Electron, we'd get the full path. In browser, we simulate it
      const filePath = (file as any).path || `C:\\Users\\{USER}\\Videos\\Movies\\${file.name}`;
      
      addToLibrary({
        mediaId: media.id,
        mediaType,
        filePath,
        addedAt: new Date().toISOString(),
        title,
        posterPath: media.poster_path,
      });
    }
  };

  const handleGoClick = () => {
    const releaseYear = (media.release_date || media.first_air_date || '').split('-')[0];
    const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    const url = `https://pahe.ink/${cleanTitle}-${releaseYear}`;
    setShowWebView(true);
    // In Electron, this would open a webview. For browser, we'll open in new tab
    window.open(url, '_blank');
  };

  const handleWatch = () => {
    if (libraryItem) {
      // In Electron, this would send to the helper app
      console.log(`Opening: ${settings.playerPath} -${libraryItem.filePath}`);
      alert(`Would run: ${settings.playerPath} -${libraryItem.filePath}\n\nThis requires the Electron helper app.`);
    }
  };

  const backdropUrl = getImageUrl(details?.backdrop_path || media.backdrop_path, 'original');
  const posterUrl = getImageUrl(details?.poster_path || media.poster_path, 'w500');
  const releaseDate = details?.release_date || details?.first_air_date || media.release_date || media.first_air_date;
  const runtime = details?.runtime || (details?.episode_run_time?.[0]);
  const genres = details?.genres || [];

  const getRatingClass = (rating: number) => {
    if (rating >= 7) return 'high';
    if (rating >= 5) return 'medium';
    return 'low';
  };

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto animate-fade-in">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,.mp4,.mkv,.avi,.mov,.wmv,.flv,.webm"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Close Button */}
      <button
        onClick={onClose}
        className="fixed top-4 right-4 z-[60] w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center text-foreground hover:bg-accent transition-colors"
        aria-label="Close"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Backdrop */}
      <div className="relative h-[50vh] md:h-[70vh]">
        {backdropUrl ? (
          <img
            src={backdropUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-muted" />
        )}
        <div className="absolute inset-0 hero-gradient" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative -mt-48 md:-mt-64 px-4 md:px-12 pb-24">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
          {/* Poster */}
          <div className="flex-shrink-0 w-48 md:w-64 mx-auto md:mx-0">
            {posterUrl ? (
              <img
                src={posterUrl}
                alt={title}
                className="w-full rounded-lg shadow-lg"
              />
            ) : (
              <div className="w-full aspect-[2/3] rounded-lg bg-muted flex items-center justify-center">
                <span className="text-muted-foreground">No Poster</span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 animate-slide-up">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 text-shadow">{title}</h1>
            
            {details?.tagline && (
              <p className="text-lg text-muted-foreground italic mb-4">{details.tagline}</p>
            )}

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className={cn('rating-badge', getRatingClass(media.vote_average))}>
                <Star className="w-4 h-4" />
                <span className="font-semibold">{media.vote_average.toFixed(1)}</span>
              </div>
              
              {releaseDate && (
                <div className="flex items-center gap-1 text-muted-foreground text-sm">
                  <Calendar className="w-4 h-4" />
                  <span>{releaseDate.split('-')[0]}</span>
                </div>
              )}
              
              {runtime && (
                <div className="flex items-center gap-1 text-muted-foreground text-sm">
                  <Clock className="w-4 h-4" />
                  <span>{runtime} min</span>
                </div>
              )}

              {mediaType === 'tv' && details?.number_of_seasons && (
                <span className="text-muted-foreground text-sm">
                  {details.number_of_seasons} Season{details.number_of_seasons !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* Genres */}
            {genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {genres.map((genre) => (
                  <span
                    key={genre.id}
                    className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mb-6">
              {inLibrary ? (
                <Button onClick={handleWatch} className="gap-2">
                  <Play className="w-4 h-4" />
                  Watch Now
                </Button>
              ) : (
                <Button onClick={handleAddToLibrary} variant="outline" className="gap-2">
                  <FolderOpen className="w-4 h-4" />
                  Add to Library
                </Button>
              )}

              <Button onClick={handleGoClick} variant="secondary" className="gap-2">
                <Download className="w-4 h-4" />
                Go (Download)
              </Button>

              <Button
                onClick={handleWishlistToggle}
                variant={inWishlist ? 'default' : 'outline'}
                className="gap-2"
              >
                {inWishlist ? (
                  <>
                    <Check className="w-4 h-4" />
                    In Wishlist
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Add to Wishlist
                  </>
                )}
              </Button>
            </div>

            {/* Library Info */}
            {libraryItem && (
              <div className="mb-6 p-3 rounded-lg bg-card border border-border">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">File:</span> {libraryItem.filePath}
                </p>
              </div>
            )}

            {/* Overview */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-foreground mb-2">Overview</h2>
              <p className="text-muted-foreground leading-relaxed">
                {details?.overview || media.overview || 'No overview available.'}
              </p>
            </div>

            {/* Cast */}
            {details?.credits?.cast && details.credits.cast.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-foreground mb-3">Cast</h2>
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {details.credits.cast.slice(0, 10).map((actor) => (
                    <div key={actor.id} className="flex-shrink-0 w-20 text-center">
                      {actor.profile_path ? (
                        <img
                          src={getImageUrl(actor.profile_path, 'w200')!}
                          alt={actor.name}
                          className="w-20 h-20 rounded-full object-cover mb-2"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-2">
                          <span className="text-2xl text-muted-foreground">
                            {actor.name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <p className="text-sm font-medium text-foreground truncate">{actor.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{actor.character}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Similar Movies */}
        {details?.similar?.results && details.similar.results.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-semibold text-foreground mb-4">More Like This</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
              {details.similar.results.slice(0, 7).map((item) => (
                <MediaCard
                  key={item.id}
                  media={{ ...item, media_type: mediaType }}
                  onClick={() => onMediaClick({ ...item, media_type: mediaType })}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
