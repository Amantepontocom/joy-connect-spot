import { useState, useEffect, useRef } from 'react';
import { Heart, Gift, Lock, Send, UserPlus, Coins, X, Play } from 'lucide-react';
import { LIVE_STREAMS, MIMOS } from '@/lib/mockData';

interface LiveViewProps {
  balance: number;
  setBalance: (updater: (prev: number) => number) => void;
}

interface ChatMessage {
  id: string; username: string; message: string; avatar: string; isVip?: boolean; hasMimo?: boolean; mimoIcon?: string; crisexAmount?: number; timestamp: number;
}

const MOCK_USERS = [{ username: 'maria_vip', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=50', isVip: true }, { username: 'joao123', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50', isVip: false }];
const MOCK_MESSAGES = [{ text: 'Olá! 👋', hasMimo: false }, { text: 'Linda demais! 😍', hasMimo: false }, { text: 'Enviou 🌹', hasMimo: true, mimoIcon: '🌹', crisexAmount: 50 }];

export function LiveView({ balance, setBalance }: LiveViewProps) {
  const [showMimos, setShowMimos] = useState(false);
  const [showCrisexModal, setShowCrisexModal] = useState(false);
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
          <div className="flex items-center gap-2"><div className="px-3 py-1.5 bg-card/60 backdrop-blur-sm rounded-full flex items-center gap-2"><span className="text-sm">💎</span><span className="text-sm font-bold text-foreground">{balance.toLocaleString()}</span></div></div>
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

      <div className="absolute left-2 bottom-16 z-20 w-36">
        <div ref={messagesContainerRef} className="flex flex-col gap-1 overflow-hidden">
          {floatingMessages.slice(-3).map((msg, index) => (
            <div key={msg.id} className="flex items-center gap-1.5" style={{ opacity: 1 - (2 - index) * 0.25 }}>
              <img src={msg.avatar} alt={msg.username} className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
              <div className={`rounded-full px-2 py-1 backdrop-blur-md flex items-center gap-1 ${msg.hasMimo || msg.crisexAmount ? 'bg-primary/30' : 'bg-card/50'}`}>
                <span className={`text-[9px] font-semibold truncate max-w-[40px] ${msg.isVip ? 'text-primary' : 'text-foreground'}`}>{msg.username}</span>
                {msg.mimoIcon && <span className="text-xs">{msg.mimoIcon}</span>}
                <span className={`text-[9px] truncate max-w-[50px] ${msg.crisexAmount ? 'text-primary' : 'text-foreground/80'}`}>{msg.message}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col items-center gap-4 z-30">
        <button onClick={() => setIsFollowing(!isFollowing)} className="flex flex-col items-center gap-1 group"><div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90 ${isFollowing ? 'gradient-primary' : 'bg-card/50 backdrop-blur-sm border border-border/30'}`}><UserPlus className={`w-5 h-5 ${isFollowing ? 'text-primary-foreground' : 'text-foreground'}`} /></div><span className="text-[10px] text-foreground font-medium">Seguir</span></button>
        <button onClick={() => setIsLiked(!isLiked)} className="flex flex-col items-center gap-1"><div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90 ${isLiked ? 'bg-primary/20' : 'bg-card/50 backdrop-blur-sm border border-border/30'}`}><Heart className={`w-6 h-6 transition-all ${isLiked ? 'text-primary fill-primary animate-heart' : 'text-foreground'}`} /></div><span className="text-[10px] text-foreground font-medium">12.4K</span></button>
        <button className="flex flex-col items-center gap-1"><div className="w-12 h-12 bg-card/50 backdrop-blur-sm border border-border/30 rounded-full flex items-center justify-center active:scale-90 transition-all"><Lock className="w-5 h-5 text-foreground" /></div><span className="text-[10px] text-foreground font-medium">Privado</span></button>
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
            <div className="flex items-center justify-between mb-4"><h3 className="text-xl font-bold text-foreground">Enviar Mimo 🎁</h3><div className="px-3 py-1.5 bg-secondary rounded-full flex items-center gap-2"><span className="text-sm">💎</span><span className="text-sm font-bold text-foreground">{balance.toLocaleString()}</span></div></div>
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
            <div className="flex items-center justify-between mb-4"><h3 className="text-xl font-bold text-foreground">Enviar CRISEX 💎</h3><div className="px-3 py-1.5 bg-secondary rounded-full flex items-center gap-2"><span className="text-sm">💎</span><span className="text-sm font-bold text-foreground">{balance.toLocaleString()}</span></div></div>
            <div className="grid grid-cols-4 gap-3">{[50, 100, 200, 500, 1000, 2000, 5000, 10000].map((amount) => (<button key={amount} onClick={() => sendCrisex(amount)} disabled={balance < amount} className={`flex flex-col items-center p-3 rounded-xl transition-all active:scale-95 ${balance >= amount ? 'bg-secondary hover:bg-primary/20 border border-transparent hover:border-primary/50' : 'opacity-40'}`}><Coins className="w-6 h-6 text-primary mb-1" /><span className="text-sm font-bold text-foreground">{amount >= 1000 ? `${amount/1000}K` : amount}</span></button>))}</div>
            <button onClick={() => setShowCrisexModal(false)} className="absolute top-4 right-4 w-8 h-8 bg-secondary rounded-full flex items-center justify-center"><X className="w-4 h-4 text-foreground" /></button>
          </div>
        </div>
      )}
    </div>
  );
}
