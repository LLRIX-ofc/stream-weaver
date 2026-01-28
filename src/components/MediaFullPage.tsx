import React, { useEffect, useState, useRef } from 'react';
import { X, Play, Plus, Check, Star, Calendar, Clock, FolderOpen, Download, Youtube, Tv } from 'lucide-react';
import { MediaDetails, Media, Video } from '@/types/media';
import { getDetails, getImageUrl } from '@/services/tmdb';
import { useApp } from '@/contexts/AppContext';
import { useTraktSync } from '@/hooks/useTraktSync';
import { MediaCard } from './MediaCard';
import { EpisodePicker } from './EpisodePicker';
import { TraktSignInPrompt } from './TraktSignInPrompt';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { isMobileDevice, launchMediaPlayback, launchInfuse } from '@/lib/device';
import { isElectron } from '@/lib/electron';

interface MediaFullPageProps {
  media: Media;
  onClose: () => void;
  onMediaClick: (media: Media) => void;
  onNavigateToSettings?: () => void;
}

export const MediaFullPage: React.FC<MediaFullPageProps> = ({
  media,
  onClose,
  onMediaClick,
  onNavigateToSettings,
}) => {
  const [details, setDetails] = useState<MediaDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showTrailer, setShowTrailer] = useState(false);
  const [showEpisodes, setShowEpisodes] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  
  const {
    isInWishlist,
    addToWishlist,
    removeFromWishlist,
    isInLibrary,
    addToLibrary,
    getLibraryItem,
    settings,
  } = useApp();

  const {
    isAuthenticated: isTraktAuthenticated,
    showSignInPrompt,
    setShowSignInPrompt,
    syncWishlistToTrakt,
    syncLibraryToTrakt,
    scrobbleToTrakt,
  } = useTraktSync();

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

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showTrailer) {
          setShowTrailer(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose, showTrailer]);

  // Handle click outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleWishlistToggle = async () => {
    if (inWishlist) {
      removeFromWishlist(media.id, mediaType);
    } else {
      // Show prompt if not authenticated
      if (!isTraktAuthenticated) {
        setShowSignInPrompt(true);
      }
      
      addToWishlist({
        mediaId: media.id,
        mediaType,
        addedAt: new Date().toISOString(),
        title,
        posterPath: media.poster_path,
        releaseDate: media.release_date || media.first_air_date,
        voteAverage: media.vote_average,
      });
      
      // Sync to Trakt if authenticated
      if (isTraktAuthenticated) {
        await syncWishlistToTrakt(media.id, mediaType);
      }
    }
  };

  const handleAddToLibrary = () => {
    // Show prompt if not authenticated
    if (!isTraktAuthenticated) {
      setShowSignInPrompt(true);
    }
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const filePath = (file as any).path || `C:\\Users\\{USER}\\Videos\\Movies\\${file.name}`;
      
      addToLibrary({
        mediaId: media.id,
        mediaType,
        filePath,
        addedAt: new Date().toISOString(),
        title,
        posterPath: media.poster_path,
      });
      
      // Sync to Trakt if authenticated
      if (isTraktAuthenticated) {
        await syncLibraryToTrakt(media.id, mediaType);
      }
    }
  };

  const handleGoClick = () => {
    const releaseYear = (media.release_date || media.first_air_date || '').split('-')[0];
    const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    const url = `https://pahe.ink/${cleanTitle}-${releaseYear}`;
    window.open(url, '_blank');
  };

  const handleWatch = async () => {
    if (libraryItem) {
      const isMobile = isMobileDevice();
      
      if (isMobile) {
        // On mobile, use Infuse API
        // For now, we'd need the media server URL - this is a placeholder
        launchInfuse(libraryItem.filePath);
      } else if (isElectron() && window.electronAPI) {
        // On Electron, launch native player
        await window.electronAPI.launchPlayer(settings.playerPath, libraryItem.filePath);
      } else {
        // Browser fallback
        alert(`Would run: ${settings.playerPath} -${libraryItem.filePath}\n\nThis requires the Electron helper app.`);
      }
      
      // Scrobble to Trakt
      if (isTraktAuthenticated) {
        await scrobbleToTrakt(media.id, mediaType);
      }
    }
  };

  const handleEpisodeSelect = async (season: number, episode: number, episodeData: any) => {
    console.log(`Playing S${season}E${episode}: ${episodeData.name}`);
    // In a real implementation, this would link to the library or streaming source
    
    // Scrobble episode to Trakt
    if (isTraktAuthenticated) {
      await scrobbleToTrakt(media.id, mediaType);
    }
  };

  const handleDownloadEpisode = (season: number, episode: number, episodeData: any) => {
    const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const url = `https://pahe.ink/${cleanTitle}-s${String(season).padStart(2, '0')}e${String(episode).padStart(2, '0')}`;
    window.open(url, '_blank');
  };

  const handleGoToSettings = () => {
    setShowSignInPrompt(false);
    onClose();
    onNavigateToSettings?.();
  };

  // Find trailer from videos
  const getTrailer = (): Video | undefined => {
    const videos = details?.videos?.results || [];
    // Prefer official YouTube trailers
    const trailer = videos.find(v => 
      v.site === 'YouTube' && 
      v.type === 'Trailer' && 
      v.official
    ) || videos.find(v => 
      v.site === 'YouTube' && 
      v.type === 'Trailer'
    ) || videos.find(v => 
      v.site === 'YouTube' && 
      (v.type === 'Teaser' || v.type === 'Clip')
    );
    return trailer;
  };

  const trailer = getTrailer();

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
    <>
      {/* Backdrop overlay - click to close */}
      <div 
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-fade-in"
        onClick={handleBackdropClick}
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*,.mp4,.mkv,.avi,.mov,.wmv,.flv,.webm"
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Modal Container */}
        <div 
          ref={modalRef}
          className="fixed inset-4 md:inset-[5%] lg:inset-[10%] xl:inset-[12.5%] z-50 bg-background rounded-xl overflow-hidden shadow-2xl animate-scale-in flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-[60] w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center text-foreground hover:bg-accent transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Backdrop */}
            <div className="relative h-[35vh] md:h-[45vh]">
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
              
              {/* Play Trailer Button on backdrop */}
              {trailer && (
                <button
                  onClick={() => setShowTrailer(true)}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary/90 hover:bg-primary text-primary-foreground flex items-center justify-center transition-all hover:scale-110 shadow-lg"
                  aria-label="Play Trailer"
                >
                  <Play className="w-8 h-8 md:w-10 md:h-10 ml-1" />
                </button>
              )}
            </div>

            {/* Content */}
            <div className="relative -mt-20 md:-mt-28 px-4 md:px-8 pb-8">
              <div className="flex flex-col md:flex-row gap-5 md:gap-6">
                {/* Poster */}
                <div className="flex-shrink-0 w-32 md:w-48 mx-auto md:mx-0">
                  {posterUrl ? (
                    <img
                      src={posterUrl}
                      alt={title}
                      className="w-full rounded-lg shadow-lg"
                    />
                  ) : (
                    <div className="w-full aspect-[2/3] rounded-lg bg-muted flex items-center justify-center">
                      <span className="text-muted-foreground text-sm">No Poster</span>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1.5 text-shadow">{title}</h1>
                  
                  {details?.tagline && (
                    <p className="text-sm md:text-base text-muted-foreground italic mb-3">{details.tagline}</p>
                  )}

                  {/* Meta Info */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <div className={cn('rating-badge text-sm', getRatingClass(media.vote_average))}>
                      <Star className="w-3.5 h-3.5" />
                      <span className="font-semibold">{media.vote_average.toFixed(1)}</span>
                    </div>
                    
                    {releaseDate && (
                      <div className="flex items-center gap-1 text-muted-foreground text-xs md:text-sm">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{releaseDate.split('-')[0]}</span>
                      </div>
                    )}
                    
                    {runtime && (
                      <div className="flex items-center gap-1 text-muted-foreground text-xs md:text-sm">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{runtime} min</span>
                      </div>
                    )}

                    {mediaType === 'tv' && details?.number_of_seasons && (
                      <span className="text-muted-foreground text-xs md:text-sm">
                        {details.number_of_seasons} Season{details.number_of_seasons !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {/* Genres */}
                  {genres.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {genres.map((genre) => (
                        <span
                          key={genre.id}
                          className="px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs"
                        >
                          {genre.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {trailer && (
                      <Button onClick={() => setShowTrailer(true)} size="sm" className="gap-1.5">
                        <Youtube className="w-4 h-4" />
                        Trailer
                      </Button>
                    )}
                    
                    {/* Episode Picker Button for TV Shows */}
                    {mediaType === 'tv' && details?.seasons && (
                      <Button 
                        onClick={() => setShowEpisodes(!showEpisodes)} 
                        variant={showEpisodes ? 'secondary' : 'outline'} 
                        size="sm" 
                        className="gap-1.5"
                      >
                        <Tv className="w-4 h-4" />
                        Episodes
                      </Button>
                    )}
                    
                    {inLibrary ? (
                      <Button onClick={handleWatch} size="sm" className="gap-1.5">
                        <Play className="w-4 h-4" />
                        Watch
                      </Button>
                    ) : (
                      <Button onClick={handleAddToLibrary} variant="outline" size="sm" className="gap-1.5">
                        <FolderOpen className="w-4 h-4" />
                        Add to Library
                      </Button>
                    )}

                    <Button onClick={handleGoClick} variant="secondary" size="sm" className="gap-1.5">
                      <Download className="w-4 h-4" />
                      Download
                    </Button>

                    <Button
                      onClick={handleWishlistToggle}
                      variant={inWishlist ? 'default' : 'outline'}
                      size="sm"
                      className="gap-1.5"
                    >
                      {inWishlist ? (
                        <>
                          <Check className="w-4 h-4" />
                          Wishlist
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          Wishlist
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {/* Episode Picker for TV Shows */}
                  {mediaType === 'tv' && showEpisodes && details?.seasons && (
                    <div className="mb-4 p-4 rounded-lg bg-secondary/30 border border-border">
                      <EpisodePicker
                        showId={media.id}
                        showTitle={title}
                        seasons={details.seasons as any}
                        onEpisodeSelect={handleEpisodeSelect}
                        onDownloadEpisode={handleDownloadEpisode}
                      />
                    </div>
                  )}

                  {/* Library Info */}
                  {libraryItem && (
                    <div className="mb-4 p-2.5 rounded-lg bg-card border border-border">
                      <p className="text-xs text-muted-foreground truncate">
                        <span className="font-medium text-foreground">File:</span> {libraryItem.filePath}
                      </p>
                    </div>
                  )}

                  {/* Overview */}
                  <div className="mb-6">
                    <h2 className="text-sm font-semibold text-foreground mb-1.5">Overview</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {details?.overview || media.overview || 'No overview available.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Cast */}
              {details?.credits?.cast && details.credits.cast.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-sm font-semibold text-foreground mb-2">Cast</h2>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {details.credits.cast.slice(0, 8).map((actor) => (
                      <div key={actor.id} className="flex-shrink-0 w-16 text-center">
                        {actor.profile_path ? (
                          <img
                            src={getImageUrl(actor.profile_path, 'w200')!}
                            alt={actor.name}
                            className="w-14 h-14 rounded-full object-cover mb-1 mx-auto"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-1 mx-auto">
                            <span className="text-lg text-muted-foreground">
                              {actor.name.charAt(0)}
                            </span>
                          </div>
                        )}
                        <p className="text-xs font-medium text-foreground truncate">{actor.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{actor.character}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Similar Movies */}
              {details?.similar?.results && details.similar.results.length > 0 && (
                <section>
                  <h2 className="text-sm font-semibold text-foreground mb-2">More Like This</h2>
                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-2">
                    {details.similar.results.slice(0, 7).map((item) => (
                      <MediaCard
                        key={item.id}
                        media={{ ...item, media_type: mediaType }}
                        onClick={() => onMediaClick({ ...item, media_type: mediaType })}
                        compact
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Trailer Modal */}
      {showTrailer && trailer && (
        <div 
          className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center animate-fade-in"
          onClick={() => setShowTrailer(false)}
        >
          <button
            onClick={() => setShowTrailer(false)}
            className="absolute top-4 right-4 z-[70] w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            aria-label="Close trailer"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div 
            className="w-full max-w-5xl aspect-video mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1&rel=0`}
              title={trailer.name}
              className="w-full h-full rounded-lg"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
      
      {/* Trakt Sign In Prompt */}
      <TraktSignInPrompt
        open={showSignInPrompt}
        onOpenChange={setShowSignInPrompt}
        onGoToSettings={handleGoToSettings}
      />
    </>
  );
};
