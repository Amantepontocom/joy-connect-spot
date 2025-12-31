import { useState, useEffect, useRef } from 'react';
import { Settings, Grid3X3, Film, Heart, Crown, Share2, UserPlus, MoreHorizontal, Edit2, TrendingUp, ChevronRight, Package, Video, LogOut, Play, ShoppingBag, Camera, Check, X, CreditCard, Plus, Bookmark, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AppMode } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import crisexToken from '@/assets/crisex-token.png';

interface ProfileViewProps {
  balance: number;
  setBalance: (updater: (prev: number) => number) => void;
  userImages?: string[];
  userPosts?: { id: string; thumbnail: string; likes: number }[];
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
  { id: 'purchases', icon: Bookmark, label: 'Salvos' }
];

const RECHARGE_OPTIONS = [
  { amount: 100, bonus: 0, price: 'R$ 10,00' },
  { amount: 500, bonus: 50, price: 'R$ 45,00' },
  { amount: 1000, bonus: 150, price: 'R$ 85,00' },
  { amount: 2500, bonus: 500, price: 'R$ 200,00' },
  { amount: 5000, bonus: 1500, price: 'R$ 380,00' },
];

export function ProfileView({ balance, setBalance, onPlusClick, onNavigate }: ProfileViewProps) {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('posts');
  const [reels, setReels] = useState<UserReel[]>([]);
  const [products, setProducts] = useState<UserProduct[]>([]);
  const [purchases, setPurchases] = useState<UserPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ posts: 0, followers: 0, following: 0 });
  
  // Edit Profile State
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editLocation, setEditLocation] = useState('Brasil');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Recharge State
  const [showRecharge, setShowRecharge] = useState(false);
  const [selectedRecharge, setSelectedRecharge] = useState<number | null>(null);
  
  // Share State
  const [showShareMenu, setShowShareMenu] = useState(false);
  
  // Settings State
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserContent();
    }
  }, [user]);

  useEffect(() => {
    if (profile) {
      setEditDisplayName(profile.display_name || '');
    }
  }, [profile]);

  const fetchUserContent = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data: userReels } = await supabase
        .from('reels')
        .select('id, thumbnail_url, likes_count, video_url')
        .eq('creator_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      setReels(userReels || []);

      const { data: userProducts } = await supabase
        .from('products')
        .select('id, image_url, title, price, type')
        .eq('creator_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      setProducts(userProducts || []);

      const { data: userPurchases } = await supabase
        .from('purchases')
        .select('id, product_title, product_price, product_type, created_at')
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false });

      setPurchases(userPurchases || []);

      setStats({
        posts: (userReels?.length || 0) + (userProducts?.length || 0),
        followers: Math.floor(Math.random() * 10000) + 100,
        following: Math.floor(Math.random() * 500) + 50
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

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('reel-media')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('reel-media')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (updateError) throw updateError;

      await refreshProfile();
      toast({ title: "Foto atualizada!", description: "Sua foto de perfil foi alterada com sucesso." });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          display_name: editDisplayName,
          updated_at: new Date().toISOString() 
        })
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile();
      setShowEditProfile(false);
      toast({ title: "Perfil atualizado!", description: "Suas alterações foram salvas." });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const handleRecharge = async (amount: number, bonus: number) => {
    // Simulate payment
    const totalAmount = amount + bonus;
    setBalance(prev => prev + totalAmount);
    
    if (user) {
      await supabase
        .from('profiles')
        .update({ balance: balance + totalAmount, updated_at: new Date().toISOString() })
        .eq('id', user.id);
    }
    
    setShowRecharge(false);
    setSelectedRecharge(null);
    toast({ 
      title: "Recarga realizada!", 
      description: `+${totalAmount.toLocaleString()} CRISEX adicionados à sua conta.` 
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
    setShowShareMenu(false);
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
              <div className="w-20 h-20 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center mb-4">
                <Grid3X3 className="w-10 h-10 text-muted-foreground/50" />
              </div>
              <p className="text-foreground font-semibold mb-1">Nenhuma publicação ainda</p>
              <p className="text-muted-foreground text-sm text-center">Quando você compartilhar fotos e vídeos, eles aparecerão aqui.</p>
            </div>
          );
        }

        return (
          <div className="grid grid-cols-3 gap-0.5">
            {allPosts.map((item: any, index) => (
              <button 
                key={item.id} 
                className="aspect-square relative group animate-fade-in overflow-hidden" 
                style={{ animationDelay: `${index * 0.03}s` }}
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
        );

      case 'reels':
        if (reels.length === 0) {
          return (
            <div className="flex flex-col items-center justify-center py-20 px-4">
              <div className="w-20 h-20 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center mb-4">
                <Film className="w-10 h-10 text-muted-foreground/50" />
              </div>
              <p className="text-foreground font-semibold mb-1">Nenhum reel ainda</p>
              <p className="text-muted-foreground text-sm text-center">Seus vídeos curtos aparecerão aqui.</p>
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
                style={{ animationDelay: `${index * 0.03}s` }}
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
              <div className="w-20 h-20 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center mb-4">
                <Package className="w-10 h-10 text-muted-foreground/50" />
              </div>
              <p className="text-foreground font-semibold mb-1">Nenhum pack à venda</p>
              <p className="text-muted-foreground text-sm text-center">Crie conteúdo exclusivo para monetizar!</p>
            </div>
          );
        }

        return (
          <div className="grid grid-cols-2 gap-3 p-3">
            {products.map((product, index) => (
              <div 
                key={product.id} 
                className="bg-secondary rounded-2xl overflow-hidden animate-fade-in shadow-sm"
                style={{ animationDelay: `${index * 0.03}s` }}
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
              <div className="w-20 h-20 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center mb-4">
                <Bookmark className="w-10 h-10 text-muted-foreground/50" />
              </div>
              <p className="text-foreground font-semibold mb-1">Nenhum item salvo</p>
              <p className="text-muted-foreground text-sm text-center">Suas compras e favoritos aparecerão aqui.</p>
            </div>
          );
        }

        return (
          <div className="p-3 space-y-3">
            {purchases.map((purchase, index) => (
              <div 
                key={purchase.id} 
                className="flex items-center gap-3 p-4 bg-secondary rounded-2xl animate-fade-in"
                style={{ animationDelay: `${index * 0.03}s` }}
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
      <div className="px-4 pt-4 pb-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">@{profile?.username || 'usuario'}</h2>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setShowShareMenu(true)}
              className="p-2.5 hover:bg-secondary rounded-xl transition-colors"
            >
              <Share2 className="w-5 h-5 text-foreground" />
            </button>
            <button 
              onClick={() => setShowSettings(true)}
              className="p-2.5 hover:bg-secondary rounded-xl transition-colors"
            >
              <MoreHorizontal className="w-5 h-5 text-foreground" />
            </button>
            <button 
              onClick={handleSignOut}
              className="p-2.5 hover:bg-secondary rounded-xl transition-colors"
            >
              <LogOut className="w-5 h-5 text-foreground" />
            </button>
          </div>
        </div>

        {/* Profile Info */}
        <div className="flex items-start gap-5">
          <div className="relative">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="relative group"
              disabled={uploading}
            >
              <div className={`p-1 rounded-full ${uploading ? 'animate-pulse' : ''}`} style={{ background: 'var(--gradient-primary)' }}>
                <img 
                  src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.username}`} 
                  alt="Profile" 
                  className="w-20 h-20 rounded-full object-cover border-4 border-background" 
                />
              </div>
              <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 gradient-primary rounded-full flex items-center justify-center border-2 border-background shadow-lg">
                <Plus className="w-4 h-4 text-primary-foreground" />
              </div>
            </button>
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleAvatarChange}
            />
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
        <div className="mt-4 space-y-1">
          <p className="text-foreground text-sm leading-relaxed">
            ✨ Criador de conteúdo premium 💕
          </p>
          <p className="text-muted-foreground text-sm flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {editLocation}
          </p>
          <p className="text-muted-foreground text-sm">💌 Contato: DM aberta</p>
        </div>

        {/* Balance Card */}
        <div className="mt-5 p-4 bg-secondary/80 rounded-2xl border border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center shadow-pink-sm">
                <img src={crisexToken} alt="CRISEX" className="w-7 h-7" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Saldo CRISEX</p>
                <p className="text-xl font-bold text-foreground">{balance.toLocaleString()}</p>
              </div>
            </div>
            <Button 
              onClick={() => setShowRecharge(true)}
              className="gradient-primary rounded-xl shadow-pink-sm h-10 px-5 font-semibold"
            >
              Adicionar
            </Button>
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
        <div className="flex gap-3 mt-5">
          <Button 
            onClick={() => setShowEditProfile(true)}
            variant="outline" 
            className="flex-1 h-11 rounded-xl border-border font-semibold"
          >
            <Edit2 className="w-4 h-4 mr-2" />
            Editar Perfil
          </Button>
          <Button 
            onClick={() => onNavigate?.(AppMode.SHOP)}
            variant="outline" 
            className="h-11 px-4 rounded-xl border-border"
          >
            <Bookmark className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border sticky top-0 bg-background z-10">
        {TABS.map((tab) => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id)} 
            className={`flex-1 py-4 flex items-center justify-center transition-all ${
              activeTab === tab.id 
                ? 'text-foreground border-b-2 border-foreground' 
                : 'text-muted-foreground'
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

      {/* Edit Profile Dialog */}
      <Dialog open={showEditProfile} onOpenChange={setShowEditProfile}>
        <DialogContent className="max-w-md mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Editar Perfil</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="flex flex-col items-center gap-3">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="relative group"
              >
                <img 
                  src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.username}`} 
                  alt="Profile" 
                  className="w-24 h-24 rounded-full object-cover border-4 border-secondary" 
                />
                <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="w-8 h-8 text-white" />
                </div>
              </button>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="text-primary text-sm font-semibold"
              >
                Alterar foto
              </button>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Nome de exibição</label>
              <Input 
                value={editDisplayName}
                onChange={(e) => setEditDisplayName(e.target.value)}
                placeholder="Seu nome"
                className="rounded-xl h-12"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Bio</label>
              <Textarea 
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="Conte um pouco sobre você..."
                className="rounded-xl resize-none"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Localização</label>
              <Input 
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                placeholder="Ex: São Paulo, Brasil"
                className="rounded-xl h-12"
              />
            </div>
            
            <div className="flex gap-3 pt-2">
              <Button 
                variant="outline" 
                onClick={() => setShowEditProfile(false)}
                className="flex-1 h-12 rounded-xl"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSaveProfile}
                className="flex-1 h-12 rounded-xl gradient-primary shadow-pink-sm"
              >
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Recharge Dialog */}
      <Dialog open={showRecharge} onOpenChange={setShowRecharge}>
        <DialogContent className="max-w-md mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-primary" />
              Adicionar CRISEX
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {RECHARGE_OPTIONS.map((option) => (
              <button
                key={option.amount}
                onClick={() => setSelectedRecharge(option.amount)}
                className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${
                  selectedRecharge === option.amount 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center">
                    <img src={crisexToken} alt="CRISEX" className="w-7 h-7" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-foreground">
                      {option.amount.toLocaleString()} CRISEX
                    </p>
                    {option.bonus > 0 && (
                      <p className="text-xs text-emerald-500 font-medium">
                        +{option.bonus.toLocaleString()} bônus
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-foreground">{option.price}</p>
                  {selectedRecharge === option.amount && (
                    <Check className="w-5 h-5 text-primary ml-auto mt-1" />
                  )}
                </div>
              </button>
            ))}
            
            <Button 
              onClick={() => {
                const opt = RECHARGE_OPTIONS.find(o => o.amount === selectedRecharge);
                if (opt) handleRecharge(opt.amount, opt.bonus);
              }}
              disabled={!selectedRecharge}
              className="w-full h-12 rounded-xl gradient-primary shadow-pink-sm mt-4 font-semibold"
            >
              Confirmar Recarga
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Menu Dialog */}
      <Dialog open={showShareMenu} onOpenChange={setShowShareMenu}>
        <DialogContent className="max-w-sm mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Compartilhar perfil</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <Button 
              onClick={handleShare}
              variant="outline"
              className="w-full h-12 rounded-xl justify-start gap-3"
            >
              <Share2 className="w-5 h-5" />
              Copiar link do perfil
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-sm mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Configurações</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <button className="w-full p-4 rounded-xl hover:bg-secondary transition-colors text-left flex items-center gap-3">
              <Settings className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium text-foreground">Configurações da conta</span>
            </button>
            <button className="w-full p-4 rounded-xl hover:bg-secondary transition-colors text-left flex items-center gap-3">
              <Crown className="w-5 h-5 text-gold" />
              <span className="font-medium text-foreground">Assinar VIP</span>
            </button>
            <button 
              onClick={handleSignOut}
              className="w-full p-4 rounded-xl hover:bg-destructive/10 transition-colors text-left flex items-center gap-3"
            >
              <LogOut className="w-5 h-5 text-destructive" />
              <span className="font-medium text-destructive">Sair da conta</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
