import React, { useState, useEffect, useCallback } from 'react';
import { Search, SlidersHorizontal, X, Star, Calendar } from 'lucide-react';
import { Media, SearchFilters, MediaType } from '@/types/media';
import { searchMedia } from '@/services/tmdb';
import { MediaCard } from '@/components/MediaCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
};

export const SearchPage: React.FC<SearchPageProps> = ({ onMediaClick }) => {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [results, setResults] = useState<Media[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [totalResults, setTotalResults] = useState(0);

  const performSearch = useCallback(async () => {
    setIsLoading(true);
    setHasSearched(true);
    try {
      const data = await searchMedia(query, filters);
      setResults(data.results);
      setTotalResults(data.totalResults);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [query, filters]);

  // Auto-search when filters change (after initial search)
  useEffect(() => {
    if (hasSearched) {
      const timeout = setTimeout(performSearch, 300);
      return () => clearTimeout(timeout);
    }
  }, [filters, hasSearched, performSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch();
  };

  const handleClearFilters = () => {
    setFilters(defaultFilters);
  };

  const typeOptions: { value: MediaType; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'movie', label: 'Movies Only' },
    { value: 'tv', label: 'TV Shows Only' },
  ];

  const sortOptions = [
    { value: 'popularity.desc', label: 'Most Popular' },
    { value: 'vote_average.desc', label: 'Highest Rated' },
    { value: 'release_date.desc', label: 'Newest First' },
    { value: 'title.asc', label: 'Title A-Z' },
  ];

  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen pt-20 md:pt-24 px-4 md:px-12 pb-24 md:pb-8">
      {/* Search Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-6">Search</h1>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search movies and TV shows..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 h-12 bg-card border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <Button type="submit" size="lg" className="h-12">
            Search
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="h-12"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="w-5 h-5" />
          </Button>
        </form>

        {/* Filters Panel */}
        {showFilters && (
          <div className="p-4 rounded-lg bg-card border border-border animate-scale-in mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Filters & Sorting</h3>
              <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                Clear All
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Type Filter */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Type
                </label>
                <div className="flex gap-2">
                  {typeOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setFilters({ ...filters, type: option.value })}
                      className={cn('filter-chip', filters.type === option.value && 'active')}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rating Filter */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  <Star className="w-4 h-4 inline mr-1" />
                  Minimum Rating
                </label>
                <Select
                  value={String(filters.minRating)}
                  onValueChange={(v) => setFilters({ ...filters, minRating: Number(v) })}
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Any Rating</SelectItem>
                    <SelectItem value="5">5+ Stars</SelectItem>
                    <SelectItem value="6">6+ Stars</SelectItem>
                    <SelectItem value="7">7+ Stars</SelectItem>
                    <SelectItem value="8">8+ Stars</SelectItem>
                    <SelectItem value="9">9+ Stars</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Year Range */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Release Year (Min - Max)
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="From"
                    min="1900"
                    max={currentYear}
                    value={filters.minYear || ''}
                    onChange={(e) => setFilters({
                      ...filters,
                      minYear: e.target.value ? parseInt(e.target.value) : null,
                    })}
                    className="bg-secondary border-border"
                  />
                  <Input
                    type="number"
                    placeholder="To"
                    min="1900"
                    max={currentYear + 5}
                    value={filters.maxYear || ''}
                    onChange={(e) => setFilters({
                      ...filters,
                      maxYear: e.target.value ? parseInt(e.target.value) : null,
                    })}
                    className="bg-secondary border-border"
                  />
                </div>
              </div>

              {/* Sort By */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Sort By
                </label>
                <Select
                  value={filters.sortBy}
                  onValueChange={(v) => setFilters({ ...filters, sortBy: v as SearchFilters['sortBy'] })}
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto">
        {isLoading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
            {Array.from({ length: 14 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[2/3] rounded-md skeleton-shimmer"
              />
            ))}
          </div>
        ) : hasSearched ? (
          <>
            {results.length > 0 ? (
              <>
                <p className="text-muted-foreground mb-4">
                  Found {totalResults.toLocaleString()} results
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
                  {results.map((item) => (
                    <MediaCard
                      key={`${item.media_type}-${item.id}`}
                      media={item}
                      onClick={() => onMediaClick(item)}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-xl text-muted-foreground mb-2">No results found</p>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your search or filters
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-xl text-muted-foreground mb-2">Search for movies and TV shows</p>
            <p className="text-sm text-muted-foreground">
              Or use filters to discover content without searching
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
