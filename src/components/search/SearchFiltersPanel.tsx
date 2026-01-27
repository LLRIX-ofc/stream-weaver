import React from 'react';
import { Star, Calendar, Film, X, RotateCcw } from 'lucide-react';
import { SearchFilters, MediaType, Genre, AgeRating, AGE_RATINGS } from '@/types/media';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface SearchFiltersPanelProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  genres: Genre[];
  onClearFilters: () => void;
}

const typeOptions: { value: MediaType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'movie', label: 'Movies' },
  { value: 'tv', label: 'TV Shows' },
];

const sortOptions = [
  { value: 'popularity.desc', label: 'Most Popular' },
  { value: 'vote_average.desc', label: 'Highest Rated' },
  { value: 'release_date.desc', label: 'Newest First' },
  { value: 'title.asc', label: 'Title A-Z' },
];

const ratingOptions = [
  { value: 0, label: 'Any' },
  { value: 5, label: '5+' },
  { value: 6, label: '6+' },
  { value: 7, label: '7+' },
  { value: 8, label: '8+' },
  { value: 9, label: '9+' },
];

const currentYear = new Date().getFullYear();

export const SearchFiltersPanel: React.FC<SearchFiltersPanelProps> = ({
  filters,
  onFiltersChange,
  genres,
  onClearFilters,
}) => {
  const handleTypeChange = (type: MediaType) => {
    onFiltersChange({ ...filters, type });
  };

  const handleGenreToggle = (genreId: number) => {
    const newGenres = filters.genres.includes(genreId)
      ? filters.genres.filter(g => g !== genreId)
      : [...filters.genres, genreId];
    onFiltersChange({ ...filters, genres: newGenres });
  };

  const handleAgeRatingToggle = (rating: AgeRating) => {
    const newRatings = filters.ageRatings.includes(rating)
      ? filters.ageRatings.filter(r => r !== rating)
      : [...filters.ageRatings, rating];
    onFiltersChange({ ...filters, ageRatings: newRatings });
  };

  const hasActiveFilters = 
    filters.type !== 'all' ||
    filters.minRating > 0 ||
    filters.minYear !== null ||
    filters.maxYear !== null ||
    filters.genres.length > 0 ||
    filters.ageRatings.length > 0 ||
    filters.sortBy !== 'popularity.desc';

  return (
    <div className="space-y-5 p-5 rounded-xl bg-card/80 backdrop-blur-sm border border-border/50 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Film className="w-4 h-4 text-primary" />
          Filters & Sorting
        </h3>
        {hasActiveFilters && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClearFilters}
            className="text-muted-foreground hover:text-foreground gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </Button>
        )}
      </div>

      {/* Type & Sort Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Type Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Content Type</label>
          <div className="flex gap-1.5 p-1 bg-secondary/50 rounded-lg">
            {typeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleTypeChange(option.value)}
                className={cn(
                  'flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200',
                  filters.type === option.value
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sort By */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Sort By</label>
          <Select
            value={filters.sortBy}
            onValueChange={(v) => onFiltersChange({ ...filters, sortBy: v as SearchFilters['sortBy'] })}
          >
            <SelectTrigger className="bg-secondary/50 border-border/50 h-9">
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

      {/* Rating & Year Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Rating Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5" />
            Min Rating
          </label>
          <div className="flex gap-1 p-1 bg-secondary/50 rounded-lg">
            {ratingOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onFiltersChange({ ...filters, minRating: option.value })}
                className={cn(
                  'flex-1 px-2 py-1 text-xs font-medium rounded transition-all duration-200',
                  filters.minRating === option.value
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Year Range */}
        <div className="sm:col-span-2 space-y-2">
          <label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            Release Year
          </label>
          <div className="flex gap-2 items-center">
            <Input
              type="number"
              placeholder="From"
              min="1900"
              max={currentYear}
              value={filters.minYear || ''}
              onChange={(e) => onFiltersChange({
                ...filters,
                minYear: e.target.value ? parseInt(e.target.value) : null,
              })}
              className="bg-secondary/50 border-border/50 h-9 text-sm"
            />
            <span className="text-muted-foreground text-sm">to</span>
            <Input
              type="number"
              placeholder="To"
              min="1900"
              max={currentYear + 5}
              value={filters.maxYear || ''}
              onChange={(e) => onFiltersChange({
                ...filters,
                maxYear: e.target.value ? parseInt(e.target.value) : null,
              })}
              className="bg-secondary/50 border-border/50 h-9 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Age Ratings */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">
          Age Rating
          {filters.ageRatings.length === 0 && (
            <span className="text-xs ml-2 text-muted-foreground/70">(All)</span>
          )}
        </label>
        <div className="flex flex-wrap gap-2">
          {AGE_RATINGS.map((rating) => (
            <button
              key={rating}
              onClick={() => handleAgeRatingToggle(rating)}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-full border transition-all duration-200',
                filters.ageRatings.includes(rating)
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-secondary/30 text-muted-foreground border-border/50 hover:border-primary/50 hover:text-foreground'
              )}
            >
              {rating}
            </button>
          ))}
        </div>
      </div>

      {/* Genres */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-muted-foreground">
            Genres
            {filters.genres.length > 0 && (
              <span className="ml-2 text-xs text-primary">({filters.genres.length} selected)</span>
            )}
          </label>
          {filters.genres.length > 0 && (
            <button
              onClick={() => onFiltersChange({ ...filters, genres: [] })}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {genres.map((genre) => (
            <button
              key={genre.id}
              onClick={() => handleGenreToggle(genre.id)}
              className={cn(
                'px-2.5 py-1 text-xs font-medium rounded-md border transition-all duration-200',
                filters.genres.includes(genre.id)
                  ? 'bg-primary/90 text-primary-foreground border-primary shadow-sm'
                  : 'bg-secondary/20 text-muted-foreground border-border/30 hover:border-primary/40 hover:text-foreground hover:bg-secondary/40'
              )}
            >
              {genre.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
