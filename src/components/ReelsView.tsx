import { useState, useEffect } from 'react';
import { Heart, MessageCircle, Gift, X, Play, Music2, Pickaxe } from 'lucide-react';
import { MIMOS } from '@/lib/mockData';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import crisexToken from '@/assets/crisex-token.png';

interface ReelsViewProps {
  balance: number;
  setBalance: (updater: (prev: number) => number) => void;
}

interface Reel {
  id: string;
  creator_id: string;
  video_url: string | null;
  thumbnail_url: string;
  description: string | null;
  audio_name: string | null;
  likes_count: number;
  comments_count: number;
  views_count: number;
  creator: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

export function ReelsView({ balance, setBalance }: ReelsViewProps) {
  const { user } = useAuth();
  const [reels, setReels] = useState<Reel[]>([]);
  const [currentReel, setCurrentReel] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [likedReels, setLikedReels] = useState<Set<string>>(new Set());
  const [isFollowing, setIsFollowing] = useState(false);
  const [showMimos, setShowMimos] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch reels from database
  useEffect(() => {
    const fetchReels = async () => {
      const { data, error } = await supabase
        .from('reels')
        .select(`
          *,
          creator:profiles!reels_creator_id_fkey(username, display_name, avatar_url)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching reels:', error);
      } else if (data) {
        setReels(data);
      }
      setLoading(false);
    };

    fetchReels();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('reels-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reels' }, () => {
        fetchReels();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Fetch user's likes
  useEffect(() => {
    if (!user) return;

    const fetchLikes = async () => {
      const { data } = await supabase
        .from('reels_likes')
        .select('reel_id')
        .eq('user_id', user.id);

      if (data) {
        setLikedReels(new Set(data.map(like => like.reel_id)));
      }
    };

    fetchLikes();
  }, [user]);

  const reel = reels[currentReel];

  const handleScroll = (direction: 'up' | 'down') => {
    if (direction === 'down' && currentReel < reels.length - 1) { 
      setCurrentReel(prev => prev + 1); 
    } else if (direction === 'up' && currentReel > 0) { 
      setCurrentReel(prev => prev - 1); 
    }
  };

  const handleLike = async () => {
    if (!user || !reel) return;

    const isLiked = likedReels.has(reel.id);

    if (isLiked) {
      // Unlike
      await supabase
        .from('reels_likes')
        .delete()
        .eq('reel_id', reel.id)
        .eq('user_id', user.id);

      setLikedReels(prev => {
        const next = new Set(prev);
        next.delete(reel.id);
        return next;
      });
    } else {
      // Like
      await supabase
        .from('reels_likes')
        .insert({ reel_id: reel.id, user_id: user.id });

      setLikedReels(prev => new Set(prev).add(reel.id));
    }
  };

  const sendMimo = (mimo: typeof MIMOS[0]) => {
    if (balance >= mimo.price) { 
      setBalance(prev => prev - mimo.price); 
      setShowMimos(false); 
    }
  };

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-black">
        <div className="animate-pulse text-white">Carregando...</div>
      </div>
    );
  }

  if (!reel) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-black">
        <div className="text-white text-center">
          <p className="text-lg mb-2">Nenhum reel disponível</p>
          <p className="text-sm text-white/60">Seja o primeiro a criar um!</p>
        </div>
      </div>
    );
  }

  const isLiked = likedReels.has(reel.id);
  const creatorName = reel.creator?.display_name || reel.creator?.username || 'Usuário';
  const creatorAvatar = reel.creator?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100';

  return (
    <div className="h-full w-full relative overflow-hidden bg-black">
      {/* Video/Image Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-500" 
        style={{ backgroundImage: `url(${reel.thumbnail_url})` }} 
        onClick={() => setIsPlaying(!isPlaying)}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      </div>

      {/* Touch zones for navigation */}
      <div className="absolute top-0 bottom-24 left-0 w-1/3 z-10" onClick={(e) => { e.stopPropagation(); handleScroll('up'); }} />
      <div className="absolute top-0 bottom-24 right-0 w-1/3 z-10" onClick={(e) => { e.stopPropagation(); handleScroll('down'); }} />

      {/* Play/Pause indicator */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="w-20 h-20 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center animate-scale-in">
            <Play className="w-10 h-10 text-white ml-1" />
          </div>
        </div>
      )}

      {/* Top left - Viewer count */}
      <div className="absolute top-4 left-4 z-30">
        <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full">
          <img src={crisexToken} alt="CRISEX" className="w-4 h-4" />
          <span className="text-white text-sm font-semibold">{reel.views_count}</span>
        </div>
      </div>

      {/* Right side actions */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col items-center gap-5 z-30">
        {/* Profile avatar */}
        <div className="relative">
          <div className="w-12 h-12 rounded-full p-[2px] bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500">
            <img 
              src={creatorAvatar} 
              alt={creatorName} 
              className="w-full h-full rounded-full object-cover border-2 border-black" 
            />
          </div>
        </div>

        {/* Mining button */}
        <button className="flex flex-col items-center gap-1">
          <div className="w-11 h-11 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center">
            <Pickaxe className="w-5 h-5 text-white" />
          </div>
          <span className="text-[10px] text-white font-semibold">MINING</span>
        </button>

        {/* Like button */}
        <button 
          onClick={handleLike} 
          className="flex flex-col items-center gap-1"
        >
          <Heart 
            className={`w-8 h-8 transition-all ${isLiked ? 'text-red-500 fill-red-500' : 'text-white'}`} 
          />
          <span className="text-white text-xs font-semibold">
            {(reel.likes_count / 1000).toFixed(1)}K
          </span>
        </button>

        {/* Comments button */}
        <button className="flex flex-col items-center gap-1">
          <MessageCircle className="w-8 h-8 text-white" />
          <span className="text-white text-xs font-semibold">{reel.comments_count}</span>
        </button>

        {/* Mimo button */}
        <button 
          onClick={() => setShowMimos(true)} 
          className="flex flex-col items-center gap-1"
        >
          <div className="w-11 h-11 bg-gradient-to-br from-pink-500 to-rose-600 rounded-full flex items-center justify-center">
            <Gift className="w-5 h-5 text-white" />
          </div>
          <span className="text-[10px] text-white font-semibold">MIMO</span>
        </button>
      </div>

      {/* Bottom left - Creator info */}
      <div className="absolute bottom-4 left-4 right-20 z-20">
        {/* Creator name and follow button */}
        <div className="flex items-center gap-2 mb-2">
          <img 
            src={creatorAvatar} 
            alt={creatorName} 
            className="w-10 h-10 rounded-full object-cover border-2 border-white/30" 
          />
          <span className="font-bold text-white text-base">@{creatorName.toLowerCase().replace(' ', '')}</span>
          {!isFollowing && (
            <button 
              onClick={() => setIsFollowing(true)} 
              className="px-3 py-1 bg-primary rounded-md text-xs font-bold text-white"
            >
              SEGUIR
            </button>
          )}
        </div>

        {/* Description */}
        <p className="text-white text-sm leading-relaxed mb-3 line-clamp-2">
          {reel.description || 'Sem descrição'}
        </p>

        {/* Audio info */}
        <div className="flex items-center gap-2">
          <Music2 className="w-3.5 h-3.5 text-white" />
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="text-xs text-white/80 truncate">
              {reel.audio_name || 'ORIGINAL AUDIO'} - {creatorName.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Mimos Modal */}
      {showMimos && (
        <div className="absolute inset-0 z-50 flex items-end" onClick={() => setShowMimos(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div 
            className="relative w-full bg-card rounded-t-3xl p-6 animate-slide-up" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-6" />
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-foreground">Enviar Mimo 🎁</h3>
              <div className="px-3 py-1.5 bg-secondary rounded-full flex items-center gap-2">
                <img src={crisexToken} alt="CRISEX" className="w-4 h-4" />
                <span className="text-sm font-bold text-foreground">{balance.toLocaleString()}</span>
              </div>
            </div>
            <div className="grid grid-cols-5 gap-3">
              {MIMOS.map((mimo) => (
                <button 
                  key={mimo.id} 
                  onClick={() => sendMimo(mimo)} 
                  disabled={balance < mimo.price} 
                  className={`flex flex-col items-center p-3 rounded-xl transition-all active:scale-95 ${balance >= mimo.price ? 'bg-secondary hover:bg-secondary/80' : 'opacity-40'}`}
                >
                  <span className="text-3xl mb-1">{mimo.icon}</span>
                  <span className="text-xs font-semibold text-foreground">{mimo.price}</span>
                </button>
              ))}
            </div>
            <button 
              onClick={() => setShowMimos(false)} 
              className="absolute top-4 right-4 w-8 h-8 bg-secondary rounded-full flex items-center justify-center"
            >
              <X className="w-4 h-4 text-foreground" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
