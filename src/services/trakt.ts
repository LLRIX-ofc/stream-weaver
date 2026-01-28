// Trakt.tv API Service
// Documentation: https://trakt.docs.apiary.io/

const TRAKT_API_URL = 'https://api.trakt.tv';
const TRAKT_API_VERSION = '2';

// Deep link redirect URI for Electron
export const TRAKT_REDIRECT_URI = 'movieapp://trakt-callback';

export interface TraktConfig {
  clientId: string;
  clientSecret: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
}

export interface TraktMovie {
  title: string;
  year: number;
  ids: {
    trakt: number;
    slug: string;
    imdb?: string;
    tmdb?: number;
  };
}

export interface TraktShow {
  title: string;
  year: number;
  ids: {
    trakt: number;
    slug: string;
    imdb?: string;
    tmdb?: number;
    tvdb?: number;
  };
}

export interface TraktWatchlistItem {
  rank: number;
  id: number;
  listed_at: string;
  notes: string | null;
  type: 'movie' | 'show';
  movie?: TraktMovie;
  show?: TraktShow;
}

export interface TraktHistoryItem {
  id: number;
  watched_at: string;
  action: 'scrobble' | 'checkin' | 'watch';
  type: 'movie' | 'episode';
  movie?: TraktMovie;
  episode?: {
    season: number;
    number: number;
    title: string;
    ids: { trakt: number; tvdb?: number; imdb?: string; tmdb?: number };
  };
  show?: TraktShow;
}

class TraktService {
  private config: TraktConfig | null = null;
  
  constructor() {
    this.loadConfig();
  }

  private loadConfig() {
    const stored = localStorage.getItem('movieapp_trakt');
    if (stored) {
      this.config = JSON.parse(stored);
    }
  }

  private saveConfig() {
    if (this.config) {
      localStorage.setItem('movieapp_trakt', JSON.stringify(this.config));
    } else {
      localStorage.removeItem('movieapp_trakt');
    }
  }

  setCredentials(clientId: string, clientSecret: string) {
    this.config = {
      clientId,
      clientSecret,
    };
    this.saveConfig();
  }

  isConfigured(): boolean {
    return !!(this.config?.clientId && this.config?.clientSecret);
  }

  isAuthenticated(): boolean {
    if (!this.config?.accessToken) return false;
    if (this.config.expiresAt && Date.now() > this.config.expiresAt) {
      return false; // Token expired
    }
    return true;
  }

  getAuthUrl(redirectUri?: string): string {
    if (!this.config?.clientId) {
      throw new Error('Trakt client ID not configured');
    }
    const uri = redirectUri || TRAKT_REDIRECT_URI;
    return `https://trakt.tv/oauth/authorize?response_type=code&client_id=${this.config.clientId}&redirect_uri=${encodeURIComponent(uri)}`;
  }

  // Get the redirect URI (for Electron deep link registration)
  getRedirectUri(): string {
    return TRAKT_REDIRECT_URI;
  }

  async exchangeCode(code: string, redirectUri: string): Promise<boolean> {
    if (!this.config?.clientId || !this.config?.clientSecret) {
      throw new Error('Trakt not configured');
    }

    try {
      const response = await fetch(`${TRAKT_API_URL}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to exchange code');
      }

      const data = await response.json();
      this.config.accessToken = data.access_token;
      this.config.refreshToken = data.refresh_token;
      this.config.expiresAt = Date.now() + (data.expires_in * 1000);
      this.saveConfig();
      return true;
    } catch (error) {
      console.error('Trakt auth error:', error);
      return false;
    }
  }

  async refreshAccessToken(): Promise<boolean> {
    if (!this.config?.refreshToken || !this.config?.clientId || !this.config?.clientSecret) {
      return false;
    }

    try {
      const response = await fetch(`${TRAKT_API_URL}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: this.config.refreshToken,
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          redirect_uri: 'urn:ietf:wg:oauth:2.0:oob',
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      this.config.accessToken = data.access_token;
      this.config.refreshToken = data.refresh_token;
      this.config.expiresAt = Date.now() + (data.expires_in * 1000);
      this.saveConfig();
      return true;
    } catch {
      return false;
    }
  }

  private async fetchTrakt<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.config?.clientId) {
      throw new Error('Trakt not configured');
    }

    // Check if token needs refresh
    if (this.config.expiresAt && Date.now() > this.config.expiresAt - 60000) {
      await this.refreshAccessToken();
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'trakt-api-key': this.config.clientId,
      'trakt-api-version': TRAKT_API_VERSION,
      ...(options.headers as Record<string, string>),
    };

    if (this.config.accessToken) {
      headers['Authorization'] = `Bearer ${this.config.accessToken}`;
    }

    const response = await fetch(`${TRAKT_API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`Trakt API error: ${response.status}`);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  // Get user's watchlist
  async getWatchlist(): Promise<TraktWatchlistItem[]> {
    return this.fetchTrakt<TraktWatchlistItem[]>('/users/me/watchlist');
  }

  // Get user's watch history
  async getHistory(type: 'movies' | 'shows' = 'movies', page = 1, limit = 20): Promise<TraktHistoryItem[]> {
    return this.fetchTrakt<TraktHistoryItem[]>(`/users/me/history/${type}?page=${page}&limit=${limit}`);
  }

  // Add movie/show to watchlist
  async addToWatchlist(tmdbId: number, type: 'movie' | 'show'): Promise<boolean> {
    try {
      const body = type === 'movie'
        ? { movies: [{ ids: { tmdb: tmdbId } }] }
        : { shows: [{ ids: { tmdb: tmdbId } }] };

      await this.fetchTrakt('/sync/watchlist', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      return true;
    } catch {
      return false;
    }
  }

  // Remove from watchlist
  async removeFromWatchlist(tmdbId: number, type: 'movie' | 'show'): Promise<boolean> {
    try {
      const body = type === 'movie'
        ? { movies: [{ ids: { tmdb: tmdbId } }] }
        : { shows: [{ ids: { tmdb: tmdbId } }] };

      await this.fetchTrakt('/sync/watchlist/remove', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      return true;
    } catch {
      return false;
    }
  }

  // Mark as watched
  async markAsWatched(tmdbId: number, type: 'movie' | 'show'): Promise<boolean> {
    try {
      const body = type === 'movie'
        ? { movies: [{ ids: { tmdb: tmdbId }, watched_at: new Date().toISOString() }] }
        : { shows: [{ ids: { tmdb: tmdbId }, watched_at: new Date().toISOString() }] };

      await this.fetchTrakt('/sync/history', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      return true;
    } catch {
      return false;
    }
  }

  // Get trending movies
  async getTrending(type: 'movies' | 'shows' = 'movies', page = 1, limit = 20): Promise<any[]> {
    return this.fetchTrakt<any[]>(`/${type}/trending?page=${page}&limit=${limit}`);
  }

  // Get popular movies
  async getPopular(type: 'movies' | 'shows' = 'movies', page = 1, limit = 20): Promise<any[]> {
    return this.fetchTrakt<any[]>(`/${type}/popular?page=${page}&limit=${limit}`);
  }

  // Search
  async search(query: string, type: 'movie' | 'show' | 'movie,show' = 'movie,show'): Promise<any[]> {
    return this.fetchTrakt<any[]>(`/search/${type}?query=${encodeURIComponent(query)}`);
  }

  // Disconnect/logout
  disconnect() {
    if (this.config) {
      // Keep clientId and clientSecret, just remove tokens
      this.config.accessToken = undefined;
      this.config.refreshToken = undefined;
      this.config.expiresAt = undefined;
      this.saveConfig();
    }
  }

  // Clear all config
  clearConfig() {
    this.config = null;
    localStorage.removeItem('movieapp_trakt');
  }

  getConfig(): TraktConfig | null {
    return this.config;
  }
}

// Export singleton instance
export const traktService = new TraktService();
