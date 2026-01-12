import { useLives } from '@/hooks/useLives';
import { LiveStream } from '@/hooks/useLiveRealtime';
import { CategoryId } from '@/components/CategoryFilter';
import { Users, Play } from 'lucide-react';

interface LivesListProps {
  category?: CategoryId;
  onSelectLive: (live: LiveStream) => void;
  selectedLiveId?: string;
}

export function LivesList({ category, onSelectLive, selectedLiveId }: LivesListProps) {
  const { lives, loading } = useLives({ category });

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 p-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="aspect-[3/4] bg-secondary/50 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (lives.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
          <Play className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Nenhuma live ativa</h3>
        <p className="text-sm text-muted-foreground">
          Seja o primeiro a iniciar uma live!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 p-4">
      {lives.map((live) => {
        const isSelected = live.id === selectedLiveId;
        const streamerName = live.streamer?.display_name || live.streamer?.username || 'Streamer';
        const thumbnail = live.thumbnail_url || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400';
        
        return (
          <button
            key={live.id}
            onClick={() => onSelectLive(live)}
            className={`relative aspect-[3/4] rounded-xl overflow-hidden group transition-all ${
              isSelected ? 'ring-2 ring-primary scale-[1.02]' : ''
            }`}
          >
            <img 
              src={thumbnail}
              alt={live.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
            
            {/* Live badge */}
            <div className="absolute top-2 left-2 px-2 py-0.5 bg-destructive rounded-full flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-white uppercase">Live</span>
            </div>

            {/* Viewers count */}
            <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/50 backdrop-blur-sm rounded-full flex items-center gap-1">
              <Users className="w-3 h-3 text-white" />
              <span className="text-[10px] font-medium text-white">
                {live.viewers_count?.toLocaleString() || 0}
              </span>
            </div>

            {/* Streamer info */}
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <div className="flex items-center gap-2 mb-1">
                <img 
                  src={live.streamer?.avatar_url || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=50'}
                  alt={streamerName}
                  className="w-6 h-6 rounded-full object-cover border border-white/30"
                />
                <span className="text-xs font-semibold text-white truncate">
                  {streamerName}
                </span>
                {live.streamer?.is_vip && (
                  <span className="text-[8px] bg-primary px-1 py-0.5 rounded text-primary-foreground font-bold">
                    VIP
                  </span>
                )}
              </div>
              <p className="text-[11px] text-white/80 truncate">{live.title}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
