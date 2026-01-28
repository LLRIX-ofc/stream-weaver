import React, { useState, useEffect } from 'react';
import { ChevronDown, Play, Download, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getImageUrl } from '@/services/tmdb';
import { cn } from '@/lib/utils';

interface Episode {
  id: number;
  name: string;
  overview: string;
  episode_number: number;
  season_number: number;
  still_path: string | null;
  air_date: string;
  runtime: number | null;
  vote_average: number;
}

interface Season {
  id: number;
  name: string;
  season_number: number;
  episode_count: number;
  air_date: string | null;
  poster_path: string | null;
}

interface EpisodePickerProps {
  showId: number;
  showTitle: string;
  seasons: Season[];
  onEpisodeSelect: (season: number, episode: number, episodeData: Episode) => void;
  onDownloadEpisode: (season: number, episode: number, episodeData: Episode) => void;
  watchedEpisodes?: { season: number; episode: number }[];
}

const TMDB_API_KEY = '2dca580c2a14b55200e784d157207b4d';

export const EpisodePicker: React.FC<EpisodePickerProps> = ({
  showId,
  showTitle,
  seasons,
  onEpisodeSelect,
  onDownloadEpisode,
  watchedEpisodes = [],
}) => {
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filter out "Specials" season (season 0) for cleaner UI
  const regularSeasons = seasons.filter(s => s.season_number > 0);

  useEffect(() => {
    const fetchEpisodes = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `https://api.themoviedb.org/3/tv/${showId}/season/${selectedSeason}?api_key=${TMDB_API_KEY}`
        );
        const data = await response.json();
        setEpisodes(data.episodes || []);
      } catch (error) {
        console.error('Failed to fetch episodes:', error);
        setEpisodes([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (selectedSeason) {
      fetchEpisodes();
    }
  }, [showId, selectedSeason]);

  const isEpisodeWatched = (season: number, episode: number) => {
    return watchedEpisodes.some(w => w.season === season && w.episode === episode);
  };

  return (
    <div className="space-y-4">
      {/* Season Selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-foreground">Season:</span>
        <Select
          value={selectedSeason.toString()}
          onValueChange={(v) => setSelectedSeason(parseInt(v))}
        >
          <SelectTrigger className="w-48 bg-secondary border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {regularSeasons.map((season) => (
              <SelectItem key={season.id} value={season.season_number.toString()}>
                {season.name} ({season.episode_count} episodes)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Episodes List */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 rounded-lg bg-secondary animate-pulse" />
            ))}
          </div>
        ) : episodes.length > 0 ? (
          episodes.map((episode) => {
            const watched = isEpisodeWatched(selectedSeason, episode.episode_number);
            const stillUrl = getImageUrl(episode.still_path, 'w300');

            return (
              <div
                key={episode.id}
                className={cn(
                  'flex gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors group',
                  watched && 'bg-primary/10 border border-primary/20'
                )}
              >
                {/* Episode Thumbnail */}
                <div className="relative flex-shrink-0 w-32 h-20 rounded-md overflow-hidden bg-muted">
                  {stillUrl ? (
                    <img
                      src={stillUrl}
                      alt={episode.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                      No Image
                    </div>
                  )}
                  
                  {/* Play overlay */}
                  <button
                    onClick={() => onEpisodeSelect(selectedSeason, episode.episode_number, episode)}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <Play className="w-8 h-8 text-white" />
                  </button>

                  {/* Episode number badge */}
                  <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-white text-xs font-medium">
                    E{episode.episode_number}
                  </div>

                  {/* Watched badge */}
                  {watched && (
                    <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                </div>

                {/* Episode Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-medium text-foreground text-sm line-clamp-1">
                        {episode.episode_number}. {episode.name}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        {episode.air_date && (
                          <span>{new Date(episode.air_date).toLocaleDateString()}</span>
                        )}
                        {episode.runtime && (
                          <span>• {episode.runtime} min</span>
                        )}
                        {episode.vote_average > 0 && (
                          <span>• ★ {episode.vote_average.toFixed(1)}</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => onDownloadEpisode(selectedSeason, episode.episode_number, episode)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>

                  {episode.overview && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {episode.overview}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-center text-muted-foreground py-8">
            No episodes available for this season.
          </p>
        )}
      </div>
    </div>
  );
};
