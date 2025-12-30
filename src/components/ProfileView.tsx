import { useState } from 'react';
import { Settings, Grid3X3, Film, Heart, Crown, Share2, UserPlus, MoreHorizontal, Edit2, TrendingUp, DollarSign, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppMode } from '@/lib/types';

interface ProfileViewProps {
  balance: number;
  setBalance: (updater: (prev: number) => number) => void;
  userImages: string[];
  userPosts: { id: string; thumbnail: string; likes: number }[];
  onPlusClick?: () => void;
  onNavigate?: (mode: AppMode) => void;
}

const TABS = [{ id: 'posts', icon: Grid3X3 }, { id: 'reels', icon: Film }, { id: 'likes', icon: Heart }];
const SAMPLE_POSTS = ['https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300', 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=300', 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300'];

export function ProfileView({ balance, onPlusClick, onNavigate }: ProfileViewProps) {
  const [activeTab, setActiveTab] = useState('posts');
  const [isFollowing, setIsFollowing] = useState(false);

  return (
    <div className="h-full overflow-y-auto hide-scrollbar bg-background">
      <div className="px-6 pt-4 pb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">@mariasantos</h2>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-secondary rounded-full transition-colors"><Share2 className="w-5 h-5 text-foreground" /></button>
            <button className="p-2 hover:bg-secondary rounded-full transition-colors"><MoreHorizontal className="w-5 h-5 text-foreground" /></button>
            <button className="p-2 hover:bg-secondary rounded-full transition-colors"><Settings className="w-5 h-5 text-foreground" /></button>
          </div>
        </div>

        <div className="flex items-start gap-6">
          <div className="relative">
            <div className="p-1 gradient-primary rounded-full animate-glow">
              <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200" alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-background" />
            </div>
            <button onClick={onPlusClick} className="absolute -bottom-1 -right-1 w-8 h-8 gradient-primary rounded-full flex items-center justify-center border-2 border-background shadow-lg"><span className="text-primary-foreground text-lg font-bold">+</span></button>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-lg font-bold text-foreground">Maria Santos</h3>
              <Crown className="w-5 h-5 text-gold fill-gold" />
            </div>
            <div className="flex gap-6">
              <div className="text-center"><p className="font-bold text-foreground">156</p><p className="text-xs text-muted-foreground">Posts</p></div>
              <div className="text-center"><p className="font-bold text-foreground">24.5K</p><p className="text-xs text-muted-foreground">Seguidores</p></div>
              <div className="text-center"><p className="font-bold text-foreground">892</p><p className="text-xs text-muted-foreground">Seguindo</p></div>
            </div>
          </div>
        </div>

        <div className="mt-4"><p className="text-foreground text-sm leading-relaxed">✨ Criadora de conteúdo premium 💕<br />📍 São Paulo, Brasil<br />💌 Contato: DM aberta</p></div>

        <div className="mt-4 p-4 gradient-secondary rounded-2xl border border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center"><span className="text-2xl">💎</span></div>
              <div><p className="text-xs text-muted-foreground uppercase tracking-wider">Saldo CRISEX</p><p className="text-xl font-bold text-foreground">{balance.toLocaleString()}</p></div>
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

        <div className="flex gap-3 mt-4">
          <Button onClick={() => setIsFollowing(!isFollowing)} className={`flex-1 h-12 rounded-xl font-semibold transition-all ${isFollowing ? 'bg-secondary text-foreground hover:bg-secondary/80' : 'gradient-primary text-primary-foreground shadow-pink-sm'}`}>{isFollowing ? 'Seguindo' : 'Seguir'}</Button>
          <Button variant="outline" className="h-12 px-4 rounded-xl border-border"><UserPlus className="w-5 h-5" /></Button>
          <Button variant="outline" className="h-12 px-4 rounded-xl border-border"><Edit2 className="w-5 h-5" /></Button>
        </div>
      </div>

      <div className="flex border-b border-border">
        {TABS.map((tab) => (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 py-4 flex items-center justify-center transition-colors ${activeTab === tab.id ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}><tab.icon className="w-6 h-6" /></button>))}
      </div>

      <div className="grid grid-cols-3 gap-0.5 pb-20">
        {SAMPLE_POSTS.map((image, index) => (
          <button key={index} className="aspect-square relative group animate-fade-in overflow-hidden" style={{ animationDelay: `${index * 0.05}s` }}>
            <img src={image} alt={`Post ${index + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            <div className="absolute inset-0 bg-background/0 group-hover:bg-background/30 transition-colors flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 text-primary-foreground"><Heart className="w-5 h-5 fill-current" /><span className="font-semibold">{Math.floor(Math.random() * 5000) + 100}</span></div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
