import { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Crown, Play, Plus, Image, Upload, X, Video } from 'lucide-react';
import { AppMode } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { CategorySelector, CategoryId, CATEGORIES } from '@/components/CategoryFilter';
import { UserProfileModal } from '@/components/UserProfileModal';
import crisexToken from '@/assets/crisex-token.png';

interface PhotoFeedViewProps {
  balance: number;
  setBalance: (updater: (prev: number) => number) => void;
  onNavigate: (mode: AppMode) => void;
}

interface FeedPost {
  id: string;
  thumbnail_url: string;
  description: string | null;
  creator_id: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  type: 'reel' | 'live' | 'product';
  video_url?: string | null;
  price?: number;
  title?: string;
  categories?: string[];
  creator?: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
    is_vip: boolean | null;
  };
}

interface Story {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  is_live: boolean;
  has_story: boolean;
}

export function PhotoFeedView({ balance, setBalance, onNavigate }: PhotoFeedViewProps) {
  const { user } = useAuth();
  const [likedPosts, setLikedPosts] = useState<string[]>([]);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [allPosts, setAllPosts] = useState<FeedPost[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  const [video, setVideo] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<CategoryId[]>([]);
  const [postType, setPostType] = useState<'reel' | 'product'>('reel');
  const [productPrice, setProductPrice] = useState(0);
  const [productTitle, setProductTitle] = useState('');
  const [filterCategory, setFilterCategory] = useState<CategoryId | 'all'>('all');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showUserProfile, setShowUserProfile] = useState(false);
  useEffect(() => {
    fetchFeed();
    fetchStories();
  }, []);

  // Filter posts when category changes
  useEffect(() => {
    if (filterCategory === 'all') {
      setPosts(allPosts);
    } else {
      const filtered = allPosts.filter(post => 
        post.categories?.includes(filterCategory)
      );
      setPosts(filtered);
    }
  }, [filterCategory, allPosts]);

  const fetchFeed = async () => {
    setLoading(true);
    try {
      // Fetch reels with categories
      const { data: reels, error: reelsError } = await supabase
        .from('reels')
        .select(`
          id, thumbnail_url, description, creator_id, likes_count, comments_count, created_at, video_url, categories,
          profiles!reels_creator_id_fkey(id, username, display_name, avatar_url, is_vip)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(50);

      if (reelsError) throw reelsError;

      // Fetch products (packs/videos for sale) with categories
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select(`
          id, image_url, description, creator_id, created_at, price, title, categories,
          profiles!products_creator_id_fkey(id, username, display_name, avatar_url, is_vip)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(50);

      if (productsError) throw productsError;

      // Combine and sort by date
      const feedItems: FeedPost[] = [
        ...(reels || []).map((r: any) => ({
          id: r.id,
          thumbnail_url: r.thumbnail_url,
          description: r.description,
          creator_id: r.creator_id,
          likes_count: r.likes_count || 0,
          comments_count: r.comments_count || 0,
          created_at: r.created_at,
          type: 'reel' as const,
          video_url: r.video_url,
          categories: r.categories || [],
          creator: r.profiles
        })),
        ...(products || []).map((p: any) => ({
          id: p.id,
          thumbnail_url: p.image_url || '',
          description: p.description,
          creator_id: p.creator_id,
          likes_count: 0,
          comments_count: 0,
          created_at: p.created_at,
          type: 'product' as const,
          price: p.price,
          title: p.title,
          categories: p.categories || [],
          creator: p.profiles
        }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setAllPosts(feedItems);
      setPosts(feedItems);

      // Fetch user likes
      if (user) {
        const { data: likes } = await supabase
          .from('reels_likes')
          .select('reel_id')
          .eq('user_id', user.id);
        
        if (likes) {
          setLikedPosts(likes.map(l => l.reel_id));
        }
      }
    } catch (error) {
      console.error('Error fetching feed:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStories = async () => {
    try {
      // Get active lives for story indicators
      const { data: lives } = await supabase
        .from('lives')
        .select(`
          streamer_id,
          profiles!lives_streamer_id_fkey(id, username, display_name, avatar_url)
        `)
        .eq('is_active', true);

      // Get users who have posted content (reels or products)
      const { data: reelCreators } = await supabase
        .from('reels')
        .select('creator_id')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(50);

      const { data: productCreators } = await supabase
        .from('products')
        .select('creator_id')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(50);

      // Get unique creator IDs with content
      const creatorIds = new Set<string>();
      (reelCreators || []).forEach((r: any) => creatorIds.add(r.creator_id));
      (productCreators || []).forEach((p: any) => creatorIds.add(p.creator_id));

      // Fetch profiles of creators with content
      let creators: any[] = [];
      if (creatorIds.size > 0) {
        const { data } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url')
          .in('id', Array.from(creatorIds))
          .limit(15);
        creators = data || [];
      }

      const liveUserIds = new Set((lives || []).map((l: any) => l.streamer_id));

      const storyList: Story[] = [];
      
      // Add current user first with their actual avatar
      if (user) {
        const { data: currentUserProfile } = await supabase
          .from('profiles')
          .select('avatar_url, username, display_name')
          .eq('id', user.id)
          .maybeSingle();

        storyList.push({
          id: user.id,
          username: 'Você',
          display_name: 'Você',
          avatar_url: currentUserProfile?.avatar_url || null,
          is_live: liveUserIds.has(user.id),
          has_story: creatorIds.has(user.id)
        });
      }

      // Add other creators who have content
      creators.forEach((c: any) => {
        if (c.id !== user?.id) {
          storyList.push({
            id: c.id,
            username: c.username,
            display_name: c.display_name,
            avatar_url: c.avatar_url,
            is_live: liveUserIds.has(c.id),
            has_story: true // They have content
          });
        }
      });

      setStories(storyList);
    } catch (error) {
      console.error('Error fetching stories:', error);
    }
  };

  const toggleLike = async (postId: string, type: string) => {
    if (!user || type !== 'reel') return;

    const isLiked = likedPosts.includes(postId);

    try {
      if (isLiked) {
        await supabase
          .from('reels_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('reel_id', postId);
        
        setLikedPosts(prev => prev.filter(id => id !== postId));
        setPosts(prev => prev.map(p => 
          p.id === postId ? { ...p, likes_count: p.likes_count - 1 } : p
        ));
      } else {
        await supabase
          .from('reels_likes')
          .insert({ user_id: user.id, reel_id: postId });
        
        setLikedPosts(prev => [...prev, postId]);
        setPosts(prev => prev.map(p => 
          p.id === postId ? { ...p, likes_count: p.likes_count + 1 } : p
        ));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnail(file);
      const reader = new FileReader();
      reader.onloadend = () => setThumbnailPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setVideo(file);
  };

  const handleCreatePost = async () => {
    if (!user || !thumbnail) return;
    setCreating(true);

    try {
      // Upload thumbnail
      const thumbExt = thumbnail.name.split('.').pop();
      const thumbPath = `${user.id}/${Date.now()}.${thumbExt}`;
      
      const { error: thumbError } = await supabase.storage
        .from(postType === 'product' ? 'product-images' : 'reel-media')
        .upload(thumbPath, thumbnail);

      if (thumbError) throw thumbError;

      const { data: { publicUrl: thumbnailUrl } } = supabase.storage
        .from(postType === 'product' ? 'product-images' : 'reel-media')
        .getPublicUrl(thumbPath);

      let videoUrl = null;
      if (video && postType === 'reel') {
        const vidExt = video.name.split('.').pop();
        const vidPath = `${user.id}/${Date.now()}-video.${vidExt}`;
        
        const { error: vidError } = await supabase.storage
          .from('reel-media')
          .upload(vidPath, video);

        if (!vidError) {
          const { data: { publicUrl } } = supabase.storage
            .from('reel-media')
            .getPublicUrl(vidPath);
          videoUrl = publicUrl;
        }
      }

      if (postType === 'reel') {
        await supabase.from('reels').insert({
          creator_id: user.id,
          thumbnail_url: thumbnailUrl,
          video_url: videoUrl,
          description,
          categories: selectedCategories
        });
      } else {
        await supabase.from('products').insert({
          creator_id: user.id,
          image_url: thumbnailUrl,
          description,
          title: productTitle,
          price: productPrice,
          type: 'pack',
          categories: selectedCategories
        });
      }

      toast({
        title: "Publicado!",
        description: postType === 'reel' ? "Seu reel foi publicado." : "Seu produto foi criado."
      });

      setShowCreateModal(false);
      setThumbnail(null);
      setThumbnailPreview('');
      setVideo(null);
      setDescription('');
      setSelectedCategories([]);
      setProductTitle('');
      setProductPrice(0);
      fetchFeed();
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Erro",
        description: "Não foi possível publicar.",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  const handleBuyProduct = async (post: FeedPost) => {
    if (!user || !post.price) return;

    if (balance < post.price) {
      toast({
        title: "Saldo insuficiente",
        description: `Você precisa de ${post.price} CRISEX.`,
        variant: "destructive"
      });
      return;
    }

    try {
      // Deduct balance
      setBalance(prev => prev - post.price!);

      // Record purchase
      await supabase.from('purchases').insert({
        buyer_id: user.id,
        seller_id: post.creator_id,
        product_id: post.id,
        product_title: post.title || 'Produto',
        product_type: 'pack',
        product_price: post.price,
        creator_earnings: Math.floor(post.price * 0.7),
        platform_commission: Math.floor(post.price * 0.3)
      });

      toast({
        title: "Compra realizada!",
        description: `Você comprou "${post.title}" por ${post.price} CRISEX.`
      });
    } catch (error) {
      console.error('Error purchasing:', error);
      setBalance(prev => prev + post.price!);
    }
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `há ${diffMins}min`;
    if (diffHours < 24) return `há ${diffHours}h`;
    return `há ${diffDays}d`;
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center animate-pulse">
            <img src={crisexToken} alt="CRISEX" className="w-8 h-8" />
          </div>
          <p className="text-muted-foreground text-sm">Carregando feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto hide-scrollbar bg-background">
      {/* Category Filter */}
      <div className="px-4 pt-4 pb-2 border-b border-border/50">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
          <button
            onClick={() => setFilterCategory('all')}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all ${
              filterCategory === 'all'
                ? 'gradient-primary text-primary-foreground shadow-pink-sm'
                : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
            }`}
          >
            Todos
          </button>
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => setFilterCategory(category.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all ${
                filterCategory === category.id
                  ? 'gradient-primary text-primary-foreground shadow-pink-sm'
                  : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stories */}
      <div className="px-4 py-4 border-b border-border/50">
        <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
          {stories.map((story, index) => (
            <button 
              key={story.id} 
              className="flex flex-col items-center gap-2 shrink-0 animate-fade-in" 
              style={{ animationDelay: `${index * 0.1}s` }} 
              onClick={() => {
                if (story.is_live) {
                  onNavigate(AppMode.LIVE);
                } else if (index !== 0) {
                  // Open profile for other users (not current user)
                  setSelectedUserId(story.id);
                  setShowUserProfile(true);
                }
              }}
            >
              <div className={`relative p-0.5 rounded-full ${story.is_live ? 'gradient-primary animate-glow' : story.has_story ? 'gradient-primary' : 'bg-border'}`}>
                <div className="p-0.5 bg-background rounded-full">
                  <img 
                    src={story.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${story.username}`} 
                    alt={story.display_name || story.username || 'User'} 
                    className="w-16 h-16 rounded-full object-cover" 
                  />
                </div>
                {story.is_live && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 gradient-primary rounded text-[10px] font-bold text-primary-foreground uppercase tracking-wider">
                    Live
                  </div>
                )}
                {index === 0 && !story.has_story && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowCreateModal(true); }}
                    className="absolute -bottom-1 -right-1 w-6 h-6 gradient-primary rounded-full flex items-center justify-center text-primary-foreground border-2 border-background"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>
              <span className="text-xs font-medium text-foreground truncate w-16 text-center">
                {story.display_name || story.username || 'Usuário'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Posts */}
      <div className="pb-20">
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-4">
              <Image className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum conteúdo ainda</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Seja o primeiro a publicar algo!
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="gradient-primary px-6 py-2 rounded-xl text-primary-foreground font-semibold"
            >
              Criar Post
            </button>
          </div>
        ) : (
          posts.map((post, index) => (
            <article key={post.id} className="border-b border-border/50 animate-fade-up" style={{ animationDelay: `${index * 0.1}s` }}>
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img 
                      src={post.creator?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.creator?.username}`} 
                      alt={post.creator?.display_name || 'User'} 
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/30" 
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-online rounded-full border-2 border-background" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-foreground">
                        {post.creator?.display_name || post.creator?.username || 'Usuário'}
                      </span>
                      {post.creator?.is_vip && <Crown className="w-4 h-4 text-gold fill-gold" />}
                    </div>
                    <span className="text-xs text-muted-foreground">{formatTimeAgo(post.created_at)}</span>
                  </div>
                </div>
                <button className="p-2 hover:bg-secondary rounded-full transition-colors">
                  <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* Image */}
              <div className="relative aspect-square bg-secondary">
                <img src={post.thumbnail_url} alt={post.title || 'Post'} className="w-full h-full object-cover" />
                
                {post.type === 'product' && post.price && (
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent flex items-end justify-center pb-8">
                    <button 
                      onClick={() => handleBuyProduct(post)}
                      className="gradient-primary px-6 py-3 rounded-xl font-semibold text-primary-foreground shadow-glow flex items-center gap-2 active:scale-95 transition-transform"
                    >
                      <Crown className="w-5 h-5" />
                      Desbloquear por {post.price} CRISEX
                    </button>
                  </div>
                )}

                {post.video_url && (
                  <button 
                    onClick={() => onNavigate(AppMode.REELS)}
                    className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur-sm rounded-full"
                  >
                    <Play className="w-5 h-5 text-white fill-white" />
                  </button>
                )}

                {post.type === 'product' && (
                  <div className="absolute top-4 left-4 px-2 py-1 bg-primary rounded-full">
                    <span className="text-[10px] font-bold text-primary-foreground uppercase">Pack</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="px-4 py-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => toggleLike(post.id, post.type)} 
                      className="group transition-transform active:scale-90"
                    >
                      <Heart className={`w-7 h-7 transition-all ${likedPosts.includes(post.id) ? 'text-primary fill-primary animate-heart' : 'text-foreground group-hover:text-primary'}`} />
                    </button>
                    <button className="group transition-transform active:scale-90">
                      <MessageCircle className="w-7 h-7 text-foreground group-hover:text-primary transition-colors" />
                    </button>
                    <button className="group transition-transform active:scale-90">
                      <Share2 className="w-7 h-7 text-foreground group-hover:text-primary transition-colors" />
                    </button>
                  </div>
                  <button className="group transition-transform active:scale-90">
                    <Bookmark className="w-7 h-7 text-foreground group-hover:text-primary transition-colors" />
                  </button>
                </div>
                <p className="font-semibold text-foreground mb-1">
                  {(post.likes_count + (likedPosts.includes(post.id) ? 1 : 0)).toLocaleString()} curtidas
                </p>
                {post.description && (
                  <p className="text-foreground">
                    <span className="font-semibold">{post.creator?.username || 'user'} </span>
                    {post.description}
                  </p>
                )}
              </div>
            </article>
          ))
        )}
      </div>

      {/* FAB */}
      {user && (
        <button
          onClick={() => setShowCreateModal(true)}
          className="fixed bottom-24 right-4 w-14 h-14 gradient-primary rounded-full flex items-center justify-center shadow-glow z-40"
        >
          <Plus className="w-7 h-7 text-primary-foreground" />
        </button>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setShowCreateModal(false)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div 
            className="relative w-full max-h-[90vh] bg-card rounded-t-3xl p-6 animate-slide-up overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-6" />
            
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-foreground">Novo Post</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center"
              >
                <X className="w-4 h-4 text-foreground" />
              </button>
            </div>

            {/* Post Type Toggle */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setPostType('reel')}
                className={`flex-1 py-3 rounded-xl font-semibold transition-all ${postType === 'reel' ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-foreground'}`}
              >
                Reel / Vídeo
              </button>
              <button
                onClick={() => setPostType('product')}
                className={`flex-1 py-3 rounded-xl font-semibold transition-all ${postType === 'product' ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-foreground'}`}
              >
                Pack à Venda
              </button>
            </div>

            {/* Thumbnail */}
            <label className="relative aspect-[9/16] w-full max-w-[200px] mx-auto mb-4 bg-secondary rounded-xl overflow-hidden cursor-pointer border-2 border-dashed border-border hover:border-primary transition-colors block">
              {thumbnailPreview ? (
                <img src={thumbnailPreview} alt="Thumbnail" className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                  <Image className="w-8 h-8 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Imagem *</span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleThumbnailSelect}
                className="hidden"
              />
            </label>

            {postType === 'reel' && (
              <label className="w-full p-3 mb-4 bg-secondary rounded-xl flex items-center justify-center gap-2 border border-dashed border-border hover:border-primary transition-colors cursor-pointer block">
                <Video className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {video ? video.name : 'Adicionar vídeo (opcional)'}
                </span>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoSelect}
                  className="hidden"
                />
              </label>
            )}

            {postType === 'product' && (
              <>
                <input
                  type="text"
                  value={productTitle}
                  onChange={(e) => setProductTitle(e.target.value)}
                  placeholder="Título do pack *"
                  className="w-full p-3 mb-4 bg-secondary rounded-xl text-sm text-foreground placeholder:text-muted-foreground border-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <div className="flex items-center gap-2 p-3 mb-4 bg-secondary rounded-xl">
                  <img src={crisexToken} alt="CRISEX" className="w-5 h-5" />
                  <input
                    type="number"
                    value={productPrice || ''}
                    onChange={(e) => setProductPrice(parseInt(e.target.value) || 0)}
                    placeholder="Preço em CRISEX *"
                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground border-none focus:outline-none"
                  />
                </div>
              </>
            )}

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição..."
              className="w-full p-3 mb-4 bg-secondary rounded-xl text-sm text-foreground placeholder:text-muted-foreground border-none focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none h-24"
            />

            <CategorySelector 
              selectedCategories={selectedCategories}
              onCategoriesChange={setSelectedCategories}
              className="mb-6"
            />

            <button
              onClick={handleCreatePost}
              disabled={creating || !thumbnail || (postType === 'product' && (!productTitle || !productPrice)) || selectedCategories.length === 0}
              className="w-full py-3 gradient-primary rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {creating ? (
                <span className="text-sm font-bold text-primary-foreground">Publicando...</span>
              ) : (
                <>
                  <Upload className="w-5 h-5 text-primary-foreground" />
                  <span className="text-sm font-bold text-primary-foreground">Publicar</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* User Profile Modal */}
      {selectedUserId && (
        <UserProfileModal
          userId={selectedUserId}
          isOpen={showUserProfile}
          onClose={() => {
            setShowUserProfile(false);
            setSelectedUserId(null);
          }}
          onBuyProduct={async (productId, price, title, sellerId) => {
            if (!user) return;
            if (balance < price) {
              toast({
                title: "Saldo insuficiente",
                description: `Você precisa de ${price} CRISEX.`,
                variant: "destructive"
              });
              return;
            }

            try {
              setBalance(prev => prev - price);
              await supabase.from('purchases').insert({
                buyer_id: user.id,
                seller_id: sellerId,
                product_id: productId,
                product_title: title,
                product_type: 'pack',
                product_price: price,
                creator_earnings: Math.floor(price * 0.7),
                platform_commission: Math.floor(price * 0.3)
              });

              toast({
                title: "Compra realizada!",
                description: `Você comprou "${title}" por ${price} CRISEX.`
              });
            } catch (error) {
              console.error('Error purchasing:', error);
              setBalance(prev => prev + price);
            }
          }}
        />
      )}
    </div>
  );
}
