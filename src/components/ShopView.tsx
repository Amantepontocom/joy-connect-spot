import { useState } from 'react';
import { Search, Star, ShoppingBag, TrendingUp, Crown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { SHOP_ITEMS } from '@/lib/mockData';

interface ShopViewProps {
  balance: number;
  setBalance: (updater: (prev: number) => number) => void;
}

const CATEGORIES = ['Todos', 'Pacotes', 'Moedas', 'Assinaturas', 'Mimos'];

export function ShopView({ balance }: ShopViewProps) {
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = SHOP_ITEMS.filter(item => {
    const matchesCategory = selectedCategory === 'Todos' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="h-full overflow-y-auto hide-scrollbar bg-background">
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Loja</h2>
            <p className="text-sm text-muted-foreground">Itens exclusivos para você</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-xl">
            <span className="text-lg">💎</span>
            <span className="font-bold text-foreground">{balance.toLocaleString()}</span>
          </div>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar produtos..." className="pl-12 h-12 bg-secondary border-0 rounded-xl text-foreground placeholder:text-muted-foreground" />
        </div>

        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
          {CATEGORIES.map((category) => (
            <button key={category} onClick={() => setSelectedCategory(category)} className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all active:scale-95 ${selectedCategory === category ? 'gradient-primary text-primary-foreground shadow-pink-sm' : 'bg-secondary text-foreground hover:bg-secondary/80'}`}>
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4">
        <div className="gradient-primary rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-foreground/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary-foreground/10 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-5 h-5 text-gold fill-gold" />
              <span className="text-xs font-bold text-primary-foreground uppercase tracking-wider">VIP</span>
            </div>
            <h3 className="text-2xl font-bold text-primary-foreground mb-2">Pacote Premium</h3>
            <p className="text-sm text-primary-foreground/80 mb-4">Acesso ilimitado por 30 dias</p>
            <button className="px-6 py-3 bg-primary-foreground text-primary rounded-xl font-semibold active:scale-95 transition-transform">Assinar Agora - R$ 49,90</button>
          </div>
        </div>
      </div>

      <div className="px-4 pb-24">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-foreground">Produtos</h3>
          <div className="flex items-center gap-1 text-sm text-muted-foreground"><TrendingUp className="w-4 h-4" />Mais vendidos</div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {filteredItems.map((item, index) => (
            <div key={item.id} className="bg-card rounded-2xl p-4 border border-border hover:border-primary/30 hover:shadow-pink-sm transition-all animate-fade-up cursor-pointer group" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">{item.image}</div>
              <h4 className="font-semibold text-foreground mb-1">{item.name}</h4>
              <div className="flex items-center gap-1 mb-2">
                <Star className="w-3 h-3 text-gold fill-gold" />
                <span className="text-xs text-foreground">{item.rating}</span>
                <span className="text-xs text-muted-foreground">({item.sales.toLocaleString()} vendas)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-primary">R$ {item.price.toFixed(2).replace('.', ',')}</span>
                {item.originalPrice && <span className="text-sm text-muted-foreground line-through">R$ {item.originalPrice.toFixed(2).replace('.', ',')}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <button className="fixed bottom-24 right-4 w-14 h-14 gradient-primary rounded-2xl flex items-center justify-center shadow-glow z-50 active:scale-95 transition-transform">
        <ShoppingBag className="w-6 h-6 text-primary-foreground" />
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full flex items-center justify-center"><span className="text-xs font-bold text-destructive-foreground">2</span></div>
      </button>
    </div>
  );
}
