import { useState, useEffect, useRef } from 'react';
import { Play, Images, Plus, X, ChevronLeft, ChevronRight, Heart, Share2, ShoppingBag, Upload, Camera } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
const COMMISSION_RATE = 0.30;
const CREATOR_SHARE = 0.70;

export function ShopView({ balance, setBalance }: ShopViewProps) {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('TUDO');
  const [products, setProducts] = useState<Product[]>([]);
  const [featuredCreators, setFeaturedCreators] = useState<Creator[]>([]);
  const [selectedCreator, setSelectedCreator] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    title: '',
    description: '',
    price: '',
    type: 'pack',
    badge: 'PACK'
  });
  const [productImage, setProductImage] = useState<File | null>(null);
  const [productImagePreview, setProductImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProductImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Create new product
  const handleCreateProduct = async () => {
    if (!user) {
      toast.error('Você precisa estar logado');
      return;
    }

    if (!newProduct.title || !newProduct.price) {
      toast.error('Preencha título e preço');
      return;
    }

    setUploading(true);

    try {
      let imageUrl = null;

      // Upload image if selected
      if (productImage) {
        const fileExt = productImage.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, productImage);

        if (uploadError) {
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      // Insert product
      const { error } = await supabase
        .from('products')
        .insert({
          creator_id: user.id,
          title: newProduct.title,
          description: newProduct.description,
          price: parseInt(newProduct.price),
          type: newProduct.type,
          badge: newProduct.badge,
          image_url: imageUrl,
          is_active: true
        });

      if (error) throw error;

      toast.success('Produto criado com sucesso!');
      setShowCreateModal(false);
      setNewProduct({ title: '', description: '', price: '', type: 'pack', badge: 'PACK' });
      setProductImage(null);
      setProductImagePreview(null);

      // Refresh products
      const { data } = await supabase
        .from('products')
        .select(`*, creator:profiles!products_creator_id_fkey(username, display_name, avatar_url)`)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (data) setProducts(data);

    } catch (error) {
      console.error('Error creating product:', error);
      toast.error('Erro ao criar produto');
    } finally {
      setUploading(false);
    }
  };

  // Mock gallery images for product detail
  const getProductGallery = (product: Product) => {
    const baseImages = [
      product.image_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800',
    ];
    return baseImages;
  };

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

    // Calculate commission
    const platformCommission = Math.floor(product.price * COMMISSION_RATE);
    const creatorEarnings = Math.floor(product.price * CREATOR_SHARE);

    // Deduct balance
    setBalance(prev => prev - product.price);

    try {
      // Record purchase with commission
      const { error: purchaseError } = await supabase
        .from('purchases')
        .insert({
          buyer_id: user.id,
          product_id: product.id,
          product_title: product.title,
          product_type: product.type,
          product_price: product.price,
          seller_id: null,
          platform_commission: platformCommission,
          creator_earnings: creatorEarnings,
        });

      if (purchaseError) throw purchaseError;

      // Record platform commission
      await supabase.from('platform_commissions').insert({
        source_type: 'product',
        source_id: product.id,
        creator_id: user.id, // Using buyer as placeholder
        buyer_id: user.id,
        gross_amount: product.price,
        commission_amount: platformCommission,
      });

      // Add to creator earnings if there's a seller
      if (product.creator) {
        await supabase.from('creator_earnings').insert({
          creator_id: user.id, // Using buyer as placeholder since we don't have real creator IDs
          source_type: 'product',
          source_id: product.id,
          gross_amount: product.price,
          platform_commission: platformCommission,
          net_amount: creatorEarnings,
        });
      }

      toast.success(`${product.title} comprado com sucesso!`);
    } catch (error) {
      console.error('Error recording purchase:', error);
      // Refund on error
      setBalance(prev => prev + product.price);
      toast.error('Erro ao processar compra');
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
                className="bg-card rounded-2xl overflow-hidden border border-border cursor-pointer active:scale-[0.98] transition-transform"
                onClick={() => { setSelectedProduct(product); setCurrentImageIndex(0); }}
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
                      onClick={(e) => { e.stopPropagation(); handleBuy(product); }}
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

        {/* Product Detail Modal */}
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={() => setSelectedProduct(null)}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <div 
              className="relative w-full max-w-lg max-h-[90vh] bg-card rounded-t-3xl sm:rounded-3xl overflow-hidden animate-slide-up"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button 
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 z-20 w-8 h-8 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center"
              >
                <X className="w-4 h-4 text-white" />
              </button>

              {/* Image Gallery */}
              <div className="relative aspect-[4/5] bg-black">
                <img 
                  src={getProductGallery(selectedProduct)[currentImageIndex]} 
                  alt={selectedProduct.title}
                  className="w-full h-full object-cover"
                />
                
                {/* Gallery navigation */}
                {getProductGallery(selectedProduct).length > 1 && (
                  <>
                    <button 
                      onClick={() => setCurrentImageIndex(prev => prev > 0 ? prev - 1 : getProductGallery(selectedProduct).length - 1)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center"
                    >
                      <ChevronLeft className="w-5 h-5 text-white" />
                    </button>
                    <button 
                      onClick={() => setCurrentImageIndex(prev => prev < getProductGallery(selectedProduct).length - 1 ? prev + 1 : 0)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center"
                    >
                      <ChevronRight className="w-5 h-5 text-white" />
                    </button>
                  </>
                )}

                {/* Image indicators */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {getProductGallery(selectedProduct).map((_, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`w-2 h-2 rounded-full transition-all ${idx === currentImageIndex ? 'bg-white w-4' : 'bg-white/50'}`}
                    />
                  ))}
                </div>

                {/* Badge */}
                {selectedProduct.badge && (
                  <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold ${getBadgeStyle(selectedProduct.badge)}`}>
                    {selectedProduct.badge}
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-4">
                {/* Creator info */}
                <div className="flex items-center gap-2 mb-3">
                  <img 
                    src={selectedProduct.creator?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'} 
                    alt="" 
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-xs font-semibold text-foreground">
                      {selectedProduct.creator?.display_name || selectedProduct.creator?.username || 'Creator'}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      @{selectedProduct.creator?.username || 'usuario'}
                    </p>
                  </div>
                </div>

                {/* Title and description */}
                <h3 className="text-lg font-bold text-foreground mb-1">{selectedProduct.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {selectedProduct.description || 'Conteúdo exclusivo disponível para compra imediata.'}
                </p>

                {/* Actions */}
                <div className="flex items-center gap-3 mb-4">
                  <button className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                    <Heart className="w-5 h-5 text-foreground" />
                  </button>
                  <button className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                    <Share2 className="w-5 h-5 text-foreground" />
                  </button>
                </div>

                {/* Price and Buy */}
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-foreground">{selectedProduct.price}</span>
                    <img src={crisexToken} alt="CRISEX" className="w-5 h-5" />
                  </div>
                  <button 
                    onClick={() => { handleBuy(selectedProduct); setSelectedProduct(null); }}
                    className="flex items-center gap-2 px-6 py-3 gradient-primary rounded-full text-sm font-bold text-white active:scale-95 transition-transform"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    COMPRAR AGORA
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Product Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={() => setShowCreateModal(false)}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <div 
              className="relative w-full max-w-md max-h-[90vh] bg-card rounded-t-3xl sm:rounded-3xl overflow-hidden animate-slide-up"
              onClick={(e) => e.stopPropagation()}
            >
              <ScrollArea className="max-h-[90vh]">
                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-foreground">Criar Produto</h3>
                    <button 
                      onClick={() => setShowCreateModal(false)}
                      className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center"
                    >
                      <X className="w-4 h-4 text-foreground" />
                    </button>
                  </div>

                  {/* Image Upload */}
                  <div className="mb-4">
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full aspect-video bg-secondary rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center overflow-hidden"
                    >
                      {productImagePreview ? (
                        <img src={productImagePreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <Camera className="w-8 h-8 text-muted-foreground mb-2" />
                          <span className="text-sm text-muted-foreground">Adicionar imagem</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Title */}
                  <div className="mb-3">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Título</label>
                    <Input 
                      value={newProduct.title}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Ex: Ensaio Exclusivo"
                      className="bg-secondary border-0"
                    />
                  </div>

                  {/* Description */}
                  <div className="mb-3">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Descrição</label>
                    <Textarea 
                      value={newProduct.description}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descreva seu produto..."
                      className="bg-secondary border-0 min-h-[80px]"
                    />
                  </div>

                  {/* Type */}
                  <div className="mb-3">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Tipo</label>
                    <div className="flex gap-2">
                      {[
                        { value: 'pack', label: 'Pack', badge: 'PACK' },
                        { value: 'video', label: 'Vídeo', badge: 'VIDEO' },
                        { value: 'vip', label: 'VIP', badge: 'VIP' },
                      ].map((type) => (
                        <button
                          key={type.value}
                          onClick={() => setNewProduct(prev => ({ ...prev, type: type.value, badge: type.badge }))}
                          className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                            newProduct.type === type.value 
                              ? 'gradient-primary text-white' 
                              : 'bg-secondary text-muted-foreground'
                          }`}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-5">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Preço (CRISEX)</label>
                    <div className="relative">
                      <Input 
                        type="number"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, price: e.target.value }))}
                        placeholder="0"
                        className="bg-secondary border-0 pr-10"
                      />
                      <img src={crisexToken} alt="CRISEX" className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button 
                    onClick={handleCreateProduct}
                    disabled={uploading || !newProduct.title || !newProduct.price}
                    className="w-full py-3 gradient-primary rounded-xl text-sm font-bold text-white disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Criando...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Publicar Produto
                      </>
                    )}
                  </button>
                </div>
              </ScrollArea>
            </div>
          </div>
        )}

        {/* Floating Create Button */}
        <button 
          onClick={() => setShowCreateModal(true)}
          className="fixed bottom-24 right-4 w-14 h-14 gradient-primary rounded-full flex items-center justify-center shadow-glow z-40 active:scale-95 transition-transform"
        >
          <Plus className="w-6 h-6 text-white" />
        </button>
      </div>
    </ScrollArea>
  );
}
