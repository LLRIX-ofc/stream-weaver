import React from 'react';
import { Library, Play, Trash2, Film, Tv } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { getImageUrl } from '@/services/tmdb';
import { Button } from '@/components/ui/button';
import { Media } from '@/types/media';
import { cn } from '@/lib/utils';

interface LibraryPageProps {
  onMediaClick: (media: Media) => void;
}

export const LibraryPage: React.FC<LibraryPageProps> = ({ onMediaClick }) => {
  const { library, removeFromLibrary, settings } = useApp();

  const handleWatch = (filePath: string) => {
    // In Electron, this would send to the helper app
    console.log(`Opening: ${settings.playerPath} -${filePath}`);
    alert(`Would run: ${settings.playerPath} -${filePath}\n\nThis requires the Electron helper app.`);
  };

  const handleRemove = (mediaId: number, mediaType: 'movie' | 'tv') => {
    if (confirm('Are you sure you want to remove this from your library?')) {
      removeFromLibrary(mediaId, mediaType);
    }
  };

  const handleCardClick = (item: typeof library[0], e: React.MouseEvent) => {
    // Only navigate if not clicking watch button
    const target = e.target as HTMLElement;
    if (!target.closest('.watch-overlay')) {
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
    }
  };

  return (
    <div className="min-h-screen pt-20 md:pt-24 px-4 md:px-12 pb-24 md:pb-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
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
            {library.map((item) => {
              const posterUrl = getImageUrl(item.posterPath, 'w300');

              return (
                <div
                  key={`${item.mediaType}-${item.mediaId}`}
                  className="group relative rounded-lg overflow-hidden bg-card cursor-pointer transition-all duration-300 hover:scale-105 hover:z-10"
                  onClick={(e) => handleCardClick(item, e)}
                  style={{ boxShadow: 'var(--shadow-md)' }}
                >
                  {/* Poster */}
                  <div className="aspect-[2/3] relative">
                    {posterUrl ? (
                      <img
                        src={posterUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
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
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-background/80 backdrop-blur-sm flex items-center gap-1">
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
                    <div className="watch-overlay absolute inset-0 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleWatch(item.filePath);
                        }}
                        className="gap-2"
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
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(item.mediaId, item.mediaType);
                    }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-destructive/80 text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Remove from library"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
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
