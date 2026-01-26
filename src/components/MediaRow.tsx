import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Media } from '@/types/media';
import { MediaCard } from './MediaCard';
import { cn } from '@/lib/utils';

interface MediaRowProps {
  title: string;
  items: Media[];
  onItemClick: (media: Media) => void;
  isLoading?: boolean;
}

export const MediaRow: React.FC<MediaRowProps> = ({
  title,
  items,
  onItemClick,
  isLoading = false,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    const scrollEl = scrollRef.current;
    if (scrollEl) {
      scrollEl.addEventListener('scroll', checkScroll);
      return () => scrollEl.removeEventListener('scroll', checkScroll);
    }
  }, [items]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const cardWidth = 160; // Approximate card width + gap
      const scrollAmount = cardWidth * 4; // Scroll 4 items at a time
      const newScrollLeft = direction === 'left'
        ? scrollRef.current.scrollLeft - scrollAmount
        : scrollRef.current.scrollLeft + scrollAmount;
      
      scrollRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section className="carousel-container group/row py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-4 md:px-12">
        <h2 className="text-lg md:text-xl font-semibold text-foreground">{title}</h2>
        
        {/* Arrow Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className={cn(
              'carousel-arrow relative',
              'group-hover/row:opacity-100',
              !canScrollLeft && 'opacity-30'
            )}
            style={{ position: 'relative', top: 'auto', transform: 'none' }}
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className={cn(
              'carousel-arrow relative',
              'group-hover/row:opacity-100',
              !canScrollRight && 'opacity-30'
            )}
            style={{ position: 'relative', top: 'auto', transform: 'none' }}
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Scrollable Row */}
      <div
        ref={scrollRef}
        className="carousel-scroll px-4 md:px-12"
      >
        {isLoading ? (
          // Skeleton loaders
          Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-[140px] md:w-[160px] aspect-[2/3] rounded-md skeleton-shimmer"
            />
          ))
        ) : (
          items.map((item) => (
            <div key={`${item.media_type}-${item.id}`} className="flex-shrink-0 w-[140px] md:w-[160px]">
              <MediaCard
                media={item}
                onClick={() => onItemClick(item)}
              />
            </div>
          ))
        )}
      </div>
    </section>
  );
};
