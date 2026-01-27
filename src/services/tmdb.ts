import { Media, MediaDetails, SearchFilters, Genre, AgeRating } from '@/types/media';

const TMDB_API_KEY = '2dca580c2a14b55200e784d157207b4d';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

export const getImageUrl = (path: string | null, size: 'w200' | 'w300' | 'w500' | 'w780' | 'original' = 'w500') => {
  if (!path) return null;
  return `${IMAGE_BASE_URL}/${size}${path}`;
};

const fetchTMDB = async <T>(endpoint: string, params: Record<string, string | number> = {}): Promise<T> => {
  const searchParams = new URLSearchParams({
    api_key: TMDB_API_KEY,
    ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
  });
  
  const response = await fetch(`${BASE_URL}${endpoint}?${searchParams}`);
  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status}`);
  }
  return response.json();
};

export interface TMDBResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

// Trending
export const getTrending = async (mediaType: 'movie' | 'tv' | 'all' = 'all', timeWindow: 'day' | 'week' = 'week') => {
  const data = await fetchTMDB<TMDBResponse<Media>>(`/trending/${mediaType}/${timeWindow}`);
  return data.results.map(item => ({
    ...item,
    media_type: item.media_type || mediaType as 'movie' | 'tv',
  }));
};

// Popular
export const getPopular = async (mediaType: 'movie' | 'tv' = 'movie', page = 1) => {
  const data = await fetchTMDB<TMDBResponse<Media>>(`/${mediaType}/popular`, { page });
  return data.results.map(item => ({ ...item, media_type: mediaType }));
};

// Now Playing / On Air
export const getNowPlaying = async (mediaType: 'movie' | 'tv' = 'movie', page = 1) => {
  const endpoint = mediaType === 'movie' ? '/movie/now_playing' : '/tv/on_the_air';
  const data = await fetchTMDB<TMDBResponse<Media>>(endpoint, { page });
  return data.results.map(item => ({ ...item, media_type: mediaType }));
};

// Upcoming (only movies with release dates in the future)
export const getUpcoming = async (page = 1) => {
  const today = new Date().toISOString().split('T')[0];
  const futureDate = new Date();
  futureDate.setMonth(futureDate.getMonth() + 6);
  const maxDate = futureDate.toISOString().split('T')[0];
  
  const data = await fetchTMDB<TMDBResponse<Media>>('/discover/movie', { 
    page,
    'primary_release_date.gte': today,
    'primary_release_date.lte': maxDate,
    sort_by: 'primary_release_date.asc',
  });
  return data.results.map(item => ({ ...item, media_type: 'movie' as const }));
};

// Top Rated
export const getTopRated = async (mediaType: 'movie' | 'tv' = 'movie', page = 1) => {
  const data = await fetchTMDB<TMDBResponse<Media>>(`/${mediaType}/top_rated`, { page });
  return data.results.map(item => ({ ...item, media_type: mediaType }));
};

// Get Airing This Season (TV shows currently airing)
export const getAiringToday = async (page = 1) => {
  const data = await fetchTMDB<TMDBResponse<Media>>('/tv/airing_today', { page });
  return data.results.map(item => ({ ...item, media_type: 'tv' as const }));
};

// Get Details
export const getDetails = async (id: number, mediaType: 'movie' | 'tv') => {
  const data = await fetchTMDB<MediaDetails>(`/${mediaType}/${id}`, {
    append_to_response: 'credits,videos,similar,recommendations',
  });
  return { ...data, media_type: mediaType };
};

// Search
export const searchMedia = async (
  query: string,
  filters: SearchFilters,
  page = 1
): Promise<{ results: Media[]; totalPages: number; totalResults: number }> => {
  if (query.trim()) {
    // Search with query
    const endpoint = filters.type === 'all' ? '/search/multi' : `/search/${filters.type}`;
    const data = await fetchTMDB<TMDBResponse<Media>>(endpoint, { query, page });
    
    let results = data.results.filter(item => {
      // Filter by type if needed
      if (filters.type !== 'all' && item.media_type && item.media_type !== filters.type) {
        return false;
      }
      // Filter out people from multi search
      if ((item as any).media_type === 'person') return false;
      return true;
    });

    // Apply rating filter
    if (filters.minRating > 0) {
      results = results.filter(item => item.vote_average >= filters.minRating);
    }

    // Apply year filter
    results = results.filter(item => {
      const releaseDate = item.release_date || item.first_air_date;
      if (!releaseDate) return true;
      const year = parseInt(releaseDate.split('-')[0]);
      if (filters.minYear && year < filters.minYear) return false;
      if (filters.maxYear && year > filters.maxYear) return false;
      return true;
    });

    // Apply genre filter
    if (filters.genres.length > 0) {
      results = results.filter(item => 
        item.genre_ids?.some(gid => filters.genres.includes(gid))
      );
    }

    return {
      results: results.map(item => ({
        ...item,
        media_type: item.media_type || filters.type as 'movie' | 'tv',
      })),
      totalPages: data.total_pages,
      totalResults: data.total_results,
    };
  } else {
    // Discover without query
    const mediaType = filters.type === 'all' ? 'movie' : filters.type;
    const params: Record<string, string | number> = {
      page,
      sort_by: filters.sortBy,
    };

    if (filters.minRating > 0) {
      params['vote_average.gte'] = filters.minRating;
      params['vote_count.gte'] = 100; // Ensure enough votes for reliability
    }

    if (filters.minYear) {
      const dateField = mediaType === 'movie' ? 'primary_release_date.gte' : 'first_air_date.gte';
      params[dateField] = `${filters.minYear}-01-01`;
    }

    if (filters.maxYear) {
      const dateField = mediaType === 'movie' ? 'primary_release_date.lte' : 'first_air_date.lte';
      params[dateField] = `${filters.maxYear}-12-31`;
    }

    // Genre filter
    if (filters.genres.length > 0) {
      params['with_genres'] = filters.genres.join(',');
    }

    // Age rating / certification filter (US certifications)
    if (filters.ageRatings.length > 0) {
      params['certification_country'] = 'US';
      params['certification'] = filters.ageRatings.join('|');
    }

    const data = await fetchTMDB<TMDBResponse<Media>>(`/discover/${mediaType}`, params);
    
    return {
      results: data.results.map(item => ({ ...item, media_type: mediaType })),
      totalPages: data.total_pages,
      totalResults: data.total_results,
    };
  }
};

// Get Genres
export const getGenres = async (mediaType: 'movie' | 'tv' = 'movie'): Promise<Genre[]> => {
  const data = await fetchTMDB<{ genres: Genre[] }>(`/genre/${mediaType}/list`);
  return data.genres;
};

// Get all genres (movie + tv combined, deduplicated)
export const getAllGenres = async (): Promise<Genre[]> => {
  const [movieGenres, tvGenres] = await Promise.all([
    getGenres('movie'),
    getGenres('tv'),
  ]);
  
  const genreMap = new Map<number, Genre>();
  [...movieGenres, ...tvGenres].forEach(g => genreMap.set(g.id, g));
  return Array.from(genreMap.values()).sort((a, b) => a.name.localeCompare(b.name));
};
