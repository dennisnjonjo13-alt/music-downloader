import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Download, Music, Play, Pause, Volume2, VolumeX, ChevronLeft, ChevronRight, Loader2, AlertCircle, X } from 'lucide-react';

const GENRES = ['pop', 'hip-hop', 'r&b', 'rock', 'electronic', 'dance', 'country', 'latin', 'jazz', 'classical', 'k-pop', 'reggae'];

interface Track {
  videoId: string;
  title: string;
  thumbnail: string;
  author: { name: string };
  timestamp?: string;
  views?: number;
  ago?: string;
}

interface SearchResponse {
  results: Track[];
  totalResults: number;
  page: number;
  totalPages: number;
}

interface DownloadState {
  videoId: string;
  loading: boolean;
  error: string | null;
}

export default function App() {
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState('pop');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [downloadState, setDownloadState] = useState<DownloadState | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const fetchTracks = useCallback(async (q: string, g: string, p: number) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ q, genre: g, page: String(p), limit: '12' });
      const res = await fetch(`/api/search?${params}`);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data: SearchResponse = await res.json();
      setTracks(data.results || []);
      setTotalPages(data.totalPages || 1);
    } catch (e: any) {
      setError(e.message || 'Failed to load tracks.');
      setTracks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchTracks('', genre, 1);
  }, []);

  // Genre change
  const handleGenreChange = (g: string) => {
    setGenre(g);
    setQuery('');
    setPage(1);
    fetchTracks('', g, 1);
  };

  // Search input with debounce
  const handleSearch = (value: string) => {
    setQuery(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setPage(1);
      fetchTracks(value, genre, 1);
    }, 500);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    setPage(1);
    fetchTracks(query, genre, 1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchTracks(query, genre, newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePlay = (videoId: string) => {
    if (playingId === videoId) {
      setPlayingId(null);
    } else {
      setPlayingId(videoId);
    }
  };

  const handleDownload = async (track: Track, isAudioOnly: boolean) => {
    setDownloadState({ videoId: track.videoId, loading: true, error: null });
    try {
      const res = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: track.videoId,
          isAudioOnly,
          quality: '720',
          format: isAudioOnly ? 'mp3' : 'mp4',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Download failed');

      const ext = isAudioOnly ? 'mp3' : 'mp4';
      const fileName = `${track.title.replace(/[^a-z0-9]/gi, '_').substring(0, 60)}.${ext}`;
      const streamUrl = `/api/stream-file?url=${encodeURIComponent(data.downloadUrl)}&name=${encodeURIComponent(fileName)}`;

      const a = document.createElement('a');
      a.href = streamUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      showToast(`Download started: ${track.title}`);
      setDownloadState(null);
    } catch (e: any) {
      setDownloadState({ videoId: track.videoId, loading: false, error: e.message });
      showToast(`Download failed: ${e.message}`);
      setTimeout(() => setDownloadState(null), 4000);
    }
  };

  const formatViews = (views?: number) => {
    if (!views) return '';
    if (views >= 1_000_000_000) return `${(views / 1_000_000_000).toFixed(1)}B views`;
    if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M views`;
    if (views >= 1_000) return `${(views / 1_000).toFixed(0)}K views`;
    return `${views} views`;
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gray-900/95 backdrop-blur border-b border-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <Music className="text-purple-400 w-7 h-7" />
            <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              SoundWave
            </span>
          </div>
          <form onSubmit={handleSearchSubmit} className="flex-1 w-full max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search songs, artists…"
                className="w-full bg-gray-800 border border-gray-700 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-purple-500 transition"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => handleSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Genre tabs */}
        <div className="max-w-7xl mx-auto px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
          {GENRES.map((g) => (
            <button
              key={g}
              onClick={() => handleGenreChange(g)}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium capitalize transition ${
                genre === g && !query
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </header>

      {/* YouTube embed player */}
      {playingId && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-gray-700 p-3 flex items-center gap-3 shadow-2xl">
          <img
            src={`https://img.youtube.com/vi/${playingId}/default.jpg`}
            alt="Now playing"
            className="w-12 h-12 rounded object-cover"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 truncate">Now Playing</p>
          </div>
          <button
            onClick={() => setMuted((m) => !m)}
            className="text-gray-400 hover:text-white transition"
            title={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <button
            onClick={() => setPlayingId(null)}
            className="text-gray-400 hover:text-white transition"
            title="Stop"
          >
            <X className="w-5 h-5" />
          </button>
          <iframe
            ref={iframeRef}
            src={`https://www.youtube.com/embed/${playingId}?autoplay=1&mute=${muted ? 1 : 0}`}
            allow="autoplay; encrypted-media"
            className="w-0 h-0 opacity-0 absolute"
            title="player"
          />
        </div>
      )}

      {/* Main content */}
      <main className={`max-w-7xl mx-auto px-4 py-6 ${playingId ? 'pb-24' : ''}`}>
        {/* Status bar */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm text-gray-400">
            {query ? `Results for "${query}"` : `Top ${genre.toUpperCase()} tracks`}
          </h2>
          {!loading && tracks.length > 0 && (
            <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 bg-red-900/40 border border-red-700 rounded-lg p-4 mb-4 text-red-300">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-gray-800 rounded-xl overflow-hidden animate-pulse">
                <div className="aspect-video bg-gray-700" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-gray-700 rounded w-3/4" />
                  <div className="h-3 bg-gray-700 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Track grid */}
        {!loading && tracks.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {tracks.map((track) => {
              const isPlaying = playingId === track.videoId;
              const isDownloading = downloadState?.videoId === track.videoId && downloadState.loading;

              return (
                <div
                  key={track.videoId}
                  className={`bg-gray-800 rounded-xl overflow-hidden border transition hover:border-purple-600 ${
                    isPlaying ? 'border-purple-500 ring-1 ring-purple-500' : 'border-gray-700'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-gray-900 group cursor-pointer" onClick={() => handlePlay(track.videoId)}>
                    <img
                      src={track.thumbnail || `https://img.youtube.com/vi/${track.videoId}/0.jpg`}
                      alt={track.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${track.videoId}/0.jpg`;
                      }}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      {isPlaying ? (
                        <Pause className="w-10 h-10 text-white drop-shadow" />
                      ) : (
                        <Play className="w-10 h-10 text-white drop-shadow" />
                      )}
                    </div>
                    {track.timestamp && (
                      <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
                        {track.timestamp}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <p className="text-sm font-medium leading-snug line-clamp-2 mb-1" title={track.title}>
                      {track.title}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{track.author?.name}</p>
                    {(track.views || track.ago) && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {formatViews(track.views)}{track.views && track.ago ? ' · ' : ''}{track.ago}
                      </p>
                    )}

                    {/* Download buttons */}
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleDownload(track, true)}
                        disabled={isDownloading}
                        className="flex-1 flex items-center justify-center gap-1 bg-purple-700 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs py-1.5 rounded-lg transition"
                        title="Download MP3"
                      >
                        {isDownloading ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Download className="w-3 h-3" />
                        )}
                        MP3
                      </button>
                      <button
                        onClick={() => handleDownload(track, false)}
                        disabled={isDownloading}
                        className="flex-1 flex items-center justify-center gap-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs py-1.5 rounded-lg transition"
                        title="Download MP4"
                      >
                        {isDownloading ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Download className="w-3 h-3" />
                        )}
                        MP4
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {!loading && tracks.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-24 text-gray-500">
            <Music className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-lg">No tracks found</p>
            <p className="text-sm mt-1">Try a different search or genre</p>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-8">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
              className="flex items-center gap-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-sm transition"
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <span className="text-sm text-gray-400">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages}
              className="flex items-center gap-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-sm transition"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </main>

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-gray-800 border border-gray-600 text-white text-sm px-5 py-3 rounded-full shadow-xl max-w-sm text-center">
          {toast}
        </div>
      )}
    </div>
  );
}
