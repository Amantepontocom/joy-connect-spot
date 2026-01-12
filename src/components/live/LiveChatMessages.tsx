import { useRef, useEffect } from 'react';
import { ChatMessage } from '@/hooks/useLiveRealtime';

interface LiveChatMessagesProps {
  messages: ChatMessage[];
  discreteMode?: boolean;
}

const getMimoStyle = (icon?: string | null) => {
  switch (icon) {
    case '🌹': return { animation: 'animate-mimo-rose', glow: 'glow-rose', bg: 'bg-rose-500/20 border-rose-400/50' };
    case '🥂': return { animation: 'animate-mimo-champagne', glow: 'glow-champagne', bg: 'bg-amber-500/20 border-amber-400/50' };
    case '💎': return { animation: 'animate-mimo-diamond', glow: 'glow-diamond', bg: 'bg-cyan-400/20 border-cyan-300/50' };
    case '💋': return { animation: 'animate-mimo-kiss', glow: 'glow-kiss', bg: 'bg-red-500/20 border-red-400/50' };
    case '👑': return { animation: 'animate-mimo-crown', glow: 'glow-crown', bg: 'bg-yellow-500/20 border-yellow-400/50' };
    default: return { animation: '', glow: '', bg: 'bg-primary/30 border-primary/40' };
  }
};

export function LiveChatMessages({ messages, discreteMode = false }: LiveChatMessagesProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  if (discreteMode) return null;

  const displayMessages = messages.slice(-8);

  return (
    <div className="absolute left-0 bottom-20 z-10 w-[85%] max-w-[340px] max-h-[22vh] pl-3">
      <div 
        ref={containerRef}
        className="flex flex-col gap-2.5 justify-end overflow-y-auto hide-scrollbar scroll-smooth"
      >
        {displayMessages.map((msg, index) => {
          const totalMsgs = displayMessages.length;
          const opacity = 0.4 + (index / totalMsgs) * 0.6;
          const hasMimoOrCrisex = msg.mimo_icon || msg.crisex_amount;
          const mimoStyle = getMimoStyle(msg.mimo_icon);
          
          const username = msg.user?.display_name || msg.user?.username || 'Anônimo';
          const avatar = msg.user?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=50';
          const isVip = msg.user?.is_vip || false;

          return (
            <div 
              key={msg.id}
              className="animate-fade-in"
              style={{ opacity, animationDelay: `${index * 50}ms` }}
            >
              <div className={`flex items-center gap-2 ${hasMimoOrCrisex ? 'animate-scale-in' : ''}`}>
                <img 
                  src={avatar}
                  alt={username}
                  className={`rounded-full object-cover flex-shrink-0 ${
                    hasMimoOrCrisex 
                      ? `w-7 h-7 ring-2 ring-primary ${mimoStyle.glow}` 
                      : 'w-6 h-6'
                  }`}
                />
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`font-bold ${
                    hasMimoOrCrisex 
                      ? 'text-sm text-primary' 
                      : 'text-[13px] text-foreground'
                  } ${isVip ? 'text-primary' : ''}`}>
                    {username}
                  </span>
                  {msg.mimo_icon && (
                    <span className={`${hasMimoOrCrisex ? 'text-xl' : 'text-base'} ${mimoStyle.animation}`}>
                      {msg.mimo_icon}
                    </span>
                  )}
                  {msg.crisex_amount && (
                    <span className="text-xs font-bold text-primary animate-pulse">
                      +{msg.crisex_amount}
                    </span>
                  )}
                  <span className={`${
                    hasMimoOrCrisex 
                      ? 'text-sm text-foreground font-medium' 
                      : 'text-[13px] text-foreground/80'
                  }`}>
                    {msg.message}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
