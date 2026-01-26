import React from 'react';
import { Heart, Star, Calendar, Trash2 } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { MediaCard } from '@/components/MediaCard';
import { Button } from '@/components/ui/button';
import { Media } from '@/types/media';

interface WishlistPageProps {
  onMediaClick: (media: Media) => void;
}

export const WishlistPage: React.FC<WishlistPageProps> = ({ onMediaClick }) => {
  const { wishlist, removeFromWishlist } = useApp();

  const handleRemove = (mediaId: number, mediaType: 'movie' | 'tv') => {
    removeFromWishlist(mediaId, mediaType);
  };

  // Convert wishlist items to Media format for MediaCard
  const wishlistAsMedia: Media[] = wishlist.map((item) => ({
    id: item.mediaId,
    title: item.title,
    name: item.title,
    overview: '',
    poster_path: item.posterPath,
    backdrop_path: null,
    release_date: item.releaseDate,
    first_air_date: item.releaseDate,
    vote_average: item.voteAverage,
    vote_count: 0,
    popularity: 0,
    genre_ids: [],
    media_type: item.mediaType,
  }));

  return (
    <div className="min-h-screen pt-20 md:pt-24 px-4 md:px-12 pb-24 md:pb-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Heart className="w-8 h-8 text-primary" />
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">My Wishlist</h1>
        </div>
        <p className="text-muted-foreground">
          {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} saved
        </p>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto">
        {wishlist.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
            {wishlistAsMedia.map((item) => (
              <MediaCard
                key={`${item.media_type}-${item.id}`}
                media={item}
                onClick={() => onMediaClick(item)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-xl text-muted-foreground mb-2">Your wishlist is empty</p>
            <p className="text-sm text-muted-foreground">
              Click the + button on any movie or TV show to add it here
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
