import { useState } from 'react';
import { Send, Mic, Image, Smile, Phone, Video, MoreVertical, ArrowLeft, Crown, Bot } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { CONVERSATIONS } from '@/lib/mockData';

type TabType = 'conversas' | 'sistema' | 'interacoes';

const SYSTEM_MESSAGES = [
  { id: 'sys1', name: 'Assistente Amantes.com', message: 'Olá! Como posso ajudar você hoje?', timestamp: 'Agora', avatar: '', isBot: true },
];

const INTERACTIONS = [
  { id: 'int1', name: 'Maria enviou 🌹', message: 'Rosa para você!', timestamp: '5min', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=50' },
  { id: 'int2', name: 'João curtiu sua foto', message: 'Noite especial ✨', timestamp: '15min', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50' },
];

export function ChatView() {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('conversas');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    { id: '1', text: 'Oi amor! Como você está? 💕', isMe: false, time: '14:30' },
    { id: '2', text: 'Oi! Tudo bem sim, e você?', isMe: true, time: '14:32' },
    { id: '3', text: 'Estou ótima! Amei o mimo que você mandou 🥰', isMe: false, time: '14:33' },
  ]);

  const currentChat = CONVERSATIONS.find(c => c.id === selectedChat);

  const sendMessage = () => {
    if (message.trim()) {
      setMessages(prev => [...prev, { id: Date.now().toString(), text: message, isMe: true, time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }]);
      setMessage('');
    }
  };

  if (!selectedChat) {
    return (
      <div className="h-full flex flex-col bg-background">
        {/* Tabs */}
        <div className="px-4 pt-4 pb-0">
          <div className="flex gap-6 border-b border-border">
            <button
              onClick={() => setActiveTab('conversas')}
              className={`pb-3 text-sm font-semibold transition-colors relative ${
                activeTab === 'conversas' 
                  ? 'text-foreground' 
                  : 'text-muted-foreground'
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
                activeTab === 'sistema' 
                  ? 'text-foreground' 
                  : 'text-muted-foreground'
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
                activeTab === 'interacoes' 
                  ? 'text-foreground' 
                  : 'text-muted-foreground'
              }`}
            >
              INTERAÇÕES
              {activeTab === 'interacoes' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          </div>
        </div>

        {/* Content based on active tab */}
        <div className="flex-1 overflow-y-auto hide-scrollbar">
          {activeTab === 'conversas' && (
            <>
              {/* Bot Assistant */}
              <button 
                onClick={() => {}}
                className="w-full flex items-center gap-4 px-4 py-4 hover:bg-secondary/50 transition-colors border-b border-border/50"
              >
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

              {/* Regular Conversations */}
              {CONVERSATIONS.map((conv, index) => (
                <button 
                  key={conv.id} 
                  onClick={() => setSelectedChat(conv.id)} 
                  className="w-full flex items-center gap-4 px-4 py-4 hover:bg-secondary/50 transition-colors animate-fade-in border-b border-border/30" 
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="relative">
                    <img src={conv.image} alt={conv.name} className="w-12 h-12 rounded-full object-cover" />
                    {conv.isOnline && <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-online rounded-full border-2 border-background" />}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-foreground text-[15px]">{conv.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{conv.timestamp}</span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                  </div>
                  {conv.unread > 0 && (
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-white">{conv.unread}</span>
                    </div>
                  )}
                </button>
              ))}
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

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex items-center gap-4 px-4 py-3 border-b border-border">
        <button onClick={() => setSelectedChat(null)} className="p-2 -ml-2 hover:bg-secondary rounded-full transition-colors"><ArrowLeft className="w-5 h-5 text-foreground" /></button>
        <div className="relative">
          <img src={currentChat?.image} alt={currentChat?.name} className="w-10 h-10 rounded-full object-cover" />
          {currentChat?.isOnline && <div className="absolute bottom-0 right-0 w-3 h-3 bg-online rounded-full border-2 border-background" />}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-foreground">{currentChat?.name}</span>
            <Crown className="w-4 h-4 text-gold fill-gold" />
          </div>
          <span className="text-xs text-success">Online agora</span>
        </div>
        <button className="p-2 hover:bg-secondary rounded-full transition-colors"><Phone className="w-5 h-5 text-foreground" /></button>
        <button className="p-2 hover:bg-secondary rounded-full transition-colors"><Video className="w-5 h-5 text-foreground" /></button>
        <button className="p-2 hover:bg-secondary rounded-full transition-colors"><MoreVertical className="w-5 h-5 text-foreground" /></button>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            <div className={`max-w-[75%] px-4 py-3 rounded-2xl ${msg.isMe ? 'gradient-primary text-primary-foreground rounded-br-sm' : 'bg-secondary text-foreground rounded-bl-sm'}`}>
              <p className="text-sm">{msg.text}</p>
              <span className={`text-[10px] ${msg.isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{msg.time}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-secondary rounded-full transition-colors"><Image className="w-6 h-6 text-muted-foreground" /></button>
          <button className="p-2 hover:bg-secondary rounded-full transition-colors"><Smile className="w-6 h-6 text-muted-foreground" /></button>
          <Input value={message} onChange={(e) => setMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && sendMessage()} placeholder="Digite sua mensagem..." className="flex-1 h-12 bg-secondary border-0 rounded-xl text-foreground placeholder:text-muted-foreground" />
          {message ? (
            <button onClick={sendMessage} className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center shadow-pink-sm active:scale-95 transition-transform"><Send className="w-5 h-5 text-primary-foreground" /></button>
          ) : (
            <button className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center hover:bg-secondary/80 transition-colors"><Mic className="w-5 h-5 text-foreground" /></button>
          )}
        </div>
      </div>
    </div>
  );
}
