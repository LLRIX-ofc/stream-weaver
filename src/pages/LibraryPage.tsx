import React from 'react';
import { Library, Play, Trash2, Film, Tv } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { getImageUrl } from '@/services/tmdb';
import { Button } from '@/components/ui/button';
import { Media } from '@/types/media';
import { cn } from '@/lib/utils';
import { isMobileDevice, launchInfuse } from '@/lib/device';
import { isElectron } from '@/lib/electron';
import { useTraktSync } from '@/hooks/useTraktSync';

interface LibraryPageProps {
  onMediaClick: (media: Media) => void;
}

export const LibraryPage: React.FC<LibraryPageProps> = ({ onMediaClick }) => {
  const { library, removeFromLibrary, settings } = useApp();
  const { scrobbleToTrakt, isAuthenticated: isTraktAuthenticated } = useTraktSync();

  const handleWatch = async (e: React.MouseEvent, filePath: string, mediaId: number, mediaType: 'movie' | 'tv') => {
    e.stopPropagation();
    const isMobile = isMobileDevice();
    
    if (isMobile) {
      // On mobile, use Infuse API
      launchInfuse(filePath);
    } else if (isElectron() && window.electronAPI) {
      // On Electron, launch native player
      await window.electronAPI.launchPlayer(settings.playerPath, filePath);
    } else {
      // Browser fallback
      alert(`Would run: ${settings.playerPath} -${filePath}\n\nThis requires the Electron helper app or a mobile device with Infuse.`);
    }
    
    // Scrobble to Trakt if authenticated
    if (isTraktAuthenticated) {
      await scrobbleToTrakt(mediaId, mediaType);
    }
  };

  const handleRemove = (e: React.MouseEvent, mediaId: number, mediaType: 'movie' | 'tv') => {
    e.stopPropagation();
    if (confirm('Are you sure you want to remove this from your library?')) {
      removeFromLibrary(mediaId, mediaType);
    }
  };

  const handleCardClick = (item: typeof library[0]) => {
    // Create a Media object and pass to onMediaClick
    const media: Media = {
      id: item.mediaId,
      title: item.title,
      name: item.title,
      overview: '',
      poster_path: item.posterPath,
      backdrop_path: null,
      vote_average: 0,
      vote_count: 0,
      popularity: 0,
      genre_ids: [],
      media_type: item.mediaType,
    };
    onMediaClick(media);
  };

  return (
    <div className="min-h-screen pt-20 md:pt-24 px-4 md:px-12 pb-24 md:pb-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8 animate-fade-in">
        <div className="flex items-center gap-3 mb-2">
          <Library className="w-8 h-8 text-primary" />
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">My Library</h1>
        </div>
        <p className="text-muted-foreground">
          {library.length} {library.length === 1 ? 'item' : 'items'} in your library
        </p>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto">
        {library.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {library.map((item, index) => {
              const posterUrl = getImageUrl(item.posterPath, 'w300');

              return (
                <div
                  key={`${item.mediaType}-${item.mediaId}`}
                  className="group relative rounded-xl overflow-hidden bg-card cursor-pointer transition-all duration-300 hover:scale-105 hover:z-10 hover:shadow-xl animate-fade-in"
                  style={{ 
                    boxShadow: 'var(--shadow-md)',
                    animationDelay: `${index * 50}ms`
                  }}
                  onClick={() => handleCardClick(item)}
                >
                  {/* Poster */}
                  <div className="aspect-[2/3] relative">
                    {posterUrl ? (
                      <img
                        src={posterUrl}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <span className="text-muted-foreground text-sm text-center px-2">
                          {item.title}
                        </span>
                      </div>
                    )}

                    {/* Type Badge */}
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-background/80 backdrop-blur-sm flex items-center gap-1 transition-transform group-hover:scale-110">
                      {item.mediaType === 'movie' ? (
                        <Film className="w-3 h-3 text-primary" />
                      ) : (
                        <Tv className="w-3 h-3 text-primary" />
                      )}
                      <span className="text-xs font-medium text-foreground">
                        {item.mediaType === 'movie' ? 'Movie' : 'TV'}
                      </span>
                    </div>

                    {/* Watch Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                      <Button
                        onClick={(e) => handleWatch(e, item.filePath, item.mediaId, item.mediaType)}
                        className="gap-2 shadow-lg transition-transform hover:scale-110"
                        size="lg"
                      >
                        <Play className="w-5 h-5" />
                        Watch
                      </Button>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <h3 className="font-medium text-foreground text-sm mb-1 line-clamp-1">
                      {item.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-1" title={item.filePath}>
                      {item.filePath.split('\\').pop() || item.filePath}
                    </p>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={(e) => handleRemove(e, item.mediaId, item.mediaType)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-destructive/80 text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-destructive hover:scale-110"
                    aria-label="Remove from library"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 animate-fade-in">
            <Library className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-xl text-muted-foreground mb-2">Your library is empty</p>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Add movies and TV shows to your library by clicking "Add to Library" on any title's detail page and selecting the video file
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
