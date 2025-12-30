import { MimoType, StoryItem, UserPost, LiveStream, ChatConversation, ShopItem, ReelItem } from './types';

export const MIMOS: MimoType[] = [
  { id: 'm1', name: 'Curtida Premium', icon: '❤️', price: 10, color: 'text-red-500', animation: 'animate-ping' },
  { id: 'm2', name: 'Destaque', icon: '🌟', price: 50, color: 'text-yellow-400', animation: 'animate-bounce' },
  { id: 'm3', name: 'Presente', icon: '🎁', price: 100, color: 'text-purple-500', animation: 'animate-pulse' },
  { id: 'm4', name: 'Super Mimo', icon: '🔥', price: 500, color: 'text-orange-500', animation: 'animate-pulse' },
  { id: 'm5', name: 'Mimo VIP', icon: '👑', price: 1000, color: 'text-gold', animation: 'animate-bounce' },
];

export const STORIES: StoryItem[] = [
  { id: '1', name: 'Você', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', hasStory: false },
  { id: '2', name: 'Isabella', image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150', isLive: true },
  { id: '3', name: 'Camila', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', hasStory: true },
  { id: '4', name: 'Valentina', image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150', hasStory: true },
  { id: '5', name: 'Luna', image: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=150', hasStory: true },
  { id: '6', name: 'Sofia', image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=150', hasStory: true },
];

export const FEED_POSTS: UserPost[] = [
  {
    id: '1',
    title: 'Noite especial ✨',
    description: 'Momentos que ficam para sempre...',
    thumbnail: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600',
    isPro: true,
    price: '15.00',
    likes: 2547,
    author: 'Isabella Rose',
    authorImage: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150',
    createdAt: new Date(),
  },
  {
    id: '2',
    title: 'Sunset vibes 🌅',
    description: 'O pôr do sol mais lindo da semana',
    thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600',
    isPro: false,
    likes: 1893,
    author: 'Camila Santos',
    authorImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    createdAt: new Date(),
  },
  {
    id: '3',
    title: 'Good morning ☀️',
    description: 'Começando o dia com energia positiva',
    thumbnail: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600',
    isPro: true,
    price: '25.00',
    likes: 4210,
    author: 'Valentina Cruz',
    authorImage: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
    createdAt: new Date(),
  },
];

export const LIVE_STREAMS: LiveStream[] = [
  {
    id: '1',
    streamer: 'Isabella Rose',
    streamerImage: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150',
    title: 'Noite de conversa 💕',
    viewers: 1247,
    thumbnail: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600',
    isVerified: true,
  },
  {
    id: '2',
    streamer: 'Luna Star',
    streamerImage: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=150',
    title: 'AO VIVO agora! 🔥',
    viewers: 892,
    thumbnail: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600',
    isVerified: true,
  },
  {
    id: '3',
    streamer: 'Sofia Angel',
    streamerImage: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=150',
    title: 'Q&A com vocês 💬',
    viewers: 456,
    thumbnail: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600',
    isVerified: false,
  },
];

export const CONVERSATIONS: ChatConversation[] = [
  {
    id: '1',
    name: 'Isabella Rose',
    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150',
    lastMessage: 'Oi amor! Tudo bem? 💕',
    timestamp: 'Agora',
    unread: 2,
    isOnline: true,
  },
  {
    id: '2',
    name: 'Camila Santos',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    lastMessage: 'Obrigada pelo mimo! 🥰',
    timestamp: '5min',
    unread: 0,
    isOnline: true,
  },
  {
    id: '3',
    name: 'Valentina Cruz',
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
    lastMessage: 'Vou fazer uma live hoje...',
    timestamp: '1h',
    unread: 1,
    isOnline: false,
  },
];

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: '1',
    name: 'Pack Premium',
    price: 99.90,
    originalPrice: 149.90,
    image: '🎁',
    category: 'Pacotes',
    rating: 4.9,
    sales: 1250,
  },
  {
    id: '2',
    name: '1000 CRISEX',
    price: 49.90,
    image: '💎',
    category: 'Moedas',
    rating: 5.0,
    sales: 8420,
  },
  {
    id: '3',
    name: 'VIP Mensal',
    price: 29.90,
    image: '👑',
    category: 'Assinaturas',
    rating: 4.8,
    sales: 3150,
  },
  {
    id: '4',
    name: 'Super Mimo',
    price: 19.90,
    image: '🔥',
    category: 'Mimos',
    rating: 4.7,
    sales: 5620,
  },
];

export const REELS: ReelItem[] = [
  {
    id: '1',
    videoUrl: '',
    thumbnail: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600',
    author: 'Isabella Rose',
    authorImage: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150',
    description: 'Nova dança que estou treinando 💃✨ #dance #viral',
    likes: 24500,
    comments: 892,
    shares: 156,
    isLiked: false,
  },
  {
    id: '2',
    videoUrl: '',
    thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600',
    author: 'Camila Santos',
    authorImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    description: 'POV: Seu crush te manda mensagem às 3h 😏',
    likes: 18200,
    comments: 445,
    shares: 89,
    isLiked: true,
  },
];
