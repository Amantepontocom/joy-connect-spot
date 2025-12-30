import { useState } from 'react';
import { Send, Mic, Image, Smile, Phone, Video, MoreVertical, ArrowLeft, Crown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { CONVERSATIONS } from '@/lib/mockData';

export function ChatView() {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
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
        <div className="px-4 py-4 border-b border-border">
          <h2 className="text-2xl font-bold text-foreground">Mensagens</h2>
          <p className="text-sm text-muted-foreground mt-1">Suas conversas</p>
        </div>
        <div className="flex-1 overflow-y-auto hide-scrollbar">
          {CONVERSATIONS.map((conv, index) => (
            <button key={conv.id} onClick={() => setSelectedChat(conv.id)} className="w-full flex items-center gap-4 px-4 py-4 hover:bg-secondary/50 transition-colors animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="relative">
                <img src={conv.image} alt={conv.name} className="w-14 h-14 rounded-full object-cover" />
                {conv.isOnline && <div className="absolute bottom-0 right-0 w-4 h-4 bg-online rounded-full border-2 border-background" />}
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-foreground">{conv.name}</span>
                    <Crown className="w-4 h-4 text-gold fill-gold" />
                  </div>
                  <span className="text-xs text-muted-foreground">{conv.timestamp}</span>
                </div>
                <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
              </div>
              {conv.unread > 0 && <div className="w-6 h-6 gradient-primary rounded-full flex items-center justify-center"><span className="text-xs font-bold text-primary-foreground">{conv.unread}</span></div>}
            </button>
          ))}
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
