import { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Gift, X, Play, Music2, Pickaxe, Send, Plus, Upload, Video, Image } from 'lucide-react';
import { MIMOS } from '@/lib/mockData';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { CategoryFilter, CategorySelector, CategoryId, CATEGORIES } from '@/components/CategoryFilter';
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
  categories: string[] | null;
  creator: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user: {
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
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [loading, setLoading] = useState(true);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  
  // Category filter
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('mulheres');
  
  // Create reel states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newReel, setNewReel] = useState({ description: '', audio_name: '' });
  const [newReelCategories, setNewReelCategories] = useState<CategoryId[]>([]);
  const [reelThumbnail, setReelThumbnail] = useState<File | null>(null);
  const [reelVideo, setReelVideo] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Fetch reels from database filtered by category
  useEffect(() => {
    const fetchReels = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('reels')
        .select(`
          *,
          creator:profiles!reels_creator_id_fkey(username, display_name, avatar_url)
        `)
        .eq('is_active', true)
        .contains('categories', [selectedCategory])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching reels:', error);
      } else if (data) {
        setReels(data);
        setCurrentReel(0);
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
  }, [selectedCategory]);

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

  // Fetch comments when modal opens
  useEffect(() => {
    if (!showComments || !reel) return;

    const fetchComments = async () => {
      setLoadingComments(true);
      const { data, error } = await supabase
        .from('reels_comments')
        .select(`
          id,
          content,
          created_at,
          user:profiles!reels_comments_user_id_fkey(username, display_name, avatar_url)
        `)
        .eq('reel_id', reel.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching comments:', error);
      } else if (data) {
        setComments(data);
      }
      setLoadingComments(false);
    };

    fetchComments();

    // Subscribe to realtime comments
    const channel = supabase
      .channel(`comments-${reel.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'reels_comments',
        filter: `reel_id=eq.${reel.id}`
      }, async (payload) => {
        // Fetch the new comment with user data
        const { data } = await supabase
          .from('reels_comments')
          .select(`
            id,
            content,
            created_at,
            user:profiles!reels_comments_user_id_fkey(username, display_name, avatar_url)
          `)
          .eq('id', payload.new.id)
          .single();

        if (data) {
          setComments(prev => [...prev, data]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [showComments, reels, currentReel]);

  // Auto scroll to bottom when new comment
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

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
      await supabase
        .from('reels_likes')
        .insert({ reel_id: reel.id, user_id: user.id });

      setLikedReels(prev => new Set(prev).add(reel.id));
    }
  };

  const handleSendComment = async () => {
    if (!user || !reel || !newComment.trim()) return;

    const { error } = await supabase
      .from('reels_comments')
      .insert({
        reel_id: reel.id,
        user_id: user.id,
        content: newComment.trim()
      });

    if (error) {
      console.error('Error sending comment:', error);
    } else {
      setNewComment('');
    }
  };

  const sendMimo = (mimo: typeof MIMOS[0]) => {
    if (balance >= mimo.price) { 
      setBalance(prev => prev - mimo.price); 
      setShowMimos(false); 
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `${diffMins}min`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}d`;
  };

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReelThumbnail(file);
      const reader = new FileReader();
      reader.onloadend = () => setThumbnailPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReelVideo(file);
    }
  };

  const handleCreateReel = async () => {
    if (!user || !reelThumbnail) {
      toast({ title: "Erro", description: "Adicione uma thumbnail para o reel.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      // Upload thumbnail
      const thumbnailExt = reelThumbnail.name.split('.').pop();
      const thumbnailPath = `${user.id}/${Date.now()}-thumb.${thumbnailExt}`;
      const { error: thumbError } = await supabase.storage
        .from('reel-media')
        .upload(thumbnailPath, reelThumbnail);

      if (thumbError) throw thumbError;

      const { data: { publicUrl: thumbnailUrl } } = supabase.storage
        .from('reel-media')
        .getPublicUrl(thumbnailPath);

      // Upload video if provided
      let videoUrl = null;
      if (reelVideo) {
        const videoExt = reelVideo.name.split('.').pop();
        const videoPath = `${user.id}/${Date.now()}-video.${videoExt}`;
        const { error: videoError } = await supabase.storage
          .from('reel-media')
          .upload(videoPath, reelVideo);

        if (videoError) throw videoError;

        const { data: { publicUrl } } = supabase.storage
          .from('reel-media')
          .getPublicUrl(videoPath);
        videoUrl = publicUrl;
      }

      // Insert reel
      const { error: insertError } = await supabase
        .from('reels')
        .insert({
          creator_id: user.id,
          thumbnail_url: thumbnailUrl,
          video_url: videoUrl,
          description: newReel.description || null,
          audio_name: newReel.audio_name || null,
          categories: newReelCategories,
        });

      if (insertError) throw insertError;

      toast({ title: "Sucesso!", description: "Seu reel foi publicado." });
      setShowCreateModal(false);
      setNewReel({ description: '', audio_name: '' });
      setNewReelCategories([]);
      setReelThumbnail(null);
      setReelVideo(null);
      setThumbnailPreview('');
    } catch (error) {
      console.error('Error creating reel:', error);
      toast({ title: "Erro", description: "Não foi possível publicar o reel.", variant: "destructive" });
    } finally {
      setUploading(false);
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
      <div className="h-full w-full flex flex-col bg-black">
        {/* Category Filter Header */}
        <div className="pt-2 safe-area-top">
          <CategoryFilter 
            selectedCategory={selectedCategory} 
            onCategoryChange={setSelectedCategory}
          />
        </div>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
              <Video className="w-10 h-10 text-white/40" />
            </div>
            <p className="text-lg font-semibold mb-2">Nenhum reel disponível</p>
            <p className="text-sm text-white/60 mb-6">Seja o primeiro a criar um!</p>
            {user && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 gradient-primary rounded-full text-sm font-bold text-primary-foreground"
              >
                Criar Reel
              </button>
            )}
          </div>
        </div>

        {/* Create Reel Modal for empty state */}
        {showCreateModal && (
          <div className="absolute inset-0 z-50 flex items-end" onClick={() => setShowCreateModal(false)}>
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <div 
              className="relative w-full max-h-[85vh] bg-card rounded-t-3xl p-6 animate-slide-up overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-6" />
              
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-foreground">Novo Reel</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-foreground" />
                </button>
              </div>

              {/* Thumbnail Upload */}
              <div 
                onClick={() => thumbnailInputRef.current?.click()}
                className="relative aspect-[9/16] w-full max-w-[200px] mx-auto mb-4 bg-secondary rounded-xl overflow-hidden cursor-pointer border-2 border-dashed border-border hover:border-primary transition-colors"
              >
                {thumbnailPreview ? (
                  <img src={thumbnailPreview} alt="Thumbnail" className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                    <Image className="w-8 h-8 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Thumbnail *</span>
                  </div>
                )}
              </div>
              <input
                ref={thumbnailInputRef}
                type="file"
                accept="image/*"
                onChange={handleThumbnailSelect}
                className="hidden"
              />

              {/* Video Upload */}
              <button
                onClick={() => videoInputRef.current?.click()}
                className="w-full p-3 mb-4 bg-secondary rounded-xl flex items-center justify-center gap-2 border border-dashed border-border hover:border-primary transition-colors"
              >
                <Video className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {reelVideo ? reelVideo.name : 'Adicionar vídeo (opcional)'}
                </span>
              </button>
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={handleVideoSelect}
                className="hidden"
              />

              {/* Description */}
              <textarea
                value={newReel.description}
                onChange={(e) => setNewReel({ ...newReel, description: e.target.value })}
                placeholder="Descrição do reel..."
                className="w-full p-3 mb-4 bg-secondary rounded-xl text-sm text-foreground placeholder:text-muted-foreground border-none focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none h-24"
              />

              {/* Categories */}
              <CategorySelector 
                selectedCategories={newReelCategories}
                onCategoriesChange={setNewReelCategories}
                className="mb-4"
              />

              {/* Audio Name */}
              <input
                type="text"
                value={newReel.audio_name}
                onChange={(e) => setNewReel({ ...newReel, audio_name: e.target.value })}
                placeholder="Nome do áudio (opcional)"
                className="w-full p-3 mb-6 bg-secondary rounded-xl text-sm text-foreground placeholder:text-muted-foreground border-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              />

              {/* Submit Button */}
              <button
                onClick={handleCreateReel}
                disabled={uploading || !reelThumbnail || newReelCategories.length === 0}
                className="w-full py-3 gradient-primary rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {uploading ? (
                  <span className="text-sm font-bold text-primary-foreground">Publicando...</span>
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-primary-foreground" />
                    <span className="text-sm font-bold text-primary-foreground">Publicar Reel</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40" />
      </div>

      {/* Category Filter Header - Fixed at very top */}
      <div className="absolute top-0 left-0 right-0 z-50 safe-area-top">
        <CategoryFilter 
          selectedCategory={selectedCategory} 
          onCategoryChange={setSelectedCategory}
        />
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
        <button 
          onClick={() => setShowComments(true)}
          className="flex flex-col items-center gap-1"
        >
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

        <p className="text-white text-sm leading-relaxed mb-3 line-clamp-2">
          {reel.description || 'Sem descrição'}
        </p>

        <div className="flex items-center gap-2">
          <Music2 className="w-3.5 h-3.5 text-white" />
          <span className="text-xs text-white/80 truncate">
            {reel.audio_name || 'ORIGINAL AUDIO'} - {creatorName.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Comments Modal */}
      {showComments && (
        <div className="absolute inset-0 z-50 flex items-end" onClick={() => setShowComments(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div 
            className="relative w-full h-[70%] bg-card rounded-t-3xl flex flex-col animate-slide-up" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mt-3 mb-2" />
            
            <div className="flex items-center justify-between px-4 py-2 border-b border-border">
              <h3 className="text-lg font-bold text-foreground">
                Comentários ({reel.comments_count})
              </h3>
              <button 
                onClick={() => setShowComments(false)} 
                className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center"
              >
                <X className="w-4 h-4 text-foreground" />
              </button>
            </div>

            <ScrollArea className="flex-1 px-4">
              {loadingComments ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-pulse text-muted-foreground">Carregando...</div>
                </div>
              ) : comments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <MessageCircle className="w-12 h-12 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Nenhum comentário ainda</p>
                  <p className="text-sm text-muted-foreground/60">Seja o primeiro a comentar!</p>
                </div>
              ) : (
                <div className="py-4 space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <img 
                        src={comment.user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'} 
                        alt="" 
                        className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-foreground">
                            {comment.user?.display_name || comment.user?.username || 'Usuário'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(comment.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-foreground/90 mt-0.5 break-words">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={commentsEndRef} />
                </div>
              )}
            </ScrollArea>

            <div className="p-4 border-t border-border bg-background">
              <div className="flex items-center gap-2">
                <input 
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
                  placeholder="Adicione um comentário..."
                  className="flex-1 h-10 px-4 bg-secondary rounded-full text-sm text-foreground placeholder:text-muted-foreground border-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <button 
                  onClick={handleSendComment}
                  disabled={!newComment.trim()}
                  className="w-10 h-10 gradient-primary rounded-full flex items-center justify-center disabled:opacity-50"
                >
                  <Send className="w-4 h-4 text-primary-foreground" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* FAB - Create Reel */}
      {user && (
        <button
          onClick={() => setShowCreateModal(true)}
          className="fixed bottom-24 right-4 w-14 h-14 gradient-primary rounded-full flex items-center justify-center shadow-glow z-40"
        >
          <Plus className="w-7 h-7 text-primary-foreground" />
        </button>
      )}

      {/* Create Reel Modal */}
      {showCreateModal && (
        <div className="absolute inset-0 z-50 flex items-end" onClick={() => setShowCreateModal(false)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div 
            className="relative w-full max-h-[85vh] bg-card rounded-t-3xl p-6 animate-slide-up overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-6" />
            
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-foreground">Novo Reel</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center"
              >
                <X className="w-4 h-4 text-foreground" />
              </button>
            </div>

            {/* Thumbnail Upload */}
            <div 
              onClick={() => thumbnailInputRef.current?.click()}
              className="relative aspect-[9/16] w-full max-w-[200px] mx-auto mb-4 bg-secondary rounded-xl overflow-hidden cursor-pointer border-2 border-dashed border-border hover:border-primary transition-colors"
            >
              {thumbnailPreview ? (
                <img src={thumbnailPreview} alt="Thumbnail" className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                  <Image className="w-8 h-8 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Thumbnail *</span>
                </div>
              )}
            </div>
            <input
              ref={thumbnailInputRef}
              type="file"
              accept="image/*"
              onChange={handleThumbnailSelect}
              className="hidden"
            />

            {/* Video Upload */}
            <button
              onClick={() => videoInputRef.current?.click()}
              className="w-full p-3 mb-4 bg-secondary rounded-xl flex items-center justify-center gap-2 border border-dashed border-border hover:border-primary transition-colors"
            >
              <Video className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {reelVideo ? reelVideo.name : 'Adicionar vídeo (opcional)'}
              </span>
            </button>
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              onChange={handleVideoSelect}
              className="hidden"
            />

            {/* Description */}
            <textarea
              value={newReel.description}
              onChange={(e) => setNewReel({ ...newReel, description: e.target.value })}
              placeholder="Descrição do reel..."
              className="w-full p-3 mb-4 bg-secondary rounded-xl text-sm text-foreground placeholder:text-muted-foreground border-none focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none h-24"
            />

            {/* Categories */}
            <CategorySelector 
              selectedCategories={newReelCategories}
              onCategoriesChange={setNewReelCategories}
              className="mb-4"
            />

            {/* Audio Name */}
            <input
              type="text"
              value={newReel.audio_name}
              onChange={(e) => setNewReel({ ...newReel, audio_name: e.target.value })}
              placeholder="Nome do áudio (opcional)"
              className="w-full p-3 mb-6 bg-secondary rounded-xl text-sm text-foreground placeholder:text-muted-foreground border-none focus:outline-none focus:ring-2 focus:ring-primary/50"
            />

            {/* Submit Button */}
            <button
              onClick={handleCreateReel}
              disabled={uploading || !reelThumbnail || newReelCategories.length === 0}
              className="w-full py-3 gradient-primary rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {uploading ? (
                <span className="text-sm font-bold text-primary-foreground">Publicando...</span>
              ) : (
                <>
                  <Upload className="w-5 h-5 text-primary-foreground" />
                  <span className="text-sm font-bold text-primary-foreground">Publicar Reel</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
