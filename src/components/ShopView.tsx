import { useState, useEffect } from 'react';
import { Play, Images, Crown, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ScrollArea } from '@/components/ui/scroll-area';
import crisexToken from '@/assets/crisex-token.png';
import { toast } from 'sonner';

interface ShopViewProps {
  balance: number;
  setBalance: (updater: (prev: number) => number) => void;
}

interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  type: string;
  badge: string | null;
  image_url: string | null;
  creator: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface Creator {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

const CATEGORIES = ['TUDO', 'VÍDEOS', 'PACKS', 'VIP', 'PROMO'];

export function ShopView({ balance, setBalance }: ShopViewProps) {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('TUDO');
  const [products, setProducts] = useState<Product[]>([]);
  const [featuredCreators, setFeaturedCreators] = useState<Creator[]>([]);
  const [selectedCreator, setSelectedCreator] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch products and creators from database
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // Fetch products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          creator:profiles!products_creator_id_fkey(username, display_name, avatar_url)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (productsError) {
        console.error('Error fetching products:', productsError);
      } else if (productsData) {
        setProducts(productsData);
      }

      // Fetch featured creators (profiles with products)
      const { data: creatorsData, error: creatorsError } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .limit(5);

      if (creatorsError) {
        console.error('Error fetching creators:', creatorsError);
      } else if (creatorsData) {
        setFeaturedCreators(creatorsData);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  const filteredProducts = products.filter(product => {
    if (selectedCategory === 'TUDO') return true;
    if (selectedCategory === 'VÍDEOS') return product.type === 'video';
    if (selectedCategory === 'PACKS') return product.type === 'pack';
    if (selectedCategory === 'VIP') return product.type === 'vip';
    if (selectedCategory === 'PROMO') return product.badge === 'PROMO';
    return true;
  });

  const handleBuy = async (product: Product) => {
    if (!user) {
      toast.error('Você precisa estar logado para comprar');
      return;
    }

    if (balance < product.price) {
      toast.error('Saldo insuficiente');
      return;
    }

    // Deduct balance
    setBalance(prev => prev - product.price);

    // Record purchase
    const { error } = await supabase
      .from('purchases')
      .insert({
        buyer_id: user.id,
        product_id: product.id,
        product_title: product.title,
        product_type: product.type,
        product_price: product.price,
        seller_id: null
      });

    if (error) {
      console.error('Error recording purchase:', error);
      // Refund on error
      setBalance(prev => prev + product.price);
      toast.error('Erro ao processar compra');
    } else {
      toast.success(`${product.title} comprado com sucesso!`);
    }
  };

  const getBadgeStyle = (badge: string | null) => {
    switch (badge) {
      case 'VIP':
        return 'bg-gradient-to-r from-amber-500 to-orange-500 text-white';
      case 'VIDEO':
        return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white';
      case 'PACK':
        return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
      case 'PROMO':
        return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white';
      default:
        return 'bg-secondary text-foreground';
    }
  };

  return (
    <ScrollArea className="h-full bg-background">
      <div className="pb-24">
        {/* Header */}
        <div className="px-3 pt-3 pb-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground font-medium tracking-wider">MARKETPLACE</p>
              <h2 className="text-xl font-bold text-foreground">Boutique</h2>
            </div>
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1 bg-gradient-to-r from-cyan-500 to-teal-500 px-2.5 py-1 rounded-full">
                <img src={crisexToken} alt="CRISEX" className="w-3.5 h-3.5" />
                <span className="text-xs font-bold text-white">{balance.toLocaleString()}</span>
              </div>
              <span className="text-[9px] text-muted-foreground mt-0.5">BALANÇO</span>
            </div>
          </div>
        </div>

        {/* Premium Banner */}
        <div className="px-3 py-2">
          <div className="relative rounded-xl overflow-hidden h-32">
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800)' }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-pink-600/90 via-purple-600/80 to-pink-500/70" />
            <div className="relative z-10 h-full flex flex-col justify-center px-4">
              <p className="text-[9px] text-white/80 font-medium tracking-wider mb-0.5">CINEMA PRIVADO</p>
              <h3 className="text-lg font-bold text-white mb-0.5">Vídeos Premium</h3>
              <p className="text-[10px] text-white/70 mb-2 max-w-[180px] leading-tight">
                Conteúdo em vídeo de alta qualidade disponível para compra individual e imediata.
              </p>
              <button className="w-fit px-3 py-1.5 bg-white text-foreground rounded-full text-[10px] font-semibold">
                VER VÍDEOS
              </button>
            </div>
          </div>
        </div>

        {/* Featured Creators */}
        <div className="px-3 py-2">
          <p className="text-[10px] text-muted-foreground font-medium tracking-wider mb-2">DESTAQUES DA SEMANA</p>
          <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
            {featuredCreators.map((creator) => (
              <button 
                key={creator.id}
                onClick={() => setSelectedCreator(selectedCreator === creator.id ? null : creator.id)}
                className="flex flex-col items-center gap-1 flex-shrink-0"
              >
                <div className={`w-12 h-12 rounded-full p-[2px] ${selectedCreator === creator.id ? 'bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500' : 'bg-border'}`}>
                  <img 
                    src={creator.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'} 
                    alt={creator.display_name || ''} 
                    className="w-full h-full rounded-full object-cover border-2 border-background"
                  />
                </div>
                <span className="text-[10px] font-medium text-foreground uppercase">
                  {creator.display_name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Category Tabs */}
        <div className="px-3 py-1">
          <div className="flex gap-1.5 overflow-x-auto hide-scrollbar">
            {CATEGORIES.map((category) => (
              <button 
                key={category} 
                onClick={() => setSelectedCategory(category)} 
                className={`px-3 py-1.5 rounded-full text-[10px] font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === category 
                    ? 'bg-foreground text-background' 
                    : 'bg-secondary text-muted-foreground'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="px-3 py-2">
          <div className="grid grid-cols-2 gap-2">
            {filteredProducts.map((product) => (
              <div 
                key={product.id} 
                className="bg-card rounded-2xl overflow-hidden border border-border"
              >
                {/* Product Image */}
                <div className="relative aspect-[4/5]">
                  <img 
                    src={product.image_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'} 
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Badge */}
                  {product.badge && (
                    <div className={`absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold ${getBadgeStyle(product.badge)}`}>
                      {product.badge === 'VIDEO' && <Play className="w-2.5 h-2.5 inline mr-0.5" />}
                      {product.badge}
                    </div>
                  )}

                  {/* Media count indicator */}
                  <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full">
                    {product.type === 'video' ? (
                      <>
                        <Play className="w-3 h-3 text-white" />
                        <span className="text-[10px] text-white font-medium">05:20</span>
                      </>
                    ) : (
                      <>
                        <Images className="w-3 h-3 text-white" />
                        <span className="text-[10px] text-white font-medium">15 FOTOS</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-2">
                  <h4 className="font-semibold text-xs text-foreground line-clamp-1">{product.title}</h4>
                  <p className="text-[10px] text-muted-foreground mb-1.5">
                    @{product.creator?.username || 'usuario'}
                  </p>

                  {/* Price and Buy */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-0.5">
                      <span className="font-bold text-sm text-foreground">{product.price}</span>
                      <img src={crisexToken} alt="CRISEX" className="w-3 h-3" />
                    </div>
                    <button 
                      onClick={() => handleBuy(product)}
                      className="flex items-center gap-0.5 px-2.5 py-1 gradient-primary rounded-full text-[10px] font-semibold text-white active:scale-95 transition-transform"
                    >
                      BUY <Plus className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Support Creators Section */}
        <div className="px-3 py-4">
          <div className="bg-secondary rounded-xl p-3 text-center">
            <p className="text-[9px] text-muted-foreground font-medium tracking-wider mb-0.5">SUPORTE ÀS CREATORS</p>
            <h3 className="text-base font-bold text-foreground italic">Compre Individualmente</h3>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
