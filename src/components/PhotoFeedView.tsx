import { useState } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Crown, Play } from 'lucide-react';
import { STORIES, FEED_POSTS } from '@/lib/mockData';
import { AppMode } from '@/lib/types';

interface PhotoFeedViewProps {
  balance: number;
  setBalance: (updater: (prev: number) => number) => void;
  onNavigate: (mode: AppMode) => void;
}

export function PhotoFeedView({ onNavigate }: PhotoFeedViewProps) {
  const [likedPosts, setLikedPosts] = useState<string[]>([]);

  const toggleLike = (postId: string) => {
    setLikedPosts(prev => prev.includes(postId) ? prev.filter(id => id !== postId) : [...prev, postId]);
  };

  return (
    <div className="h-full overflow-y-auto hide-scrollbar bg-background">
      <div className="px-4 py-4 border-b border-border/50">
        <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
          {STORIES.map((story, index) => (
            <button key={story.id} className="flex flex-col items-center gap-2 shrink-0 animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }} onClick={() => story.isLive && onNavigate(AppMode.LIVE)}>
              <div className={`relative p-0.5 rounded-full ${story.isLive ? 'gradient-primary animate-glow' : story.hasStory ? 'gradient-primary' : 'bg-border'}`}>
                <div className="p-0.5 bg-background rounded-full">
                  <img src={story.image} alt={story.name} className="w-16 h-16 rounded-full object-cover" />
                </div>
                {story.isLive && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 gradient-primary rounded text-[10px] font-bold text-primary-foreground uppercase tracking-wider">Live</div>}
                {index === 0 && !story.hasStory && <div className="absolute -bottom-1 -right-1 w-6 h-6 gradient-primary rounded-full flex items-center justify-center text-primary-foreground border-2 border-background"><span className="text-sm font-bold">+</span></div>}
              </div>
              <span className="text-xs font-medium text-foreground truncate w-16 text-center">{story.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="pb-20">
        {FEED_POSTS.map((post, index) => (
          <article key={post.id} className="border-b border-border/50 animate-fade-up" style={{ animationDelay: `${index * 0.15}s` }}>
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img src={post.authorImage} alt={post.author} className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/30" />
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-online rounded-full border-2 border-background" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-foreground">{post.author}</span>
                    {post.isPro && <Crown className="w-4 h-4 text-gold fill-gold" />}
                  </div>
                  <span className="text-xs text-muted-foreground">há 2 horas</span>
                </div>
              </div>
              <button className="p-2 hover:bg-secondary rounded-full transition-colors"><MoreHorizontal className="w-5 h-5 text-muted-foreground" /></button>
            </div>

            <div className="relative aspect-square bg-secondary">
              <img src={post.thumbnail} alt={post.title} className="w-full h-full object-cover" />
              {post.isPro && (
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent flex items-end justify-center pb-8">
                  <button className="gradient-primary px-6 py-3 rounded-xl font-semibold text-primary-foreground shadow-glow flex items-center gap-2 active:scale-95 transition-transform">
                    <Crown className="w-5 h-5" />Desbloquear por R$ {post.price}
                  </button>
                </div>
              )}
              <button className="absolute top-4 right-4 p-2 glass rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><Play className="w-5 h-5 text-foreground" /></button>
            </div>

            <div className="px-4 py-3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-4">
                  <button onClick={() => toggleLike(post.id)} className="group transition-transform active:scale-90">
                    <Heart className={`w-7 h-7 transition-all ${likedPosts.includes(post.id) ? 'text-primary fill-primary animate-heart' : 'text-foreground group-hover:text-primary'}`} />
                  </button>
                  <button className="group transition-transform active:scale-90"><MessageCircle className="w-7 h-7 text-foreground group-hover:text-primary transition-colors" /></button>
                  <button className="group transition-transform active:scale-90"><Share2 className="w-7 h-7 text-foreground group-hover:text-primary transition-colors" /></button>
                </div>
                <button className="group transition-transform active:scale-90"><Bookmark className="w-7 h-7 text-foreground group-hover:text-primary transition-colors" /></button>
              </div>
              <p className="font-semibold text-foreground mb-1">{(post.likes + (likedPosts.includes(post.id) ? 1 : 0)).toLocaleString()} curtidas</p>
              <p className="text-foreground"><span className="font-semibold">{post.author.split(' ')[0].toLowerCase()} </span>{post.description}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
