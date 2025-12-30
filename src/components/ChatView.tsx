import { useState, useEffect, useRef } from 'react';
import { Send, Mic, Image, Smile, Phone, Video, MoreVertical, ArrowLeft, Crown, Bot, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

type TabType = 'conversas' | 'sistema' | 'interacoes';

interface Conversation {
  id: string;
  participant_1: string;
  participant_2: string;
  last_message: string | null;
  last_message_at: string;
  other_user?: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
    is_vip: boolean;
  };
  unread_count?: number;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

const INTERACTIONS = [
  { id: 'int1', name: 'Maria enviou 🌹', message: 'Rosa para você!', timestamp: '5min', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=50' },
  { id: 'int2', name: 'João curtiu sua foto', message: 'Noite especial ✨', timestamp: '15min', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50' },
];

export function ChatView() {
  const { user, profile } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('conversas');
  const [messageInput, setMessageInput] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations
  useEffect(() => {
    if (!user) return;

    const fetchConversations = async () => {
      setLoading(true);
      
      const { data: convs, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
        .order('last_message_at', { ascending: false });

      if (error) {
        console.error('Error fetching conversations:', error);
        setLoading(false);
        return;
      }

      // Fetch other user profiles for each conversation
      const convsWithProfiles = await Promise.all(
        (convs || []).map(async (conv) => {
          const otherUserId = conv.participant_1 === user.id ? conv.participant_2 : conv.participant_1;
          
          const { data: otherUser } = await supabase
            .from('profiles')
            .select('id, username, display_name, avatar_url, is_vip')
            .eq('id', otherUserId)
            .maybeSingle();

          // Count unread messages
          const { count } = await supabase
            .from('private_messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .neq('sender_id', user.id)
            .eq('is_read', false);

          return {
            ...conv,
            other_user: otherUser || undefined,
            unread_count: count || 0,
          };
        })
      );

      setConversations(convsWithProfiles);
      setLoading(false);
    };

    fetchConversations();

    // Subscribe to new conversations
    const channel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Fetch messages for selected conversation
  useEffect(() => {
    if (!selectedConversation || !user) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('private_messages')
        .select('*')
        .eq('conversation_id', selectedConversation.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      setMessages(data || []);

      // Mark messages as read
      await supabase
        .from('private_messages')
        .update({ is_read: true })
        .eq('conversation_id', selectedConversation.id)
        .neq('sender_id', user.id)
        .eq('is_read', false);
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`messages-${selectedConversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'private_messages',
          filter: `conversation_id=eq.${selectedConversation.id}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => [...prev, newMessage]);
          
          // Mark as read if not from current user
          if (newMessage.sender_id !== user.id) {
            supabase
              .from('private_messages')
              .update({ is_read: true })
              .eq('id', newMessage.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation, user]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation || !user || sending) return;

    setSending(true);
    const content = messageInput.trim();
    setMessageInput('');

    try {
      // Insert message
      const { error: msgError } = await supabase
        .from('private_messages')
        .insert({
          conversation_id: selectedConversation.id,
          sender_id: user.id,
          content,
        });

      if (msgError) throw msgError;

      // Update conversation last message
      await supabase
        .from('conversations')
        .update({
          last_message: content,
          last_message_at: new Date().toISOString(),
        })
        .eq('id', selectedConversation.id);

    } catch (error) {
      console.error('Error sending message:', error);
      setMessageInput(content); // Restore message on error
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}min`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  const formatMessageTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  if (!selectedConversation) {
    return (
      <div className="h-full flex flex-col bg-background">
        {/* Tabs */}
        <div className="px-4 pt-4 pb-0">
          <div className="flex gap-6 border-b border-border">
            <button
              onClick={() => setActiveTab('conversas')}
              className={`pb-3 text-sm font-semibold transition-colors relative ${
                activeTab === 'conversas' ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              CONVERSAS
              {activeTab === 'conversas' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('sistema')}
              className={`pb-3 text-sm font-semibold transition-colors relative ${
                activeTab === 'sistema' ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              SISTEMA
              {activeTab === 'sistema' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('interacoes')}
              className={`pb-3 text-sm font-semibold transition-colors relative ${
                activeTab === 'interacoes' ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              INTERAÇÕES
              {activeTab === 'interacoes' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto hide-scrollbar">
          {activeTab === 'conversas' && (
            <>
              {/* Bot Assistant */}
              <button className="w-full flex items-center gap-4 px-4 py-4 hover:bg-secondary/50 transition-colors border-b border-border/50">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <Bot className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-online rounded-full border-2 border-background" />
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-semibold text-foreground text-[15px]">Assistente Amantes.com</span>
                    <span className="text-xs text-muted-foreground">Agora</span>
                  </div>
                  <p className="text-sm text-primary">Olá! Como posso ajudar você hoje?</p>
                </div>
              </button>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <p className="text-muted-foreground">Nenhuma conversa ainda</p>
                  <p className="text-sm text-muted-foreground mt-1">Suas mensagens aparecerão aqui</p>
                </div>
              ) : (
                conversations.map((conv, index) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className="w-full flex items-center gap-4 px-4 py-4 hover:bg-secondary/50 transition-colors animate-fade-in border-b border-border/30"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="relative">
                      <img
                        src={conv.other_user?.avatar_url || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=50'}
                        alt={conv.other_user?.display_name || 'User'}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-semibold text-foreground text-[15px]">
                          {conv.other_user?.display_name || conv.other_user?.username || 'Usuário'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(conv.last_message_at)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {conv.last_message || 'Inicie uma conversa'}
                      </p>
                    </div>
                    {(conv.unread_count || 0) > 0 && (
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-white">{conv.unread_count}</span>
                      </div>
                    )}
                  </button>
                ))
              )}
            </>
          )}

          {activeTab === 'sistema' && (
            <div className="p-4">
              <button className="w-full flex items-center gap-4 px-4 py-4 hover:bg-secondary/50 transition-colors rounded-xl">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Bot className="w-6 h-6 text-primary-foreground" />
                </div>
                <div className="flex-1 text-left">
                  <span className="font-semibold text-foreground text-[15px]">Notificações do Sistema</span>
                  <p className="text-sm text-muted-foreground">Sem novas notificações</p>
                </div>
              </button>
            </div>
          )}

          {activeTab === 'interacoes' && (
            <div className="divide-y divide-border/30">
              {INTERACTIONS.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 px-4 py-4 animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <img src={item.avatar} alt={item.name} className="w-12 h-12 rounded-full object-cover" />
                  <div className="flex-1">
                    <span className="font-semibold text-foreground text-[15px]">{item.name}</span>
                    <p className="text-sm text-muted-foreground">{item.message}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{item.timestamp}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Chat view
  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-3 border-b border-border">
        <button
          onClick={() => setSelectedConversation(null)}
          className="p-2 -ml-2 hover:bg-secondary rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="relative">
          <img
            src={selectedConversation.other_user?.avatar_url || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=50'}
            alt={selectedConversation.other_user?.display_name || 'User'}
            className="w-10 h-10 rounded-full object-cover"
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-foreground">
              {selectedConversation.other_user?.display_name || selectedConversation.other_user?.username || 'Usuário'}
            </span>
            {selectedConversation.other_user?.is_vip && (
              <Crown className="w-4 h-4 text-gold fill-gold" />
            )}
          </div>
        </div>
        <button className="p-2 hover:bg-secondary rounded-full transition-colors">
          <Phone className="w-5 h-5 text-foreground" />
        </button>
        <button className="p-2 hover:bg-secondary rounded-full transition-colors">
          <Video className="w-5 h-5 text-foreground" />
        </button>
        <button className="p-2 hover:bg-secondary rounded-full transition-colors">
          <MoreVertical className="w-5 h-5 text-foreground" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-muted-foreground">Nenhuma mensagem ainda</p>
            <p className="text-sm text-muted-foreground mt-1">Envie uma mensagem para iniciar</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'} animate-fade-in`}
            >
              <div
                className={`max-w-[75%] px-4 py-3 rounded-2xl ${
                  msg.sender_id === user?.id
                    ? 'gradient-primary text-primary-foreground rounded-br-sm'
                    : 'bg-secondary text-foreground rounded-bl-sm'
                }`}
              >
                <p className="text-sm">{msg.content}</p>
                <span
                  className={`text-[10px] ${
                    msg.sender_id === user?.id ? 'text-primary-foreground/70' : 'text-muted-foreground'
                  }`}
                >
                  {formatMessageTime(msg.created_at)}
                </span>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-secondary rounded-full transition-colors">
            <Image className="w-6 h-6 text-muted-foreground" />
          </button>
          <button className="p-2 hover:bg-secondary rounded-full transition-colors">
            <Smile className="w-6 h-6 text-muted-foreground" />
          </button>
          <Input
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Digite sua mensagem..."
            className="flex-1 h-12 bg-secondary border-0 rounded-xl text-foreground placeholder:text-muted-foreground"
            disabled={sending}
          />
          {messageInput ? (
            <button
              onClick={sendMessage}
              disabled={sending}
              className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center shadow-pink-sm active:scale-95 transition-transform disabled:opacity-50"
            >
              {sending ? (
                <Loader2 className="w-5 h-5 text-primary-foreground animate-spin" />
              ) : (
                <Send className="w-5 h-5 text-primary-foreground" />
              )}
            </button>
          ) : (
            <button className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center hover:bg-secondary/80 transition-colors">
              <Mic className="w-5 h-5 text-foreground" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}