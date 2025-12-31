import { useState, useEffect } from 'react';
import { X, Crown, Heart, Grid3X3, Film, Package, UserPlus, UserCheck, MessageCircle, Share2, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import crisexToken from '@/assets/crisex-token.png';

interface UserProfile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  is_vip: boolean | null;
  bio?: string | null;
  location?: string | null;
}

interface UserReel {
  id: string;
  thumbnail_url: string;
  likes_count: number;
  video_url: string | null;
}

interface UserProduct {
  id: string;
  image_url: string | null;
  title: string;
  price: number;
  type: string;
}

interface UserProfileModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onBuyProduct?: (productId: string, price: number, title: string, sellerId: string) => void;
}

export function UserProfileModal({ userId, isOpen, onClose, onBuyProduct }: UserProfileModalProps) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [reels, setReels] = useState<UserReel[]>([]);
  const [products, setProducts] = useState<UserProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'reels' | 'products'>('posts');
  const [stats, setStats] = useState({ posts: 0, followers: 0, following: 0 });
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserProfile();
    }
  }, [isOpen, userId]);

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, is_vip, bio, location')
        .eq('id', userId)
        .maybeSingle();

      setProfile(profileData);

      // Fetch reels
      const { data: userReels } = await supabase
        .from('reels')
        .select('id, thumbnail_url, likes_count, video_url')
        .eq('creator_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      setReels(userReels || []);

      // Fetch products
      const { data: userProducts } = await supabase
        .from('products')
        .select('id, image_url, title, price, type')
        .eq('creator_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      setProducts(userProducts || []);

      // Calculate stats
      setStats({
        posts: (userReels?.length || 0) + (userProducts?.length || 0),
        followers: Math.floor(Math.random() * 10000) + 100,
        following: Math.floor(Math.random() * 500) + 50
      });

    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    toast({
      title: isFollowing ? "Deixou de seguir" : "Seguindo!",
      description: isFollowing 
        ? `Você deixou de seguir @${profile?.username}` 
        : `Você agora segue @${profile?.username}`
    });
  };

  const handleShare = async () => {
    const shareUrl = `https://amantes.com/@${profile?.username}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Perfil de @${profile?.username}`,
          text: `Confira o perfil de ${profile?.display_name || profile?.username} no Amantes.com`,
          url: shareUrl
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast({ title: "Link copiado!", description: "O link do perfil foi copiado." });
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div 
        className="relative w-full max-w-lg max-h-[90vh] bg-background rounded-t-3xl sm:rounded-3xl overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="flex items-center justify-between p-4">
            <h2 className="text-lg font-bold text-foreground">
              @{profile?.username || 'usuario'}
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center"
            >
              <X className="w-4 h-4 text-foreground" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-60px)] hide-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Profile Info */}
              <div className="px-6 py-6">
                <div className="flex items-start gap-5">
                  <div className="relative">
                    <div className="p-1 rounded-full" style={{ background: 'var(--gradient-primary)' }}>
                      <img 
                        src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.username}`} 
                        alt="Profile" 
                        className="w-20 h-20 rounded-full object-cover border-4 border-background" 
                      />
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold text-foreground">
                        {profile?.display_name || profile?.username || 'Usuário'}
                      </h3>
                      {profile?.is_vip && <Crown className="w-5 h-5 text-gold fill-gold" />}
                    </div>
                    <div className="flex gap-5">
                      <div className="text-center">
                        <p className="font-bold text-foreground">{stats.posts}</p>
                        <p className="text-xs text-muted-foreground">Posts</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-foreground">{formatNumber(stats.followers)}</p>
                        <p className="text-xs text-muted-foreground">Seguidores</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-foreground">{formatNumber(stats.following)}</p>
                        <p className="text-xs text-muted-foreground">Seguindo</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bio */}
                {profile?.bio && (
                  <div className="mt-4">
                    <p className="text-foreground text-sm leading-relaxed whitespace-pre-line">
                      {profile.bio}
                    </p>
                    {profile.location && (
                      <p className="text-muted-foreground text-sm mt-1">📍 {profile.location}</p>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                {user?.id !== userId && (
                  <div className="flex gap-3 mt-5">
                    <Button 
                      onClick={handleFollow}
                      className={`flex-1 h-11 rounded-xl font-semibold ${
                        isFollowing 
                          ? 'bg-secondary text-foreground hover:bg-secondary/80' 
                          : 'gradient-primary text-primary-foreground shadow-pink-sm'
                      }`}
                    >
                      {isFollowing ? (
                        <>
                          <UserCheck className="w-4 h-4 mr-2" />
                          Seguindo
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Seguir
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-11 px-4 rounded-xl border-border"
                    >
                      <MessageCircle className="w-5 h-5" />
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleShare}
                      className="h-11 px-4 rounded-xl border-border"
                    >
                      <Share2 className="w-5 h-5" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Tabs */}
              <div className="flex border-b border-border sticky top-0 bg-background z-10">
                <button 
                  onClick={() => setActiveTab('posts')} 
                  className={`flex-1 py-4 flex items-center justify-center transition-all ${
                    activeTab === 'posts' ? 'text-foreground border-b-2 border-foreground' : 'text-muted-foreground'
                  }`}
                >
                  <Grid3X3 className="w-6 h-6" />
                </button>
                <button 
                  onClick={() => setActiveTab('reels')} 
                  className={`flex-1 py-4 flex items-center justify-center transition-all ${
                    activeTab === 'reels' ? 'text-foreground border-b-2 border-foreground' : 'text-muted-foreground'
                  }`}
                >
                  <Film className="w-6 h-6" />
                </button>
                <button 
                  onClick={() => setActiveTab('products')} 
                  className={`flex-1 py-4 flex items-center justify-center transition-all ${
                    activeTab === 'products' ? 'text-foreground border-b-2 border-foreground' : 'text-muted-foreground'
                  }`}
                >
                  <Package className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="pb-6">
                {activeTab === 'posts' && (
                  <>
                    {reels.length === 0 && products.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 px-4">
                        <div className="w-16 h-16 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center mb-3">
                          <Grid3X3 className="w-8 h-8 text-muted-foreground/50" />
                        </div>
                        <p className="text-muted-foreground text-sm">Nenhuma publicação ainda</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-0.5">
                        {[...reels, ...products.map(p => ({ 
                          id: p.id, 
                          thumbnail_url: p.image_url || '', 
                          likes_count: 0,
                          video_url: null,
                          isProduct: true,
                          price: p.price
                        }))].map((item: any, index) => (
                          <button 
                            key={item.id} 
                            className="aspect-square relative group overflow-hidden" 
                          >
                            <img 
                              src={item.thumbnail_url} 
                              alt={`Post ${index + 1}`} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                            />
                            <div className="absolute inset-0 bg-background/0 group-hover:bg-background/30 transition-colors flex items-center justify-center">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 text-white drop-shadow-lg">
                                {item.isProduct ? (
                                  <>
                                    <Package className="w-4 h-4" />
                                    <span className="font-bold text-sm">{item.price}</span>
                                  </>
                                ) : (
                                  <>
                                    <Heart className="w-5 h-5 fill-current" />
                                    <span className="font-bold">{formatNumber(item.likes_count || 0)}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            {item.video_url && (
                              <div className="absolute top-2 right-2">
                                <Play className="w-4 h-4 text-white fill-white drop-shadow-lg" />
                              </div>
                            )}
                            {item.isProduct && (
                              <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-primary rounded text-[8px] font-bold text-primary-foreground">
                                PACK
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {activeTab === 'reels' && (
                  <>
                    {reels.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 px-4">
                        <div className="w-16 h-16 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center mb-3">
                          <Film className="w-8 h-8 text-muted-foreground/50" />
                        </div>
                        <p className="text-muted-foreground text-sm">Nenhum reel ainda</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-0.5">
                        {reels.map((reel, index) => (
                          <button 
                            key={reel.id} 
                            className="aspect-[9/16] relative group overflow-hidden" 
                          >
                            <img 
                              src={reel.thumbnail_url} 
                              alt={`Reel ${index + 1}`} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white text-xs">
                              <Play className="w-3 h-3 fill-white" />
                              <span>{formatNumber(reel.likes_count || 0)}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {activeTab === 'products' && (
                  <>
                    {products.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 px-4">
                        <div className="w-16 h-16 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center mb-3">
                          <Package className="w-8 h-8 text-muted-foreground/50" />
                        </div>
                        <p className="text-muted-foreground text-sm">Nenhum pack à venda</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 p-3">
                        {products.map((product) => (
                          <div 
                            key={product.id} 
                            className="bg-secondary rounded-2xl overflow-hidden shadow-sm"
                          >
                            <div className="aspect-square relative">
                              <img 
                                src={product.image_url || ''} 
                                alt={product.title} 
                                className="w-full h-full object-cover" 
                              />
                              <div className="absolute top-2 right-2 px-2 py-0.5 bg-primary rounded-full">
                                <span className="text-[10px] font-bold text-primary-foreground uppercase">
                                  {product.type === 'video' ? 'Vídeo' : 'Pack'}
                                </span>
                              </div>
                            </div>
                            <div className="p-3">
                              <h4 className="text-sm font-semibold text-foreground truncate">{product.title}</h4>
                              <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center gap-1">
                                  <img src={crisexToken} alt="CRISEX" className="w-4 h-4" />
                                  <span className="text-sm font-bold text-primary">{product.price}</span>
                                </div>
                                {onBuyProduct && user?.id !== userId && (
                                  <Button
                                    size="sm"
                                    onClick={() => onBuyProduct(product.id, product.price, product.title, userId)}
                                    className="h-8 px-3 text-xs gradient-primary rounded-lg"
                                  >
                                    Comprar
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
