import React, { useEffect, useState } from 'react';
import { Play, Clock } from 'lucide-react';
import { ContinueWatchingItem } from '@/hooks/useTraktSync';
import { getImageUrl, getDetails } from '@/services/tmdb';
import { Media } from '@/types/media';
import { cn } from '@/lib/utils';

interface ContinueWatchingRowProps {
  items: ContinueWatchingItem[];
  onItemClick: (media: Media) => void;
  isLoading?: boolean;
}

export const ContinueWatchingRow: React.FC<ContinueWatchingRowProps> = ({
  items,
  onItemClick,
  isLoading = false,
}) => {
  const [enrichedItems, setEnrichedItems] = useState<(ContinueWatchingItem & { posterPath?: string })[]>([]);

  // Fetch poster paths for items that don't have them
  useEffect(() => {
    const enrichItems = async () => {
      const enriched = await Promise.all(
        items.map(async (item) => {
          if (item.posterPath) return item;
          
          try {
            const details = await getDetails(item.mediaId, item.mediaType);
            return { ...item, posterPath: details.poster_path };
          } catch {
            return item;
          }
        })
      );
      setEnrichedItems(enriched);
    };

    if (items.length > 0) {
      enrichItems();
    }
  }, [items]);

  if (items.length === 0 && !isLoading) {
    return null;
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const handleClick = (item: ContinueWatchingItem) => {
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
    onItemClick(media);
  };

  return (
    <section className="px-4 md:px-12 py-6">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-primary" />
        <h2 className="text-lg md:text-xl font-semibold text-foreground">Continue Watching</h2>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
        {isLoading ? (
          [...Array(5)].map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-64 h-36 rounded-lg bg-secondary animate-pulse"
            />
          ))
        ) : (
          enrichedItems.map((item) => {
            const posterUrl = getImageUrl(item.posterPath, 'w500');

            return (
              <div
                key={`${item.mediaType}-${item.mediaId}-${item.watchedAt}`}
                className="flex-shrink-0 w-64 group cursor-pointer"
                onClick={() => handleClick(item)}
              >
                {/* Card */}
                <div className="relative h-36 rounded-lg overflow-hidden bg-muted">
                  {posterUrl ? (
                    <img
                      src={posterUrl}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      {item.title}
                    </div>
                  )}

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                  {/* Play Button */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                      <Play className="w-6 h-6 text-primary-foreground ml-0.5" />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h3 className="font-medium text-white text-sm line-clamp-1">{item.title}</h3>
                    {item.episodeInfo && (
                      <p className="text-xs text-white/70 mt-0.5">
                        S{item.episodeInfo.season}:E{item.episodeInfo.episode} - {item.episodeInfo.episodeTitle}
                      </p>
                    )}
                    <p className="text-xs text-white/50 mt-1">
                      {formatTimeAgo(item.watchedAt)}
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};
