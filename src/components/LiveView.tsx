import { useState, useEffect, useRef, useCallback } from 'react';
import { Heart, Gift, Send, X, Play, Check, ShoppingBag, Package, Clock, Eye, EyeOff, Coins, Plus, Upload, Camera, Video as VideoIcon, Volume2, VolumeX, Users, ArrowLeft } from 'lucide-react';
import { MIMOS } from '@/lib/mockData';
import { toast } from '@/hooks/use-toast';
import { playMimoSound, initAudioContext } from '@/lib/mimoSounds';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CategoryFilter, CategorySelector, CategoryId } from '@/components/CategoryFilter';
import { useLiveRealtime, LiveStream } from '@/hooks/useLiveRealtime';
import { useLives } from '@/hooks/useLives';
import { LiveChatMessages } from '@/components/live/LiveChatMessages';
import { LiveMetaProgress } from '@/components/live/LiveMetaProgress';
import { LivesList } from '@/components/live/LivesList';
import crisexToken from '@/assets/crisex-token.png';

const DISCRETE_MODE_COST_PER_MINUTE = 10;
const CREATOR_SHARE_PERCENT = 70;

interface LiveViewProps {
  balance: number;
  setBalance: (updater: (prev: number) => number) => void;
}

interface ProductItem {
  id: string;
  title: string;
  price: number;
  image: string;
  type: 'pack' | 'video';
  badge: string;
}

interface PurchasedItem extends ProductItem {
  purchasedAt: Date;
  seller: string;
  sellerImage: string;
}

const LIVE_PRODUCTS: ProductItem[] = [
  { id: '1', title: 'PACK VERÃO ...', price: 450, image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200', type: 'pack', badge: 'VIP' },
  { id: '2', title: 'VÍDEO HOT ...', price: 800, image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=200', type: 'video', badge: '🔒' },
];

export function LiveView({ balance, setBalance }: LiveViewProps) {
  const { user } = useAuth();
  
  // View mode: 'list' or 'stream'
  const [viewMode, setViewMode] = useState<'list' | 'stream'>('list');
  const [selectedLive, setSelectedLive] = useState<LiveStream | null>(null);
  
  // Modals
  const [showMimos, setShowMimos] = useState(false);
  const [showCrisexModal, setShowCrisexModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Product state
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [selectedPurchased, setSelectedPurchased] = useState<PurchasedItem | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [purchasedItems, setPurchasedItems] = useState<PurchasedItem[]>([]);
  
  // Stream state
  const [isLiked, setIsLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showMuteIndicator, setShowMuteIndicator] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  
  // Category filter
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('mulheres');
  
  // Create live states
  const [newLive, setNewLive] = useState({ title: '', meta_goal: 5000 });
  const [newLiveCategories, setNewLiveCategories] = useState<CategoryId[]>([]);
  const [liveThumbnail, setLiveThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  const [creating, setCreating] = useState(false);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  
  // Discrete Mode states
  const [discreteMode, setDiscreteMode] = useState(false);
  const [discreteModeTimer, setDiscreteModeTimer] = useState<NodeJS.Timeout | null>(null);
  const [discreteModeSeconds, setDiscreteModeSeconds] = useState(0);

  // Realtime hook for selected live
  const { 
    live: realtimeLive, 
    messages, 
    sendMessage: sendRealtimeMessage,
    updateMetaProgress 
  } = useLiveRealtime({
    liveId: selectedLive?.id || null,
    onNewMessage: (msg) => {
      if (msg.mimo_icon) {
        playMimoSound(msg.mimo_icon);
      }
    },
  });

  // Use realtime data when available
  const currentLive = realtimeLive || selectedLive;

  // Discrete Mode - charge every minute
  const chargeDiscreteMode = useCallback(async () => {
    if (balance < DISCRETE_MODE_COST_PER_MINUTE) {
      setDiscreteMode(false);
      if (discreteModeTimer) {
        clearInterval(discreteModeTimer);
        setDiscreteModeTimer(null);
      }
      toast({
        title: "Saldo insuficiente",
        description: "Modo Discreto desativado por falta de CRISEX.",
        variant: "destructive",
      });
      return;
    }

    setBalance(prev => prev - DISCRETE_MODE_COST_PER_MINUTE);

    const creatorShare = Math.floor(DISCRETE_MODE_COST_PER_MINUTE * CREATOR_SHARE_PERCENT / 100);
    const platformShare = DISCRETE_MODE_COST_PER_MINUTE - creatorShare;

    if (user && currentLive) {
      try {
        await supabase.from('discrete_mode_transactions').insert({
          user_id: user.id,
          creator_id: currentLive.streamer_id,
          live_id: currentLive.id,
          amount: DISCRETE_MODE_COST_PER_MINUTE,
          creator_share: creatorShare,
          platform_share: platformShare,
        });
      } catch (error) {
        console.error('Error recording discrete mode transaction:', error);
      }
    }
  }, [balance, user, currentLive, discreteModeTimer, setBalance]);

  const toggleDiscreteMode = useCallback(() => {
    if (!discreteMode) {
      if (balance < DISCRETE_MODE_COST_PER_MINUTE) {
        toast({
          title: "Saldo insuficiente",
          description: `Você precisa de pelo menos ${DISCRETE_MODE_COST_PER_MINUTE} CRISEX para ativar o Modo Discreto.`,
          variant: "destructive",
        });
        return;
      }

      setDiscreteMode(true);
      setDiscreteModeSeconds(0);
      
      const timer = setInterval(() => {
        setDiscreteModeSeconds(prev => prev + 1);
      }, 1000);
      setDiscreteModeTimer(timer);

      toast({
        title: "Modo Discreto ativado",
        description: "Cobrança de 10 CRISEX por minuto.",
      });
    } else {
      setDiscreteMode(false);
      if (discreteModeTimer) {
        clearInterval(discreteModeTimer);
        setDiscreteModeTimer(null);
      }
      setDiscreteModeSeconds(0);

      toast({
        title: "Modo Discreto desativado",
        description: "Interface restaurada.",
      });
    }
  }, [discreteMode, discreteModeTimer, balance]);

  useEffect(() => {
    if (discreteMode && discreteModeSeconds > 0 && discreteModeSeconds % 60 === 0) {
      chargeDiscreteMode();
    }
  }, [discreteModeSeconds, discreteMode, chargeDiscreteMode]);

  useEffect(() => {
    return () => {
      if (discreteModeTimer) {
        clearInterval(discreteModeTimer);
      }
    };
  }, [discreteModeTimer]);

  const sendMimo = async (mimo: typeof MIMOS[0]) => {
    if (balance >= mimo.price && currentLive) {
      setBalance(prev => prev - mimo.price);
      await updateMetaProgress(mimo.price);
      await sendRealtimeMessage(`Enviou ${mimo.icon}`, mimo.icon, mimo.price);
      playMimoSound(mimo.icon);
      setShowMimos(false);

      // Record mimo history
      if (user) {
        await supabase.from('mimos_history').insert({
          sender_id: user.id,
          receiver_id: currentLive.streamer_id,
          mimo_name: mimo.name,
          mimo_icon: mimo.icon,
          price: mimo.price,
          live_id: currentLive.id,
          creator_earnings: Math.floor(mimo.price * 0.7),
          platform_commission: Math.floor(mimo.price * 0.3),
        });
      }
    }
  };

  const sendCrisex = async (amount: number) => {
    if (balance >= amount && currentLive) {
      setBalance(prev => prev - amount);
      await updateMetaProgress(amount);
      await sendRealtimeMessage(`Enviou ${amount} CRISEX`, undefined, amount);
      setShowCrisexModal(false);
    }
  };

  const handleSendMessage = async () => {
    if (chatMessage.trim()) {
      await sendRealtimeMessage(chatMessage.trim());
      setChatMessage('');
    }
  };

  const openProductModal = (product: ProductItem) => {
    setSelectedProduct(product);
    setPurchaseSuccess(false);
    setShowProductModal(true);
  };

  const handlePurchase = async () => {
    if (!selectedProduct || !currentLive) return;
    if (balance >= selectedProduct.price) {
      setBalance(prev => prev - selectedProduct.price);
      
      const newPurchase: PurchasedItem = {
        ...selectedProduct,
        purchasedAt: new Date(),
        seller: currentLive.streamer?.display_name || currentLive.streamer?.username || 'Streamer',
        sellerImage: currentLive.streamer?.avatar_url || '',
      };
      setPurchasedItems(prev => [newPurchase, ...prev]);
      
      // Record purchase in database
      if (user) {
        await supabase.from('purchases').insert({
          buyer_id: user.id,
          seller_id: currentLive.streamer_id,
          product_title: selectedProduct.title,
          product_type: selectedProduct.type,
          product_price: selectedProduct.price,
          creator_earnings: Math.floor(selectedProduct.price * 0.7),
          platform_commission: Math.floor(selectedProduct.price * 0.3),
        });
      }
      
      setPurchaseSuccess(true);
      toast({
        title: "Compra realizada! 🎉",
        description: `${selectedProduct.title} foi adicionado à sua coleção.`,
      });
      setTimeout(() => {
        setShowProductModal(false);
        setPurchaseSuccess(false);
      }, 1500);
    } else {
      toast({
        title: "Saldo insuficiente",
        description: "Você não tem CRISEX suficiente para esta compra.",
        variant: "destructive",
      });
    }
  };

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLiveThumbnail(file);
      const reader = new FileReader();
      reader.onloadend = () => setThumbnailPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCreateLive = async () => {
    if (!user || !newLive.title.trim()) {
      toast({ title: "Erro", description: "Adicione um título para a live.", variant: "destructive" });
      return;
    }

    setCreating(true);
    try {
      let thumbnailUrl = null;
      
      if (liveThumbnail) {
        const ext = liveThumbnail.name.split('.').pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('live-thumbnails')
          .upload(path, liveThumbnail);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('live-thumbnails')
          .getPublicUrl(path);
        thumbnailUrl = publicUrl;
      }

      const { data: newLiveData, error: insertError } = await supabase
        .from('lives')
        .insert({
          streamer_id: user.id,
          title: newLive.title,
          thumbnail_url: thumbnailUrl,
          meta_goal: newLive.meta_goal,
          is_active: true,
          categories: newLiveCategories,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      toast({ title: "Live iniciada!", description: "Sua live está ao vivo agora." });
      setShowCreateModal(false);
      setNewLive({ title: '', meta_goal: 5000 });
      setNewLiveCategories([]);
      setLiveThumbnail(null);
      setThumbnailPreview('');

      // Auto-select the new live
      if (newLiveData) {
        setSelectedLive(newLiveData as unknown as LiveStream);
        setViewMode('stream');
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error creating live:', error);
      toast({ title: "Erro", description: "Não foi possível iniciar a live.", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const handleSelectLive = (live: LiveStream) => {
    setSelectedLive(live);
    setViewMode('stream');
    setIsPlaying(false);
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedLive(null);
    setIsPlaying(false);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // RENDER: Lives List View
  if (viewMode === 'list') {
    return (
      <div className="h-full w-full bg-background overflow-auto">
        {/* Header */}
        <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/20 pt-2 pb-3 px-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-foreground">Lives</h1>
            <div className="flex items-center gap-2">
              <div className="px-2.5 py-1 bg-card/60 backdrop-blur-sm rounded-full flex items-center gap-1.5">
                <img src={crisexToken} alt="CRISEX" className="w-4 h-4" />
                <span className="text-xs font-bold text-foreground">{balance.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <CategoryFilter 
            selectedCategory={selectedCategory} 
            onCategoryChange={setSelectedCategory}
          />
        </div>

        {/* Lives Grid */}
        <LivesList 
          category={selectedCategory}
          onSelectLive={handleSelectLive}
          selectedLiveId={selectedLive?.id}
        />

        {/* Create Live FAB */}
        <button 
          onClick={() => setShowCreateModal(true)} 
          className="fixed bottom-24 right-4 z-40 w-14 h-14 bg-destructive rounded-full flex items-center justify-center active:scale-90 transition-all shadow-lg"
        >
          <VideoIcon className="w-6 h-6 text-destructive-foreground" />
        </button>

        {/* Create Live Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-end" onClick={() => setShowCreateModal(false)}>
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
            <div 
              className="relative w-full max-h-[85vh] bg-card rounded-t-3xl p-6 animate-slide-up overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-6" />
              
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-foreground">Iniciar Live</h3>
                <button onClick={() => setShowCreateModal(false)} className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                  <X className="w-4 h-4 text-foreground" />
                </button>
              </div>

              {/* Thumbnail Upload */}
              <div 
                onClick={() => thumbnailInputRef.current?.click()}
                className="relative aspect-video w-full mb-4 bg-secondary rounded-xl overflow-hidden cursor-pointer border-2 border-dashed border-border hover:border-primary transition-colors"
              >
                {thumbnailPreview ? (
                  <img src={thumbnailPreview} alt="Thumbnail" className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                    <Camera className="w-8 h-8 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Thumbnail da Live (opcional)</span>
                  </div>
                )}
              </div>
              <input ref={thumbnailInputRef} type="file" accept="image/*" onChange={handleThumbnailSelect} className="hidden" />

              {/* Title */}
              <input
                type="text"
                value={newLive.title}
                onChange={(e) => setNewLive({ ...newLive, title: e.target.value })}
                placeholder="Título da live *"
                className="w-full p-3 mb-4 bg-secondary rounded-xl text-sm text-foreground placeholder:text-muted-foreground border-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              />

              {/* Categories */}
              <CategorySelector 
                selectedCategories={newLiveCategories}
                onCategoriesChange={setNewLiveCategories}
                className="mb-4"
              />

              {/* Meta Goal */}
              <div className="mb-6">
                <label className="text-xs text-muted-foreground mb-2 block">Meta de CRISEX</label>
                <div className="flex items-center gap-2 p-3 bg-secondary rounded-xl">
                  <img src={crisexToken} alt="CRISEX" className="w-5 h-5" />
                  <input
                    type="number"
                    value={newLive.meta_goal}
                    onChange={(e) => setNewLive({ ...newLive, meta_goal: parseInt(e.target.value) || 0 })}
                    className="flex-1 bg-transparent text-sm text-foreground border-none focus:outline-none"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleCreateLive}
                disabled={creating || !newLive.title.trim() || newLiveCategories.length === 0}
                className="w-full py-3 gradient-primary rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {creating ? (
                  <span className="text-sm font-bold text-primary-foreground">Iniciando...</span>
                ) : (
                  <>
                    <VideoIcon className="w-5 h-5 text-primary-foreground" />
                    <span className="text-sm font-bold text-primary-foreground">Iniciar Live</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // RENDER: Stream View
  const thumbnail = currentLive?.thumbnail_url || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800';
  const streamerName = currentLive?.streamer?.display_name || currentLive?.streamer?.username || 'Streamer';
  const streamerAvatar = currentLive?.streamer?.avatar_url || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100';

  return (
    <div className="h-full w-full relative overflow-hidden bg-background">
      <div 
        className="absolute inset-0 bg-cover bg-center cursor-pointer" 
        style={{ backgroundImage: `url(${thumbnail})` }}
        onClick={() => {
          setIsMuted(!isMuted);
          setShowMuteIndicator(true);
          setTimeout(() => setShowMuteIndicator(false), 800);
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-black/40" />
      </div>

      {/* Mute/Unmute center indicator */}
      {showMuteIndicator && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
          <div className="w-16 h-16 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center animate-scale-in">
            {isMuted ? <VolumeX className="w-8 h-8 text-white" /> : <Volume2 className="w-8 h-8 text-white" />}
          </div>
        </div>
      )}

      {/* Discrete Mode Timer Display */}
      {discreteMode && (
        <div className="absolute top-3 right-3 z-[60] px-3 py-1.5 bg-card/80 backdrop-blur-sm rounded-full flex items-center gap-2">
          <EyeOff className="w-4 h-4 text-primary" />
          <span className="text-xs font-medium text-foreground">
            {Math.floor(discreteModeSeconds / 60)}:{(discreteModeSeconds % 60).toString().padStart(2, '0')}
          </span>
        </div>
      )}

      {/* All UI hidden when discrete mode is active */}
      {!discreteMode && (
        <>
          {/* Top Header */}
          <div className="absolute top-0 left-0 right-0 z-50 safe-area-top flex flex-col gap-2 pt-2">
            {/* Back button + Categories */}
            <div className="px-3 flex items-center gap-2">
              <button 
                onClick={handleBackToList}
                className="w-8 h-8 bg-card/60 backdrop-blur-sm rounded-full flex items-center justify-center"
              >
                <ArrowLeft className="w-4 h-4 text-foreground" />
              </button>
              <div className="flex-1">
                <CategoryFilter 
                  selectedCategory={selectedCategory} 
                  onCategoryChange={setSelectedCategory}
                />
              </div>
            </div>

            {/* Viewers + Balance */}
            <div className="flex items-center justify-between px-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {currentLive?.viewers_count?.toLocaleString() || 0} assistindo
                </span>
              </div>
              <div className="px-2.5 py-1 bg-card/60 backdrop-blur-sm rounded-full flex items-center gap-1.5">
                <img src={crisexToken} alt="CRISEX" className="w-4 h-4" />
                <span className="text-xs font-bold text-foreground">{balance.toLocaleString()}</span>
              </div>
            </div>

            {/* Meta Progress */}
            <div className="px-3">
              <LiveMetaProgress 
                progress={currentLive?.meta_progress || 0} 
                goal={currentLive?.meta_goal || 5000} 
              />
            </div>
          </div>

          {/* Product Cards - Left Side */}
          <div className="absolute left-2 top-[130px] z-20 flex flex-col gap-3">
            {LIVE_PRODUCTS.map((product) => (
              <button
                key={product.id}
                onClick={() => openProductModal(product)}
                className="w-24 bg-card/95 backdrop-blur-sm rounded-xl overflow-hidden border border-border/30 shadow-lg hover:scale-105 transition-transform active:scale-95"
              >
                <div className="relative">
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-primary to-primary/80 py-1 px-2 z-10">
                    <p className="text-[8px] font-bold text-primary-foreground uppercase tracking-wide text-center">
                      {product.type === 'pack' ? 'Comprar' : 'Vídeo'}
                    </p>
                    <p className="text-[9px] font-extrabold text-primary-foreground uppercase text-center">
                      {product.type === 'pack' ? 'Novidades' : 'Privado'}
                    </p>
                  </div>
                  <div className="aspect-[3/4] bg-muted/50">
                    <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
                  </div>
                </div>
                <div className="p-2 bg-card text-center">
                  <p className="text-[9px] font-semibold text-foreground truncate">{product.title}</p>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <img src={crisexToken} alt="CRISEX" className="w-4 h-4" />
                    <span className="text-[11px] font-bold text-green-500">{product.price}</span>
                    <span className="text-[7px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold">{product.badge}</span>
                  </div>
                  <div className="w-full mt-1.5 py-1.5 bg-primary rounded-lg text-[8px] font-bold text-primary-foreground uppercase tracking-wide text-center">
                    Comprar
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Chat Messages - Realtime */}
          <LiveChatMessages messages={messages} discreteMode={discreteMode} />

          {/* Right Action Bar */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col items-center gap-4 z-30">
            {/* Profile Avatar with Follow */}
            <button onClick={() => setIsFollowing(!isFollowing)} className="relative flex flex-col items-center">
              <div className="w-12 h-12 rounded-full p-[2px] bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500">
                <img src={streamerAvatar} alt={streamerName} className="w-full h-full rounded-full object-cover border-2 border-black" />
              </div>
              {!isFollowing && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-5 bg-primary rounded-full flex items-center justify-center border-2 border-black">
                  <Plus className="w-3 h-3 text-white" />
                </div>
              )}
            </button>
            
            <button onClick={() => setIsLiked(!isLiked)} className="flex flex-col items-center gap-1">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90 ${isLiked ? 'bg-primary/20' : 'bg-card/50 backdrop-blur-sm border border-border/30'}`}>
                <Heart className={`w-6 h-6 transition-all ${isLiked ? 'text-primary fill-primary animate-heart' : 'text-foreground'}`} />
              </div>
              <span className="text-[10px] text-foreground font-medium">12.4K</span>
            </button>
            
            <button onClick={() => setShowHistoryModal(true)} className="flex flex-col items-center gap-1 relative">
              <div className="w-12 h-12 bg-card/50 backdrop-blur-sm border border-border/30 rounded-full flex items-center justify-center active:scale-90 transition-all">
                <Package className="w-5 h-5 text-foreground" />
              </div>
              {purchasedItems.length > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-[9px] font-bold text-primary-foreground">{purchasedItems.length}</span>
                </div>
              )}
              <span className="text-[10px] text-foreground font-medium">Compras</span>
            </button>
            
            <button onClick={() => setShowMimos(true)} className="flex flex-col items-center gap-1">
              <div className="w-12 h-12 gradient-primary rounded-full flex items-center justify-center active:scale-90 transition-all shadow-glow">
                <Gift className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-[10px] text-foreground font-medium">Mimos</span>
            </button>
            
            <button onClick={() => setShowCrisexModal(true)} className="flex flex-col items-center gap-1">
              <div className="w-12 h-12 bg-card/50 backdrop-blur-sm border border-primary/50 rounded-full flex items-center justify-center active:scale-90 transition-all">
                <Coins className="w-5 h-5 text-primary" />
              </div>
              <span className="text-[10px] text-foreground font-medium">CRISEX</span>
            </button>
            
            {/* Discrete Mode Button */}
            <button onClick={toggleDiscreteMode} className="flex flex-col items-center gap-1">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center active:scale-90 transition-all ${
                discreteMode ? 'bg-primary shadow-glow' : 'bg-card/50 backdrop-blur-sm border border-border/30'
              }`}>
                {discreteMode ? <EyeOff className="w-5 h-5 text-primary-foreground" /> : <Eye className="w-5 h-5 text-foreground" />}
              </div>
              <span className="text-[10px] text-foreground font-medium">Discreto</span>
            </button>
          </div>

          {/* Play Button */}
          {!isPlaying && (
            <button onClick={() => { setIsPlaying(true); initAudioContext(); }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
              <div className="w-20 h-20 gradient-primary rounded-full flex items-center justify-center shadow-glow animate-pulse-slow">
                <Play className="w-10 h-10 text-primary-foreground fill-primary-foreground ml-1" />
              </div>
              <p className="text-center text-sm font-semibold text-foreground mt-3 tracking-wide">ENTRAR NA LIVE</p>
            </button>
          )}

          {/* Chat Input */}
          <div className="absolute bottom-0 left-0 right-0 z-30 p-3 bg-gradient-to-t from-background via-background/80 to-transparent pt-8">
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <input 
                  type="text" 
                  placeholder="Envie uma mensagem..." 
                  value={chatMessage} 
                  onChange={(e) => setChatMessage(e.target.value)} 
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} 
                  className="w-full h-11 pl-4 pr-12 bg-card/50 backdrop-blur-sm rounded-full text-sm text-foreground placeholder:text-muted-foreground border border-border/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50" 
                />
                <button onClick={handleSendMessage} className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 gradient-primary rounded-full flex items-center justify-center">
                  <Send className="w-4 h-4 text-primary-foreground" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Mimos Modal */}
      {showMimos && (
        <div className="absolute inset-0 z-50 flex items-end" onClick={() => setShowMimos(false)}>
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
          <div className="relative w-full glass-dark rounded-t-3xl p-6 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-6" />
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-foreground">Enviar Mimo 🎁</h3>
              <div className="px-3 py-1.5 bg-secondary rounded-full flex items-center gap-2">
                <img src={crisexToken} alt="CRISEX" className="w-5 h-5" />
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
            <button onClick={() => setShowMimos(false)} className="absolute top-4 right-4 w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
              <X className="w-4 h-4 text-foreground" />
            </button>
          </div>
        </div>
      )}

      {/* CRISEX Modal */}
      {showCrisexModal && (
        <div className="absolute inset-0 z-50 flex items-end" onClick={() => setShowCrisexModal(false)}>
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
          <div className="relative w-full glass-dark rounded-t-3xl p-6 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-6" />
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-foreground">Enviar CRISEX</h3>
              <div className="px-3 py-1.5 bg-secondary rounded-full flex items-center gap-2">
                <img src={crisexToken} alt="CRISEX" className="w-5 h-5" />
                <span className="text-sm font-bold text-foreground">{balance.toLocaleString()}</span>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {[50, 100, 200, 500, 1000, 2000, 5000, 10000].map((amount) => (
                <button 
                  key={amount} 
                  onClick={() => sendCrisex(amount)} 
                  disabled={balance < amount} 
                  className={`flex flex-col items-center p-3 rounded-xl transition-all active:scale-95 ${balance >= amount ? 'bg-secondary hover:bg-primary/20 border border-transparent hover:border-primary/50' : 'opacity-40'}`}
                >
                  <img src={crisexToken} alt="CRISEX" className="w-6 h-6 mb-1" />
                  <span className="text-sm font-bold text-foreground">{amount >= 1000 ? `${amount/1000}K` : amount}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setShowCrisexModal(false)} className="absolute top-4 right-4 w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
              <X className="w-4 h-4 text-foreground" />
            </button>
          </div>
        </div>
      )}

      {/* Product Purchase Modal */}
      {showProductModal && selectedProduct && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowProductModal(false)}>
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />
          <div className="relative w-full max-w-xs bg-card rounded-3xl overflow-hidden border border-border/30 shadow-2xl animate-scale-up" onClick={(e) => e.stopPropagation()}>
            <div className="relative aspect-[3/4] w-full">
              <img src={selectedProduct.image} alt={selectedProduct.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
              <button onClick={() => setShowProductModal(false)} className="absolute top-3 right-3 w-8 h-8 bg-card/80 backdrop-blur-sm rounded-full flex items-center justify-center">
                <X className="w-4 h-4 text-foreground" />
              </button>
              <div className="absolute top-3 left-3 px-2 py-1 bg-primary rounded-full">
                <span className="text-[10px] font-bold text-primary-foreground uppercase">
                  {selectedProduct.type === 'pack' ? 'Pack Exclusivo' : 'Vídeo Privado'}
                </span>
              </div>
            </div>

            <div className="p-5 -mt-8 relative">
              <h3 className="text-lg font-bold text-foreground mb-1">{selectedProduct.title}</h3>
              <p className="text-xs text-muted-foreground mb-4">
                {selectedProduct.type === 'pack' ? 'Pack com fotos exclusivas em alta qualidade' : 'Vídeo privado de conteúdo exclusivo'}
              </p>

              <div className="flex items-center justify-between mb-4 p-3 bg-secondary/50 rounded-xl">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Preço</p>
                  <div className="flex items-center gap-1">
                    <img src={crisexToken} alt="CRISEX" className="w-5 h-5" />
                    <span className="text-lg font-bold text-primary">{selectedProduct.price}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Seu Saldo</p>
                  <div className="flex items-center gap-1 justify-end">
                    <img src={crisexToken} alt="CRISEX" className="w-5 h-5" />
                    <span className={`text-lg font-bold ${balance >= selectedProduct.price ? 'text-foreground' : 'text-destructive'}`}>
                      {balance.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {purchaseSuccess ? (
                <div className="w-full py-3 bg-green-500 rounded-xl flex items-center justify-center gap-2">
                  <Check className="w-5 h-5 text-white" />
                  <span className="text-sm font-bold text-white">Compra Realizada!</span>
                </div>
              ) : (
                <button
                  onClick={handlePurchase}
                  disabled={balance < selectedProduct.price}
                  className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 ${
                    balance >= selectedProduct.price ? 'gradient-primary shadow-glow' : 'bg-muted cursor-not-allowed'
                  }`}
                >
                  <ShoppingBag className={`w-5 h-5 ${balance >= selectedProduct.price ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                  <span className={`text-sm font-bold ${balance >= selectedProduct.price ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                    {balance >= selectedProduct.price ? 'Confirmar Compra' : 'Saldo Insuficiente'}
                  </span>
                </button>
              )}

              {balance < selectedProduct.price && !purchaseSuccess && (
                <p className="text-[10px] text-center text-muted-foreground mt-2">
                  Você precisa de mais {(selectedProduct.price - balance).toLocaleString()} CRISEX
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Purchase History Modal */}
      {showHistoryModal && (
        <div className="absolute inset-0 z-50 flex items-end" onClick={() => { setShowHistoryModal(false); setSelectedPurchased(null); }}>
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />
          <div className="relative w-full max-h-[85vh] bg-card rounded-t-3xl overflow-hidden border-t border-border/30 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mt-3" />
            
            <div className="p-4 border-b border-border/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 gradient-primary rounded-full flex items-center justify-center">
                    <Package className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Minhas Compras</h3>
                    <p className="text-xs text-muted-foreground">{purchasedItems.length} itens adquiridos</p>
                  </div>
                </div>
                <button onClick={() => { setShowHistoryModal(false); setSelectedPurchased(null); }} className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                  <X className="w-4 h-4 text-foreground" />
                </button>
              </div>
            </div>

            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {purchasedItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
                    <ShoppingBag className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h4 className="text-base font-semibold text-foreground mb-1">Nenhuma compra ainda</h4>
                  <p className="text-sm text-muted-foreground max-w-[200px]">
                    Compre packs e vídeos exclusivos durante as lives!
                  </p>
                </div>
              ) : selectedPurchased ? (
                <div className="animate-fade-in">
                  <button onClick={() => setSelectedPurchased(null)} className="flex items-center gap-2 text-sm text-muted-foreground mb-4 hover:text-foreground transition-colors">
                    <X className="w-4 h-4" />
                    Voltar
                  </button>
                  
                  <div className="rounded-2xl overflow-hidden bg-secondary/50">
                    <img src={selectedPurchased.image} alt={selectedPurchased.title} className="w-full aspect-[4/5] object-cover" />
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-primary/20 text-primary text-[10px] font-bold rounded uppercase">
                          {selectedPurchased.type === 'pack' ? 'Pack' : 'Vídeo'}
                        </span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(selectedPurchased.purchasedAt)}
                        </span>
                      </div>
                      <h4 className="text-lg font-bold text-foreground mb-2">{selectedPurchased.title}</h4>
                      
                      <div className="flex items-center gap-2 p-3 bg-card rounded-xl mb-3">
                        <img src={selectedPurchased.sellerImage} alt={selectedPurchased.seller} className="w-8 h-8 rounded-full object-cover" />
                        <div>
                          <p className="text-xs text-muted-foreground">Vendido por</p>
                          <p className="text-sm font-semibold text-foreground">{selectedPurchased.seller}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-primary/10 rounded-xl">
                        <span className="text-xs text-muted-foreground">Valor pago</span>
                        <div className="flex items-center gap-1">
                          <img src={crisexToken} alt="CRISEX" className="w-5 h-5" />
                          <span className="text-base font-bold text-primary">{selectedPurchased.price}</span>
                        </div>
                      </div>
                      
                      <button className="w-full mt-4 py-3 gradient-primary rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform">
                        <Eye className="w-5 h-5 text-primary-foreground" />
                        <span className="text-sm font-bold text-primary-foreground">Ver Conteúdo</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {purchasedItems.map((item) => (
                    <button
                      key={`${item.id}-${item.purchasedAt.getTime()}`}
                      onClick={() => setSelectedPurchased(item)}
                      className="w-full flex items-center gap-3 p-3 bg-secondary/50 rounded-xl hover:bg-secondary/80 transition-colors active:scale-[0.98]"
                    >
                      <img src={item.image} alt={item.title} className="w-16 h-20 rounded-lg object-cover" />
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-1.5 py-0.5 bg-primary/20 text-primary text-[8px] font-bold rounded uppercase">
                            {item.type === 'pack' ? 'Pack' : 'Vídeo'}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-foreground truncate">{item.title}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <img src={item.sellerImage} alt={item.seller} className="w-4 h-4 rounded-full object-cover" />
                          <span className="text-[10px] text-muted-foreground">{item.seller}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground">{formatDate(item.purchasedAt)}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <img src={crisexToken} alt="CRISEX" className="w-4 h-4" />
                          <span className="text-sm font-bold text-primary">{item.price}</span>
                        </div>
                        <Eye className="w-4 h-4 text-muted-foreground mt-2 ml-auto" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
