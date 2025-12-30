export enum AppMode {
  AUTH = 'AUTH',
  ONBOARDING = 'ONBOARDING',
  FEED = 'FEED',
  REELS = 'REELS',
  LIVE = 'LIVE',
  CHAT = 'CHAT',
  SHOP = 'SHOP',
  PROFILE = 'PROFILE'
}

export interface MimoType {
  id: string;
  name: string;
  icon: string;
  price: number;
  color: string;
  animation: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
}

export interface UserPost {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  isPro: boolean;
  price?: string;
  likes: number;
  author: string;
  authorImage: string;
  createdAt: Date;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface Profile {
  id: string;
  name: string;
  age: number;
  bio: string;
  image: string;
  distance: string;
  isVerified: boolean;
  isOnline: boolean;
  followers: number;
  following: number;
  posts: number;
}

export interface StoryItem {
  id: string;
  name: string;
  image: string;
  isLive?: boolean;
  hasStory?: boolean;
}

export interface ReelItem {
  id: string;
  videoUrl: string;
  thumbnail: string;
  author: string;
  authorImage: string;
  description: string;
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
}

export interface LiveStream {
  id: string;
  streamer: string;
  streamerImage: string;
  title: string;
  viewers: number;
  thumbnail: string;
  isVerified: boolean;
}

export interface ChatConversation {
  id: string;
  name: string;
  image: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  isOnline: boolean;
}

export interface ShopItem {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  rating: number;
  sales: number;
}
