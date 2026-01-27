import React from 'react';
import { Check, Plus, Play, Star } from 'lucide-react';
import { Media } from '@/types/media';
import { getImageUrl } from '@/services/tmdb';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';

interface MediaCardProps {
  media: Media;
  onClick: () => void;
  showWatchButton?: boolean;
  onWatch?: () => void;
  compact?: boolean;
}

export const MediaCard: React.FC<MediaCardProps> = ({
  media,
  onClick,
  showWatchButton = false,
  onWatch,
  compact = false,
}) => {
  const { isInWishlist, addToWishlist, removeFromWishlist, isInLibrary } = useApp();
  
  const title = media.title || media.name || 'Unknown';
  const releaseDate = media.release_date || media.first_air_date;
  const year = releaseDate ? releaseDate.split('-')[0] : '';
  const mediaType = media.media_type || 'movie';
  const inWishlist = isInWishlist(media.id, mediaType);
  const inLibrary = isInLibrary(media.id, mediaType);
  const posterUrl = getImageUrl(media.poster_path, 'w300');

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (inWishlist) {
      removeFromWishlist(media.id, mediaType);
    } else {
      addToWishlist({
        mediaId: media.id,
        mediaType,
        addedAt: new Date().toISOString(),
        title,
        posterPath: media.poster_path,
        releaseDate,
        voteAverage: media.vote_average,
      });
    }
  };

  const handleWatchClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onWatch?.();
  };

  const getRatingClass = (rating: number) => {
    if (rating >= 7) return 'high';
    if (rating >= 5) return 'medium';
    return 'low';
  };

  return (
    <div className={cn('media-card group', compact && 'compact')} onClick={onClick}>
      {/* Poster Image */}
      {posterUrl ? (
        <img
          src={posterUrl}
          alt={title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full bg-muted flex items-center justify-center">
          <span className="text-muted-foreground text-xs text-center px-1">{title}</span>
        </div>
      )}

      {/* Wishlist Button */}
      {!compact && (
        <button
          className={cn('wishlist-btn', inWishlist && 'active')}
          onClick={handleWishlistClick}
          aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          {inWishlist ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </button>
      )}

      {/* Library Badge */}
      {inLibrary && !compact && (
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-primary/90 text-primary-foreground text-xs font-medium">
          In Library
        </div>
      )}

      {/* Overlay */}
      <div className="media-card-overlay">
        <div className="absolute bottom-0 left-0 right-0 p-2 md:p-3">
          <h3 className={cn('font-semibold text-foreground line-clamp-2 mb-0.5', compact ? 'text-xs' : 'text-sm mb-1')}>{title}</h3>
          {!compact && (
            <div className="flex items-center gap-2">
              {year && <span className="text-xs text-muted-foreground">{year}</span>}
              <div className={cn('rating-badge', getRatingClass(media.vote_average))}>
                <Star className="w-3 h-3" />
                <span>{media.vote_average.toFixed(1)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Watch Button (for library items) */}
      {showWatchButton && inLibrary && (
        <div className="watch-btn">
          <button
            onClick={handleWatchClick}
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <Play className="w-5 h-5" />
            Watch
          </button>
        </div>
      )}
    </div>
  );
};
