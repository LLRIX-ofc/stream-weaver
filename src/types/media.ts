export interface Media {
  id: number;
  title: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids: number[];
  media_type?: 'movie' | 'tv';
  adult?: boolean;
  original_language?: string;
  certification?: string;
}

export interface MediaDetails extends Media {
  runtime?: number;
  episode_run_time?: number[];
  status?: string;
  tagline?: string;
  genres?: { id: number; name: string }[];
  production_companies?: { id: number; name: string; logo_path: string | null }[];
  spoken_languages?: { english_name: string; iso_639_1: string; name: string }[];
  budget?: number;
  revenue?: number;
  number_of_seasons?: number;
  number_of_episodes?: number;
  seasons?: {
    id: number;
    name: string;
    season_number: number;
    episode_count: number;
    air_date: string | null;
    poster_path: string | null;
  }[];
  networks?: { id: number; name: string; logo_path: string | null }[];
  created_by?: { id: number; name: string; profile_path: string | null }[];
  credits?: {
    cast: CastMember[];
    crew: CrewMember[];
  };
  videos?: {
    results: Video[];
  };
  similar?: {
    results: Media[];
  };
  recommendations?: {
    results: Media[];
  };
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export interface Video {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
}

export interface Genre {
  id: number;
  name: string;
}

export interface LibraryItem {
  mediaId: number;
  mediaType: 'movie' | 'tv';
  filePath: string;
  addedAt: string;
  title: string;
  posterPath: string | null;
}

export interface WishlistItem {
  mediaId: number;
  mediaType: 'movie' | 'tv';
  addedAt: string;
  title: string;
  posterPath: string | null;
  releaseDate?: string;
  voteAverage: number;
}

export type MediaType = 'movie' | 'tv' | 'all';

// Age ratings available for filtering
export type AgeRating = 'G' | 'PG' | 'PG-13' | 'R' | 'NC-17';

export const AGE_RATINGS: AgeRating[] = ['G', 'PG', 'PG-13', 'R', 'NC-17'];

// Map age ratings to TMDB certification values
export const AGE_RATING_CERTIFICATIONS: Record<AgeRating, string[]> = {
  'G': ['G'],
  'PG': ['PG'],
  'PG-13': ['PG-13'],
  'R': ['R'],
  'NC-17': ['NC-17'],
};

export interface SearchFilters {
  type: MediaType;
  minRating: number;
  minYear: number | null;
  maxYear: number | null;
  sortBy: 'popularity.desc' | 'vote_average.desc' | 'release_date.desc' | 'title.asc';
  genres: number[];
  ageRatings: AgeRating[];
}
