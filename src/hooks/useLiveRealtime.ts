import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface LiveStream {
  id: string;
  title: string;
  thumbnail_url: string | null;
  streamer_id: string;
  viewers_count: number;
  meta_goal: number;
  meta_progress: number;
  is_active: boolean;
  categories: string[];
  created_at: string;
  streamer?: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
    is_vip: boolean;
  };
}

export interface ChatMessage {
  id: string;
  live_id: string;
  user_id: string;
  message: string;
  mimo_icon: string | null;
  crisex_amount: number | null;
  created_at: string;
  user?: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
    is_vip: boolean;
  };
}

interface UseLiveRealtimeProps {
  liveId: string | null;
  onNewMessage?: (message: ChatMessage) => void;
  onViewersUpdate?: (count: number) => void;
  onMetaUpdate?: (progress: number) => void;
}

export function useLiveRealtime({ liveId, onNewMessage, onViewersUpdate, onMetaUpdate }: UseLiveRealtimeProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [live, setLive] = useState<LiveStream | null>(null);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const presenceChannelRef = useRef<RealtimeChannel | null>(null);

  // Fetch live data
  const fetchLive = useCallback(async () => {
    if (!liveId) return;
    
    const { data, error } = await supabase
      .from('lives')
      .select(`
        *,
        streamer:profiles!lives_streamer_id_fkey (
          id, username, display_name, avatar_url, is_vip
        )
      `)
      .eq('id', liveId)
      .single();

    if (!error && data) {
      setLive(data as unknown as LiveStream);
    }
    setLoading(false);
  }, [liveId]);

  // Fetch chat messages
  const fetchMessages = useCallback(async () => {
    if (!liveId) return;

    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        user:profiles!chat_messages_user_id_fkey (
          username, display_name, avatar_url, is_vip
        )
      `)
      .eq('live_id', liveId)
      .order('created_at', { ascending: true })
      .limit(50);

    if (!error && data) {
      setMessages(data as unknown as ChatMessage[]);
    }
  }, [liveId]);

  // Send message
  const sendMessage = useCallback(async (text: string, mimoIcon?: string, crisexAmount?: number) => {
    if (!user || !liveId || !text.trim()) return false;

    const { error } = await supabase
      .from('chat_messages')
      .insert({
        live_id: liveId,
        user_id: user.id,
        message: text.trim(),
        mimo_icon: mimoIcon || null,
        crisex_amount: crisexAmount || null,
      });

    return !error;
  }, [user, liveId]);

  // Update meta progress
  const updateMetaProgress = useCallback(async (amount: number) => {
    if (!liveId || !live) return;

    const newProgress = Math.min((live.meta_progress || 0) + amount, live.meta_goal || 5000);

    await supabase
      .from('lives')
      .update({ meta_progress: newProgress })
      .eq('id', liveId);
  }, [liveId, live]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!liveId) return;

    // Subscribe to chat messages
    channelRef.current = supabase
      .channel(`live-chat-${liveId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `live_id=eq.${liveId}`,
        },
        async (payload) => {
          // Fetch user info for the new message
          const { data: userData } = await supabase
            .from('profiles')
            .select('username, display_name, avatar_url, is_vip')
            .eq('id', payload.new.user_id)
            .single();

          const newMessage: ChatMessage = {
            ...payload.new as ChatMessage,
            user: userData || undefined,
          };

          setMessages(prev => [...prev.slice(-49), newMessage]);
          onNewMessage?.(newMessage);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'lives',
          filter: `id=eq.${liveId}`,
        },
        (payload) => {
          const updated = payload.new as LiveStream;
          setLive(prev => prev ? { ...prev, ...updated } : null);
          
          if (updated.viewers_count !== undefined) {
            onViewersUpdate?.(updated.viewers_count);
          }
          if (updated.meta_progress !== undefined) {
            onMetaUpdate?.(updated.meta_progress);
          }
        }
      )
      .subscribe();

    // Presence for viewer count
    presenceChannelRef.current = supabase.channel(`live-presence-${liveId}`);
    
    presenceChannelRef.current
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannelRef.current?.presenceState();
        const viewerCount = state ? Object.keys(state).length : 0;
        
        // Update viewers count in database
        supabase
          .from('lives')
          .update({ viewers_count: viewerCount })
          .eq('id', liveId)
          .then(() => {});
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && user) {
          await presenceChannelRef.current?.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          });
        }
      });

    // Fetch initial data
    fetchLive();
    fetchMessages();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      if (presenceChannelRef.current) {
        supabase.removeChannel(presenceChannelRef.current);
      }
    };
  }, [liveId, user, fetchLive, fetchMessages, onNewMessage, onViewersUpdate, onMetaUpdate]);

  return {
    live,
    messages,
    loading,
    sendMessage,
    updateMetaProgress,
    refetchLive: fetchLive,
    refetchMessages: fetchMessages,
  };
}
