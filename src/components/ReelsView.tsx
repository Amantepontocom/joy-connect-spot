import { useState } from 'react';
import { Heart, Gift, Lock, Send, UserPlus, Coins, X, Play, Volume2, VolumeX, Music2 } from 'lucide-react';
import { REELS, MIMOS } from '@/lib/mockData';

interface ReelsViewProps {
  balance: number;
  setBalance: (updater: (prev: number) => number) => void;
}

export function ReelsView({ balance, setBalance }: ReelsViewProps) {
  const [currentReel, setCurrentReel] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showMimos, setShowMimos] = useState(false);
  const [showCrisexModal, setShowCrisexModal] = useState(false);

  const reel = REELS[currentReel];

  const handleScroll = (direction: 'up' | 'down') => {
    if (direction === 'down' && currentReel < REELS.length - 1) { setCurrentReel(prev => prev + 1); setIsLiked(false); }
    else if (direction === 'up' && currentReel > 0) { setCurrentReel(prev => prev - 1); setIsLiked(false); }
  };

  const sendMimo = (mimo: typeof MIMOS[0]) => {
    if (balance >= mimo.price) { setBalance(prev => prev - mimo.price); setShowMimos(false); }
  };

  const sendCrisex = (amount: number) => {
    if (balance >= amount) { setBalance(prev => prev - amount); setShowCrisexModal(false); }
  };

  return (
    <div className="h-full w-full relative overflow-hidden bg-background">
      <div className="absolute inset-0 bg-cover bg-center transition-all duration-500" style={{ backgroundImage: `url(${reel.thumbnail})` }} onClick={() => setIsPlaying(!isPlaying)}>
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/30" />
      </div>

      <div className="absolute top-0 bottom-24 left-0 w-1/3 z-10" onClick={(e) => { e.stopPropagation(); handleScroll('up'); }} />
      <div className="absolute top-0 bottom-24 right-0 w-1/3 z-10" onClick={(e) => { e.stopPropagation(); handleScroll('down'); }} />

      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="w-20 h-20 glass rounded-full flex items-center justify-center animate-scale-in"><Play className="w-10 h-10 text-foreground ml-1" /></div>
        </div>
      )}

      <div className="absolute top-3 left-4 right-4 flex gap-1 z-20">
        {REELS.map((_, index) => (<div key={index} className={`flex-1 h-1 rounded-full transition-all ${index === currentReel ? 'bg-primary' : index < currentReel ? 'bg-foreground/80' : 'bg-foreground/30'}`} />))}
      </div>

      <div className="absolute right-3 bottom-28 flex flex-col items-center gap-4 z-30">
        <div className="relative mb-2">
          <img src={reel.authorImage} alt={reel.author} className="w-12 h-12 rounded-full object-cover ring-2 ring-primary" />
          <button onClick={() => setIsFollowing(!isFollowing)} className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full flex items-center justify-center border-2 border-background ${isFollowing ? 'bg-green-500' : 'gradient-primary'}`}>
            <UserPlus className="w-3 h-3 text-primary-foreground" />
          </button>
        </div>
        <button onClick={() => setIsLiked(!isLiked)} className="flex flex-col items-center gap-1">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90 ${isLiked ? 'bg-primary/20' : 'bg-card/40 backdrop-blur-sm'}`}>
            <Heart className={`w-6 h-6 transition-all ${isLiked ? 'text-primary fill-primary animate-heart' : 'text-foreground'}`} />
          </div>
          <span className="text-[10px] text-foreground font-medium">{((reel.likes + (isLiked ? 1 : 0)) / 1000).toFixed(1)}K</span>
        </button>
        <button className="flex flex-col items-center gap-1"><div className="w-12 h-12 bg-card/40 backdrop-blur-sm rounded-full flex items-center justify-center active:scale-90 transition-all"><Lock className="w-5 h-5 text-foreground" /></div><span className="text-[10px] text-foreground font-medium">Privado</span></button>
        <button onClick={() => setShowMimos(true)} className="flex flex-col items-center gap-1"><div className="w-12 h-12 gradient-primary rounded-full flex items-center justify-center active:scale-90 transition-all shadow-glow"><Gift className="w-5 h-5 text-primary-foreground" /></div><span className="text-[10px] text-foreground font-medium">Mimos</span></button>
        <button onClick={() => setShowCrisexModal(true)} className="flex flex-col items-center gap-1"><div className="w-12 h-12 bg-card/40 backdrop-blur-sm border border-primary/50 rounded-full flex items-center justify-center active:scale-90 transition-all"><Coins className="w-5 h-5 text-primary" /></div><span className="text-[10px] text-foreground font-medium">CRISEX</span></button>
        <button onClick={() => setIsMuted(!isMuted)} className="flex flex-col items-center gap-1"><div className="w-10 h-10 bg-card/40 backdrop-blur-sm rounded-full flex items-center justify-center active:scale-90 transition-all">{isMuted ? <VolumeX className="w-4 h-4 text-foreground" /> : <Volume2 className="w-4 h-4 text-foreground" />}</div></button>
      </div>

      <div className="absolute bottom-20 left-4 right-20 z-20">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-bold text-foreground text-base">@{reel.author.toLowerCase().replace(' ', '')}</span>
          {!isFollowing && <button onClick={() => setIsFollowing(true)} className="px-3 py-1 border border-foreground/40 rounded-lg text-xs font-semibold text-foreground hover:bg-foreground/10 transition-colors">Seguir</button>}
        </div>
        <p className="text-foreground text-sm leading-relaxed mb-2 line-clamp-2">{reel.description}</p>
        <div className="flex items-center gap-2 bg-card/30 backdrop-blur-sm px-3 py-1.5 rounded-lg w-fit">
          <Music2 className="w-3.5 h-3.5 text-foreground animate-spin" style={{ animationDuration: '3s' }} />
          <span className="text-[11px] text-foreground truncate max-w-[180px]">Som original - {reel.author}</span>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-30 p-3 bg-gradient-to-t from-background via-background/60 to-transparent pt-6">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <input type="text" placeholder="Adicione um comentário..." className="w-full h-10 pl-4 pr-12 bg-card/40 backdrop-blur-sm rounded-full text-sm text-foreground placeholder:text-muted-foreground border border-border/30 focus:outline-none focus:ring-2 focus:ring-primary/50" />
            <button className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 gradient-primary rounded-full flex items-center justify-center"><Send className="w-3.5 h-3.5 text-primary-foreground" /></button>
          </div>
        </div>
      </div>

      {showMimos && (
        <div className="absolute inset-0 z-50 flex items-end" onClick={() => setShowMimos(false)}>
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
          <div className="relative w-full glass-dark rounded-t-3xl p-6 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-6" />
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-foreground">Enviar Mimo 🎁</h3>
              <div className="px-3 py-1.5 bg-secondary rounded-full flex items-center gap-2"><span className="text-sm">💎</span><span className="text-sm font-bold text-foreground">{balance.toLocaleString()}</span></div>
            </div>
            <div className="grid grid-cols-5 gap-3">
              {MIMOS.map((mimo) => (<button key={mimo.id} onClick={() => sendMimo(mimo)} disabled={balance < mimo.price} className={`flex flex-col items-center p-3 rounded-xl transition-all active:scale-95 ${balance >= mimo.price ? 'bg-secondary hover:bg-secondary/80' : 'opacity-40'}`}><span className="text-3xl mb-1">{mimo.icon}</span><span className="text-xs font-semibold text-foreground">{mimo.price}</span></button>))}
            </div>
            <button onClick={() => setShowMimos(false)} className="absolute top-4 right-4 w-8 h-8 bg-secondary rounded-full flex items-center justify-center"><X className="w-4 h-4 text-foreground" /></button>
          </div>
        </div>
      )}

      {showCrisexModal && (
        <div className="absolute inset-0 z-50 flex items-end" onClick={() => setShowCrisexModal(false)}>
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
          <div className="relative w-full glass-dark rounded-t-3xl p-6 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-6" />
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-foreground">Enviar CRISEX 💎</h3>
              <div className="px-3 py-1.5 bg-secondary rounded-full flex items-center gap-2"><span className="text-sm">💎</span><span className="text-sm font-bold text-foreground">{balance.toLocaleString()}</span></div>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {[50, 100, 200, 500, 1000, 2000, 5000, 10000].map((amount) => (<button key={amount} onClick={() => sendCrisex(amount)} disabled={balance < amount} className={`flex flex-col items-center p-3 rounded-xl transition-all active:scale-95 ${balance >= amount ? 'bg-secondary hover:bg-primary/20 border border-transparent hover:border-primary/50' : 'opacity-40'}`}><Coins className="w-6 h-6 text-primary mb-1" /><span className="text-sm font-bold text-foreground">{amount >= 1000 ? `${amount/1000}K` : amount}</span></button>))}
            </div>
            <button onClick={() => setShowCrisexModal(false)} className="absolute top-4 right-4 w-8 h-8 bg-secondary rounded-full flex items-center justify-center"><X className="w-4 h-4 text-foreground" /></button>
          </div>
        </div>
      )}
    </div>
  );
}
