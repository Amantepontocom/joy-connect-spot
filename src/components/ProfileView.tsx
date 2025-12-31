import { useState, useEffect } from 'react';
import { Settings, Grid3X3, Film, Heart, Crown, Share2, UserPlus, MoreHorizontal, Edit2, TrendingUp, ChevronRight, Package, Video, LogOut, Play, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppMode } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import crisexToken from '@/assets/crisex-token.png';

interface ProfileViewProps {
  balance: number;
  setBalance: (updater: (prev: number) => number) => void;
  userImages: string[];
  userPosts: { id: string; thumbnail: string; likes: number }[];
  onPlusClick?: () => void;
  onNavigate?: (mode: AppMode) => void;
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

interface UserLive {
  id: string;
  thumbnail_url: string | null;
  title: string;
  viewers_count: number;
  is_active: boolean;
}

interface UserPurchase {
  id: string;
  product_title: string;
  product_price: number;
  product_type: string;
  created_at: string;
}

const TABS = [
  { id: 'posts', icon: Grid3X3, label: 'Posts' },
  { id: 'reels', icon: Film, label: 'Reels' },
  { id: 'products', icon: Package, label: 'Packs' },
  { id: 'purchases', icon: ShoppingBag, label: 'Compras' }
];

export function ProfileView({ balance, onPlusClick, onNavigate }: ProfileViewProps) {
  const { user, profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('posts');
  const [reels, setReels] = useState<UserReel[]>([]);
  const [products, setProducts] = useState<UserProduct[]>([]);
  const [lives, setLives] = useState<UserLive[]>([]);
  const [purchases, setPurchases] = useState<UserPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ posts: 0, followers: 0, following: 0 });

  useEffect(() => {
    if (user) {
      fetchUserContent();
    }
  }, [user]);

  const fetchUserContent = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Fetch user reels
      const { data: userReels } = await supabase
        .from('reels')
        .select('id, thumbnail_url, likes_count, video_url')
        .eq('creator_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      setReels(userReels || []);

      // Fetch user products (packs/videos)
      const { data: userProducts } = await supabase
        .from('products')
        .select('id, image_url, title, price, type')
        .eq('creator_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      setProducts(userProducts || []);

      // Fetch user lives
      const { data: userLives } = await supabase
        .from('lives')
        .select('id, thumbnail_url, title, viewers_count, is_active')
        .eq('streamer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      setLives(userLives || []);

      // Fetch user purchases
      const { data: userPurchases } = await supabase
        .from('purchases')
        .select('id, product_title, product_price, product_type, created_at')
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false });

      setPurchases(userPurchases || []);

      // Calculate stats
      setStats({
        posts: (userReels?.length || 0) + (userProducts?.length || 0),
        followers: Math.floor(Math.random() * 10000) + 100, // TODO: implement followers
        following: Math.floor(Math.random() * 500) + 50 // TODO: implement following
      });

    } catch (error) {
      console.error('Error fetching user content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({ title: "Até logo!", description: "Você foi desconectado." });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    switch (activeTab) {
      case 'posts':
        const allPosts = [...reels, ...products.map(p => ({ 
          id: p.id, 
          thumbnail_url: p.image_url || '', 
          likes_count: 0,
          video_url: null,
          isProduct: true,
          price: p.price
        }))];
        
        if (allPosts.length === 0) {
          return (
            <div className="flex flex-col items-center justify-center py-20 px-4">
              <Grid3X3 className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">Nenhum post ainda</p>
            </div>
          );
        }

        return (
          <div className="grid grid-cols-3 gap-0.5">
            {allPosts.map((item: any, index) => (
              <button 
                key={item.id} 
                className="aspect-square relative group animate-fade-in overflow-hidden" 
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <img 
                  src={item.thumbnail_url} 
                  alt={`Post ${index + 1}`} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                />
                <div className="absolute inset-0 bg-background/0 group-hover:bg-background/30 transition-colors flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 text-white">
                    {item.isProduct ? (
                      <>
                        <Package className="w-4 h-4" />
                        <span className="font-semibold text-sm">{item.price}</span>
                      </>
                    ) : (
                      <>
                        <Heart className="w-5 h-5 fill-current" />
                        <span className="font-semibold">{formatNumber(item.likes_count || 0)}</span>
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
        );

      case 'reels':
        if (reels.length === 0) {
          return (
            <div className="flex flex-col items-center justify-center py-20 px-4">
              <Film className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">Nenhum reel ainda</p>
            </div>
          );
        }

        return (
          <div className="grid grid-cols-3 gap-0.5">
            {reels.map((reel, index) => (
              <button 
                key={reel.id} 
                onClick={() => onNavigate?.(AppMode.REELS)}
                className="aspect-[9/16] relative group animate-fade-in overflow-hidden" 
                style={{ animationDelay: `${index * 0.05}s` }}
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
        );

      case 'products':
        if (products.length === 0) {
          return (
            <div className="flex flex-col items-center justify-center py-20 px-4">
              <Package className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">Nenhum pack ou vídeo à venda</p>
              <p className="text-xs text-muted-foreground mt-2">Crie conteúdo exclusivo para vender!</p>
            </div>
          );
        }

        return (
          <div className="grid grid-cols-2 gap-3 p-3">
            {products.map((product, index) => (
              <div 
                key={product.id} 
                className="bg-secondary rounded-xl overflow-hidden animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
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
                  <div className="flex items-center gap-1 mt-1">
                    <img src={crisexToken} alt="CRISEX" className="w-4 h-4" />
                    <span className="text-sm font-bold text-primary">{product.price}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'purchases':
        if (purchases.length === 0) {
          return (
            <div className="flex flex-col items-center justify-center py-20 px-4">
              <ShoppingBag className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">Nenhuma compra ainda</p>
              <p className="text-xs text-muted-foreground mt-2">Explore packs e vídeos exclusivos!</p>
            </div>
          );
        }

        return (
          <div className="p-3 space-y-3">
            {purchases.map((purchase, index) => (
              <div 
                key={purchase.id} 
                className="flex items-center gap-3 p-3 bg-secondary rounded-xl animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="w-14 h-14 gradient-primary rounded-xl flex items-center justify-center shrink-0">
                  {purchase.product_type === 'video' ? (
                    <Video className="w-6 h-6 text-primary-foreground" />
                  ) : (
                    <Package className="w-6 h-6 text-primary-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-foreground truncate">{purchase.product_title}</h4>
                  <p className="text-xs text-muted-foreground">
                    {new Date(purchase.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <img src={crisexToken} alt="CRISEX" className="w-4 h-4" />
                  <span className="text-sm font-bold text-primary">{purchase.product_price}</span>
                </div>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-full overflow-y-auto hide-scrollbar bg-background">
      <div className="px-6 pt-4 pb-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">@{profile?.username || 'usuario'}</h2>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-secondary rounded-full transition-colors">
              <Share2 className="w-5 h-5 text-foreground" />
            </button>
            <button className="p-2 hover:bg-secondary rounded-full transition-colors">
              <MoreHorizontal className="w-5 h-5 text-foreground" />
            </button>
            <button 
              onClick={handleSignOut}
              className="p-2 hover:bg-secondary rounded-full transition-colors"
            >
              <LogOut className="w-5 h-5 text-foreground" />
            </button>
          </div>
        </div>

        {/* Profile Info */}
        <div className="flex items-start gap-6">
          <div className="relative">
            <div className="p-1 gradient-primary rounded-full animate-glow">
              <img 
                src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.username}`} 
                alt="Profile" 
                className="w-24 h-24 rounded-full object-cover border-4 border-background" 
              />
            </div>
            <button 
              onClick={onPlusClick} 
              className="absolute -bottom-1 -right-1 w-8 h-8 gradient-primary rounded-full flex items-center justify-center border-2 border-background shadow-lg"
            >
              <span className="text-primary-foreground text-lg font-bold">+</span>
            </button>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-lg font-bold text-foreground">
                {profile?.display_name || profile?.username || 'Usuário'}
              </h3>
              {profile?.is_vip && <Crown className="w-5 h-5 text-gold fill-gold" />}
            </div>
            <div className="flex gap-6">
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
        <div className="mt-4">
          <p className="text-foreground text-sm leading-relaxed">
            ✨ Criador de conteúdo premium 💕<br />
            📍 Brasil<br />
            💌 Contato: DM aberta
          </p>
        </div>

        {/* Balance Card */}
        <div className="mt-4 p-4 gradient-secondary rounded-2xl border border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center">
                <span className="text-2xl">💎</span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Saldo CRISEX</p>
                <p className="text-xl font-bold text-foreground">{balance.toLocaleString()}</p>
              </div>
            </div>
            <Button className="gradient-primary rounded-xl shadow-pink-sm">Adicionar</Button>
          </div>
        </div>

        {/* Monetization Card */}
        <button 
          onClick={() => onNavigate?.(AppMode.MONETIZATION)}
          className="w-full mt-4 p-4 bg-gradient-to-r from-emerald-500/10 via-green-500/5 to-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3 active:scale-[0.98] transition-transform"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6 text-emerald-500" />
          </div>
          <div className="flex-1 text-left">
            <h4 className="text-sm font-bold text-foreground">Programa de Monetização</h4>
            <p className="text-xs text-muted-foreground">Ganhe 70% em vendas, lives e mimos</p>
          </div>
          <ChevronRight className="w-5 h-5 text-emerald-500" />
        </button>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-4">
          <Button variant="outline" className="flex-1 h-12 rounded-xl border-border">
            <Edit2 className="w-5 h-5 mr-2" />
            Editar Perfil
          </Button>
          <Button 
            onClick={() => onNavigate?.(AppMode.SHOP)}
            variant="outline" 
            className="h-12 px-4 rounded-xl border-border"
          >
            <ShoppingBag className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border sticky top-0 bg-background z-10">
        {TABS.map((tab) => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id)} 
            className={`flex-1 py-4 flex items-center justify-center transition-colors ${
              activeTab === tab.id ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'
            }`}
          >
            <tab.icon className="w-6 h-6" />
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="pb-20">
        {renderContent()}
      </div>
    </div>
  );
}
