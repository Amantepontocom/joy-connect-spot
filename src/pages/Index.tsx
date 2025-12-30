import { useState, useEffect } from 'react';
import { Heart, Play, Radio, MessageCircle, ShoppingBag, MapPin } from 'lucide-react';
import { AppMode } from '@/lib/types';
import { AuthView } from '@/components/AuthView';
import { OnboardingView } from '@/components/OnboardingView';
import { PhotoFeedView } from '@/components/PhotoFeedView';
import { ReelsView } from '@/components/ReelsView';
import { LiveView } from '@/components/LiveView';
import { ChatView } from '@/components/ChatView';
import { ShopView } from '@/components/ShopView';
import { ProfileView } from '@/components/ProfileView';

const Index = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.AUTH);
  const [crisexBalance, setCrisexBalance] = useState(1250);

  useEffect(() => {
    const saved = localStorage.getItem('crisex_balance');
    if (saved) setCrisexBalance(Number(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('crisex_balance', crisexBalance.toString());
  }, [crisexBalance]);

  if (mode === AppMode.AUTH) {
    return <AuthView onSuccess={() => setMode(AppMode.ONBOARDING)} />;
  }

  if (mode === AppMode.ONBOARDING) {
    return <OnboardingView onComplete={() => setMode(AppMode.FEED)} />;
  }

  const showHeader = mode !== AppMode.LIVE && mode !== AppMode.REELS;

  const NavItem = ({ target, icon, label, badgeCount }: { target: AppMode; icon: React.ReactNode; label: string; badgeCount?: number }) => {
    const isActive = mode === target;
    return (
      <button
        onClick={() => setMode(target)}
        className={`flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 relative ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
      >
        <div className={`mb-1 transition-transform ${isActive ? 'scale-110' : 'scale-100'}`}>{icon}</div>
        <span className={`text-[10px] font-semibold tracking-tight ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>{label}</span>
        {badgeCount !== undefined && badgeCount > 0 && (
          <div className="absolute top-1 right-1/4 gradient-primary text-primary-foreground text-[9px] font-bold px-1.5 rounded-full min-w-[16px] h-4 flex items-center justify-center shadow-sm">
            {badgeCount}
          </div>
        )}
      </button>
    );
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-background text-foreground font-sans overflow-hidden">
      {showHeader && (
        <header className="h-16 flex items-center justify-between px-4 border-b border-border shrink-0 bg-background/80 backdrop-blur-md z-50 animate-fade-in">
          <div className="flex items-center gap-2 cursor-pointer active:scale-95 transition-transform" onClick={() => setMode(AppMode.FEED)}>
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-pink-sm">
              <Heart className="w-5 h-5 text-primary-foreground fill-current" />
            </div>
            <span className="text-xl font-bold text-gradient">Amantes.com</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-secondary px-3 py-1.5 rounded-full animate-fade-in">
              <span className="text-lg">💎</span>
              <span className="text-sm font-bold text-foreground">{crisexBalance.toLocaleString()}</span>
            </div>
            <button
              onClick={() => setMode(AppMode.PROFILE)}
              className={`relative p-0.5 rounded-full transition-all duration-300 active:scale-90 ${mode === AppMode.PROFILE ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}
            >
              <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100" className="w-9 h-9 rounded-full object-cover" alt="Profile" />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-online rounded-full border-2 border-background" />
            </button>
          </div>
        </header>
      )}

      <main className="flex-1 overflow-hidden relative">
        {mode === AppMode.FEED && <PhotoFeedView balance={crisexBalance} setBalance={setCrisexBalance} onNavigate={setMode} />}
        {mode === AppMode.REELS && <ReelsView balance={crisexBalance} setBalance={setCrisexBalance} />}
        {mode === AppMode.LIVE && <LiveView balance={crisexBalance} setBalance={setCrisexBalance} />}
        {mode === AppMode.CHAT && <ChatView />}
        {mode === AppMode.SHOP && <ShopView balance={crisexBalance} setBalance={setCrisexBalance} />}
        {mode === AppMode.PROFILE && <ProfileView balance={crisexBalance} setBalance={setCrisexBalance} userImages={[]} userPosts={[]} />}
      </main>

      <nav className="h-[70px] bg-background border-t border-border flex items-center justify-around px-2 z-50 shrink-0 pb-2">
        <NavItem target={AppMode.FEED} label="Feed" icon={<MapPin className="h-6 w-6" strokeWidth={mode === AppMode.FEED ? 2.5 : 2} />} />
        <NavItem target={AppMode.REELS} label="Reels" icon={<Play className="h-6 w-6" strokeWidth={mode === AppMode.REELS ? 2.5 : 2} />} />
        <NavItem target={AppMode.LIVE} label="Lives" icon={<div className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${mode === AppMode.LIVE ? 'gradient-primary shadow-pink-sm' : 'bg-secondary'}`}><Radio className={`h-6 w-6 ${mode === AppMode.LIVE ? 'text-primary-foreground' : 'text-muted-foreground'}`} /></div>} />
        <NavItem target={AppMode.CHAT} label="Chat" badgeCount={2} icon={<MessageCircle className="h-6 w-6" strokeWidth={mode === AppMode.CHAT ? 2.5 : 2} />} />
        <NavItem target={AppMode.SHOP} label="Shop" icon={<ShoppingBag className="h-6 w-6" strokeWidth={mode === AppMode.SHOP ? 2.5 : 2} />} />
      </nav>
    </div>
  );
};

export default Index;
