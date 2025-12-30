import { useState, useEffect, useRef } from 'react';
import { Heart, Gift, Send, UserPlus, X, Play, Check, ShoppingBag, Package, Clock, Eye, Coins } from 'lucide-react';
import { LIVE_STREAMS, MIMOS } from '@/lib/mockData';
import { toast } from '@/hooks/use-toast';
import crisexToken from '@/assets/crisex-token.png';

interface LiveViewProps {
  balance: number;
  setBalance: (updater: (prev: number) => number) => void;
}

interface ChatMessage {
  id: string; username: string; message: string; avatar: string; isVip?: boolean; hasMimo?: boolean; mimoIcon?: string; crisexAmount?: number; timestamp: number;
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

const MOCK_USERS = [{ username: 'maria_vip', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=50', isVip: true }, { username: 'joao123', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50', isVip: false }];
const MOCK_MESSAGES = [{ text: 'Olá! 👋', hasMimo: false }, { text: 'Linda demais! 😍', hasMimo: false }, { text: 'Enviou 🌹', hasMimo: true, mimoIcon: '🌹', crisexAmount: 50 }];

const LIVE_PRODUCTS: ProductItem[] = [
  { id: '1', title: 'PACK VERÃO ...', price: 450, image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200', type: 'pack', badge: 'VIP' },
  { id: '2', title: 'VÍDEO HOT ...', price: 800, image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=200', type: 'video', badge: '🔒' },
];

export function LiveView({ balance, setBalance }: LiveViewProps) {
  const [showMimos, setShowMimos] = useState(false);
  const [showCrisexModal, setShowCrisexModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [selectedPurchased, setSelectedPurchased] = useState<PurchasedItem | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [purchasedItems, setPurchasedItems] = useState<PurchasedItem[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [metaProgress, setMetaProgress] = useState(2350);
  const [floatingMessages, setFloatingMessages] = useState<ChatMessage[]>([]);
  const [chatMessage, setChatMessage] = useState('');
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const currentStream = LIVE_STREAMS[0];
  const metaGoal = 5000;

  useEffect(() => {
    const interval = setInterval(() => {
      const randomUser = MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)];
      const randomMsg = MOCK_MESSAGES[Math.floor(Math.random() * MOCK_MESSAGES.length)];
      const newMessage: ChatMessage = { id: Date.now().toString(), username: randomUser.username, message: randomMsg.text, avatar: randomUser.avatar, isVip: randomUser.isVip, hasMimo: randomMsg.hasMimo, mimoIcon: randomMsg.mimoIcon, crisexAmount: randomMsg.crisexAmount, timestamp: Date.now() };
      setFloatingMessages(prev => [...prev.slice(-12), newMessage]);
      if (randomMsg.crisexAmount) setMetaProgress(prev => Math.min(prev + randomMsg.crisexAmount!, metaGoal));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => { if (messagesContainerRef.current) messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight; }, [floatingMessages]);

  const sendMimo = (mimo: typeof MIMOS[0]) => { if (balance >= mimo.price) { setBalance(prev => prev - mimo.price); setMetaProgress(prev => Math.min(prev + mimo.price, metaGoal)); setShowMimos(false); } };
  const sendCrisex = (amount: number) => { if (balance >= amount) { setBalance(prev => prev - amount); setMetaProgress(prev => Math.min(prev + amount, metaGoal)); setShowCrisexModal(false); } };
  const handleSendMessage = () => { if (chatMessage.trim()) { setFloatingMessages(prev => [...prev.slice(-12), { id: Date.now().toString(), username: 'você', message: chatMessage.trim(), avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=50', timestamp: Date.now() }]); setChatMessage(''); } };

  const openProductModal = (product: ProductItem) => {
    setSelectedProduct(product);
    setPurchaseSuccess(false);
    setShowProductModal(true);
  };

  const handlePurchase = () => {
    if (!selectedProduct) return;
    if (balance >= selectedProduct.price) {
      setBalance(prev => prev - selectedProduct.price);
      
      // Add to purchased items
      const newPurchase: PurchasedItem = {
        ...selectedProduct,
        purchasedAt: new Date(),
        seller: currentStream?.streamer || 'Unknown',
        sellerImage: currentStream?.streamerImage || '',
      };
      setPurchasedItems(prev => [newPurchase, ...prev]);
      
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

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const progressPercent = (metaProgress / metaGoal) * 100;

  return (
    <div className="h-full w-full relative overflow-hidden bg-background">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${currentStream?.thumbnail})` }}><div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-background/60" /></div>

      <div className="absolute top-0 left-0 right-0 z-30 p-4 pt-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="relative"><img src={currentStream?.streamerImage} alt={currentStream?.streamer} className="w-11 h-11 rounded-full object-cover ring-2 ring-primary" /><div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-background" /></div>
            <div><p className="text-sm font-bold text-foreground">{currentStream?.streamer}</p><p className="text-xs text-muted-foreground">{currentStream?.viewers.toLocaleString()} assistindo</p></div>
          </div>
          <div className="flex items-center gap-2"><div className="px-3 py-1.5 bg-card/60 backdrop-blur-sm rounded-full flex items-center gap-2"><img src={crisexToken} alt="CRISEX" className="w-5 h-5" /><span className="text-sm font-bold text-foreground">{balance.toLocaleString()}</span></div></div>
        </div>
        <div className="bg-card/80 backdrop-blur-sm rounded-2xl px-4 py-3 border border-border/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">Meta do Criador</span>
            <span className="text-[11px] font-semibold text-primary">{metaProgress.toLocaleString()} / {metaGoal.toLocaleString()} CRISEX</span>
          </div>
          <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-700 ease-out" style={{ width: `${progressPercent}%` }} />
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 text-center font-medium">🎁 Meta: Show exclusivo ao vivo!</p>
        </div>
      </div>

      {/* Product Cards - Left Side */}
      <div className="absolute left-2 top-40 z-20 flex flex-col gap-3">
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

      {/* Chat Messages - Left Side Extended - TikTok Live Style */}
      <div className="absolute left-0 bottom-20 z-10 w-[85%] max-w-[340px] max-h-[22vh] pl-3">
        <div 
          ref={messagesContainerRef} 
          className="flex flex-col gap-2.5 justify-end overflow-y-auto hide-scrollbar scroll-smooth"
        >
          {floatingMessages.slice(-8).map((msg, index) => {
            const totalMsgs = Math.min(floatingMessages.length, 8);
            const opacity = 0.4 + (index / totalMsgs) * 0.6;
            const hasMimoOrCrisex = msg.hasMimo || msg.crisexAmount;
            
            // Get mimo animation and glow based on icon
            const getMimoStyle = (icon?: string) => {
              switch (icon) {
                case '🌹': return { animation: 'animate-mimo-rose', glow: 'glow-rose', bg: 'bg-rose-500/20 border-rose-400/50' };
                case '🥂': return { animation: 'animate-mimo-champagne', glow: 'glow-champagne', bg: 'bg-amber-500/20 border-amber-400/50' };
                case '💎': return { animation: 'animate-mimo-diamond', glow: 'glow-diamond', bg: 'bg-cyan-400/20 border-cyan-300/50' };
                case '💋': return { animation: 'animate-mimo-kiss', glow: 'glow-kiss', bg: 'bg-red-500/20 border-red-400/50' };
                case '👑': return { animation: 'animate-mimo-crown', glow: 'glow-crown', bg: 'bg-yellow-500/20 border-yellow-400/50' };
                default: return { animation: '', glow: '', bg: 'bg-primary/30 border-primary/40' };
              }
            };
            
            const mimoStyle = getMimoStyle(msg.mimoIcon);
            
            return (
              <div 
                key={msg.id} 
                className="animate-fade-in"
                style={{ 
                  opacity,
                  animationDelay: `${index * 50}ms`,
                }}
              >
                <div className={`flex items-start gap-2.5 ${hasMimoOrCrisex ? 'animate-scale-in' : ''}`}>
                  <img 
                    src={msg.avatar} 
                    alt={msg.username} 
                    className={`rounded-full object-cover flex-shrink-0 mt-0.5 ${hasMimoOrCrisex ? `w-9 h-9 ring-2 ring-primary ${mimoStyle.glow}` : 'w-7 h-7'}`} 
                  />
                  <div className={`rounded-2xl px-3 py-2 backdrop-blur-md border ${hasMimoOrCrisex ? mimoStyle.bg : 'bg-black/40 border-transparent'}`}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`font-bold ${hasMimoOrCrisex ? 'text-sm text-primary' : 'text-[13px] text-foreground'} ${msg.isVip ? 'text-primary' : ''}`}>
                        {msg.username}
                      </span>
                      {msg.mimoIcon && (
                        <span className={`${hasMimoOrCrisex ? 'text-2xl' : 'text-base'} ${mimoStyle.animation}`}>
                          {msg.mimoIcon}
                        </span>
                      )}
                      {msg.crisexAmount && (
                        <span className="text-xs font-bold text-primary animate-pulse">+{msg.crisexAmount}</span>
                      )}
                    </div>
                    <p className={`${hasMimoOrCrisex ? 'text-sm text-primary/90 font-medium' : 'text-[13px] text-foreground/90'} break-words whitespace-pre-wrap leading-relaxed`}>
                      {msg.message}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col items-center gap-4 z-30">
        <button onClick={() => setIsFollowing(!isFollowing)} className="flex flex-col items-center gap-1 group"><div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90 ${isFollowing ? 'gradient-primary' : 'bg-card/50 backdrop-blur-sm border border-border/30'}`}><UserPlus className={`w-5 h-5 ${isFollowing ? 'text-primary-foreground' : 'text-foreground'}`} /></div><span className="text-[10px] text-foreground font-medium">Seguir</span></button>
        <button onClick={() => setIsLiked(!isLiked)} className="flex flex-col items-center gap-1"><div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90 ${isLiked ? 'bg-primary/20' : 'bg-card/50 backdrop-blur-sm border border-border/30'}`}><Heart className={`w-6 h-6 transition-all ${isLiked ? 'text-primary fill-primary animate-heart' : 'text-foreground'}`} /></div><span className="text-[10px] text-foreground font-medium">12.4K</span></button>
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
        <button onClick={() => setShowMimos(true)} className="flex flex-col items-center gap-1"><div className="w-12 h-12 gradient-primary rounded-full flex items-center justify-center active:scale-90 transition-all shadow-glow"><Gift className="w-5 h-5 text-primary-foreground" /></div><span className="text-[10px] text-foreground font-medium">Mimos</span></button>
        <button onClick={() => setShowCrisexModal(true)} className="flex flex-col items-center gap-1"><div className="w-12 h-12 bg-card/50 backdrop-blur-sm border border-primary/50 rounded-full flex items-center justify-center active:scale-90 transition-all"><Coins className="w-5 h-5 text-primary" /></div><span className="text-[10px] text-foreground font-medium">CRISEX</span></button>
      </div>

      {!isPlaying && (<button onClick={() => setIsPlaying(true)} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20"><div className="w-20 h-20 gradient-primary rounded-full flex items-center justify-center shadow-glow animate-pulse-slow"><Play className="w-10 h-10 text-primary-foreground fill-primary-foreground ml-1" /></div><p className="text-center text-sm font-semibold text-foreground mt-3 tracking-wide">ENTRAR NA LIVE</p></button>)}

      <div className="absolute bottom-0 left-0 right-0 z-30 p-3 bg-gradient-to-t from-background via-background/80 to-transparent pt-8">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <input type="text" placeholder="Envie uma mensagem..." value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} className="w-full h-11 pl-4 pr-12 bg-card/50 backdrop-blur-sm rounded-full text-sm text-foreground placeholder:text-muted-foreground border border-border/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50" />
            <button onClick={handleSendMessage} className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 gradient-primary rounded-full flex items-center justify-center"><Send className="w-4 h-4 text-primary-foreground" /></button>
          </div>
        </div>
      </div>

      {showMimos && (
        <div className="absolute inset-0 z-50 flex items-end" onClick={() => setShowMimos(false)}>
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
          <div className="relative w-full glass-dark rounded-t-3xl p-6 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-6" />
            <div className="flex items-center justify-between mb-4"><h3 className="text-xl font-bold text-foreground">Enviar Mimo 🎁</h3><div className="px-3 py-1.5 bg-secondary rounded-full flex items-center gap-2"><img src={crisexToken} alt="CRISEX" className="w-5 h-5" /><span className="text-sm font-bold text-foreground">{balance.toLocaleString()}</span></div></div>
            <div className="grid grid-cols-5 gap-3">{MIMOS.map((mimo) => (<button key={mimo.id} onClick={() => sendMimo(mimo)} disabled={balance < mimo.price} className={`flex flex-col items-center p-3 rounded-xl transition-all active:scale-95 ${balance >= mimo.price ? 'bg-secondary hover:bg-secondary/80' : 'opacity-40'}`}><span className="text-3xl mb-1">{mimo.icon}</span><span className="text-xs font-semibold text-foreground">{mimo.price}</span></button>))}</div>
            <button onClick={() => setShowMimos(false)} className="absolute top-4 right-4 w-8 h-8 bg-secondary rounded-full flex items-center justify-center"><X className="w-4 h-4 text-foreground" /></button>
          </div>
        </div>
      )}

      {showCrisexModal && (
        <div className="absolute inset-0 z-50 flex items-end" onClick={() => setShowCrisexModal(false)}>
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
          <div className="relative w-full glass-dark rounded-t-3xl p-6 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-6" />
            <div className="flex items-center justify-between mb-4"><h3 className="text-xl font-bold text-foreground">Enviar CRISEX</h3><div className="px-3 py-1.5 bg-secondary rounded-full flex items-center gap-2"><img src={crisexToken} alt="CRISEX" className="w-5 h-5" /><span className="text-sm font-bold text-foreground">{balance.toLocaleString()}</span></div></div>
            <div className="grid grid-cols-4 gap-3">{[50, 100, 200, 500, 1000, 2000, 5000, 10000].map((amount) => (<button key={amount} onClick={() => sendCrisex(amount)} disabled={balance < amount} className={`flex flex-col items-center p-3 rounded-xl transition-all active:scale-95 ${balance >= amount ? 'bg-secondary hover:bg-primary/20 border border-transparent hover:border-primary/50' : 'opacity-40'}`}><img src={crisexToken} alt="CRISEX" className="w-6 h-6 mb-1" /><span className="text-sm font-bold text-foreground">{amount >= 1000 ? `${amount/1000}K` : amount}</span></button>))}</div>
            <button onClick={() => setShowCrisexModal(false)} className="absolute top-4 right-4 w-8 h-8 bg-secondary rounded-full flex items-center justify-center"><X className="w-4 h-4 text-foreground" /></button>
          </div>
        </div>
      )}

      {/* Product Purchase Modal */}
      {showProductModal && selectedProduct && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowProductModal(false)}>
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />
          <div 
            className="relative w-full max-w-xs bg-card rounded-3xl overflow-hidden border border-border/30 shadow-2xl animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Product Image */}
            <div className="relative aspect-[3/4] w-full">
              <img 
                src={selectedProduct.image} 
                alt={selectedProduct.title} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
              <button 
                onClick={() => setShowProductModal(false)} 
                className="absolute top-3 right-3 w-8 h-8 bg-card/80 backdrop-blur-sm rounded-full flex items-center justify-center"
              >
                <X className="w-4 h-4 text-foreground" />
              </button>
              <div className="absolute top-3 left-3 px-2 py-1 bg-primary rounded-full">
                <span className="text-[10px] font-bold text-primary-foreground uppercase">
                  {selectedProduct.type === 'pack' ? 'Pack Exclusivo' : 'Vídeo Privado'}
                </span>
              </div>
            </div>

            {/* Product Info */}
            <div className="p-5 -mt-8 relative">
              <h3 className="text-lg font-bold text-foreground mb-1">{selectedProduct.title}</h3>
              <p className="text-xs text-muted-foreground mb-4">
                {selectedProduct.type === 'pack' 
                  ? 'Pack com fotos exclusivas em alta qualidade' 
                  : 'Vídeo privado de conteúdo exclusivo'}
              </p>

              {/* Price & Balance */}
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

              {/* Purchase Button */}
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
                    balance >= selectedProduct.price 
                      ? 'gradient-primary shadow-glow' 
                      : 'bg-muted cursor-not-allowed'
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
          <div 
            className="relative w-full max-h-[85vh] bg-card rounded-t-3xl overflow-hidden border-t border-border/30 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mt-3" />
            
            {/* Header */}
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
                <button 
                  onClick={() => { setShowHistoryModal(false); setSelectedPurchased(null); }} 
                  className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-foreground" />
                </button>
              </div>
            </div>

            {/* Content */}
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
                /* Item Detail View */
                <div className="animate-fade-in">
                  <button 
                    onClick={() => setSelectedPurchased(null)}
                    className="flex items-center gap-2 text-sm text-muted-foreground mb-4 hover:text-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Voltar
                  </button>
                  
                  <div className="rounded-2xl overflow-hidden bg-secondary/50">
                    <img 
                      src={selectedPurchased.image} 
                      alt={selectedPurchased.title} 
                      className="w-full aspect-[4/5] object-cover"
                    />
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
                        <img 
                          src={selectedPurchased.sellerImage} 
                          alt={selectedPurchased.seller} 
                          className="w-8 h-8 rounded-full object-cover"
                        />
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
                /* Items List */
                <div className="space-y-3">
                  {purchasedItems.map((item) => (
                    <button
                      key={`${item.id}-${item.purchasedAt.getTime()}`}
                      onClick={() => setSelectedPurchased(item)}
                      className="w-full flex items-center gap-3 p-3 bg-secondary/50 rounded-xl hover:bg-secondary/80 transition-colors active:scale-[0.98]"
                    >
                      <img 
                        src={item.image} 
                        alt={item.title} 
                        className="w-16 h-20 rounded-lg object-cover"
                      />
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
