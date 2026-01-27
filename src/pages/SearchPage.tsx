import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, SlidersHorizontal, Loader2 } from 'lucide-react';
import { Media, SearchFilters, Genre } from '@/types/media';
import { searchMedia, getAllGenres } from '@/services/tmdb';
import { MediaCard } from '@/components/MediaCard';
import { SearchFiltersPanel } from '@/components/search/SearchFiltersPanel';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SearchPageProps {
  onMediaClick: (media: Media) => void;
}

const defaultFilters: SearchFilters = {
  type: 'all',
  minRating: 0,
  minYear: null,
  maxYear: null,
  sortBy: 'popularity.desc',
  genres: [],
  ageRatings: [],
};

export const SearchPage: React.FC<SearchPageProps> = ({ onMediaClick }) => {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [results, setResults] = useState<Media[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [genres, setGenres] = useState<Genre[]>([]);
  
  const loaderRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Load genres on mount
  useEffect(() => {
    getAllGenres().then(setGenres).catch(console.error);
  }, []);

  const performSearch = useCallback(async (page = 1, append = false) => {
    if (page === 1) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    setHasSearched(true);
    
    try {
      const data = await searchMedia(query, filters, page);
      
      if (append) {
        setResults(prev => [...prev, ...data.results]);
      } else {
        setResults(data.results);
      }
      
      setTotalResults(data.totalResults);
      setTotalPages(data.totalPages);
      setCurrentPage(page);
    } catch (error) {
      console.error('Search failed:', error);
      if (!append) setResults([]);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [query, filters]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !isLoading && !isLoadingMore && currentPage < totalPages && hasSearched) {
          performSearch(currentPage + 1, true);
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [currentPage, totalPages, isLoading, isLoadingMore, hasSearched, performSearch]);

  // Auto-search when filters change (after initial search) with debounce
  useEffect(() => {
    if (hasSearched) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(1, false);
      }, 300);
      return () => {
        if (searchTimeoutRef.current) {
          clearTimeout(searchTimeoutRef.current);
        }
      };
    }
  }, [filters, hasSearched]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(1, false);
  };

  const handleClearFilters = () => {
    setFilters(defaultFilters);
  };

  const activeFilterCount = [
    filters.type !== 'all',
    filters.minRating > 0,
    filters.minYear !== null,
    filters.maxYear !== null,
    filters.genres.length > 0,
    filters.ageRatings.length > 0,
    filters.sortBy !== 'popularity.desc',
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen pt-20 md:pt-24 px-4 md:px-12 pb-24 md:pb-8">
      {/* Search Header */}
      <div className="max-w-4xl mx-auto mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-5">Discover</h1>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search movies and TV shows..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 h-11 bg-card/80 border-border/50 text-foreground placeholder:text-muted-foreground rounded-xl"
            />
          </div>
          <Button type="submit" size="lg" className="h-11 px-6 rounded-xl">
            Search
          </Button>
          <Button
            type="button"
            variant={showFilters ? 'secondary' : 'outline'}
            size="lg"
            className={cn(
              'h-11 rounded-xl relative',
              showFilters && 'bg-primary/10 border-primary/50'
            )}
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="w-5 h-5" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary text-primary-foreground text-xs font-medium rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </form>

        {/* Filters Panel */}
        {showFilters && (
          <SearchFiltersPanel
            filters={filters}
            onFiltersChange={setFilters}
            genres={genres}
            onClearFilters={handleClearFilters}
          />
        )}
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto">
        {isLoading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
            {Array.from({ length: 21 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[2/3] rounded-lg skeleton-shimmer"
              />
            ))}
          </div>
        ) : hasSearched ? (
          <>
            {results.length > 0 ? (
              <>
                <p className="text-muted-foreground mb-4 text-sm">
                  Found {totalResults.toLocaleString()} results
                  {currentPage < totalPages && (
                    <span className="text-muted-foreground/70"> · Showing {results.length}</span>
                  )}
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
                  {results.map((item, index) => (
                    <MediaCard
                      key={`${item.media_type}-${item.id}-${index}`}
                      media={item}
                      onClick={() => onMediaClick(item)}
                    />
                  ))}
                </div>
                
                {/* Infinite scroll loader */}
                <div ref={loaderRef} className="flex justify-center py-8">
                  {isLoadingMore && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Loading more...</span>
                    </div>
                  )}
                  {currentPage >= totalPages && results.length > 0 && (
                    <p className="text-muted-foreground/60 text-sm">
                      You've reached the end
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-16">
                <p className="text-xl text-muted-foreground mb-2">No results found</p>
                <p className="text-sm text-muted-foreground/70">
                  Try adjusting your search or filters
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-40" />
            <p className="text-xl text-muted-foreground mb-2">Search for movies and TV shows</p>
            <p className="text-sm text-muted-foreground/70 mb-6">
              Or use filters to discover content without searching
            </p>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowFilters(true);
                performSearch(1, false);
              }}
              className="rounded-xl"
            >
              Browse All Movies
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
