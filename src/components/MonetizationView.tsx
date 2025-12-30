import { useState, useEffect } from 'react';
import { Check, Crown, Zap, Star, TrendingUp, DollarSign, Users, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import crisexToken from '@/assets/crisex-token.png';

interface MonetizationViewProps {
  balance: number;
  setBalance: (updater: (prev: number) => number) => void;
  onClose?: () => void;
}

interface SubscriptionPackage {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  features: string[];
  is_active: boolean;
}

const COMMISSION_RATE = 0.30;
const CREATOR_SHARE = 0.70;

export function MonetizationView({ balance, setBalance, onClose }: MonetizationViewProps) {
  const { user } = useAuth();
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [userSubscriptions, setUserSubscriptions] = useState<string[]>([]);

  useEffect(() => {
    fetchPackages();
    if (user) {
      fetchUserSubscriptions();
    }
  }, [user]);

  const fetchPackages = async () => {
    const { data, error } = await supabase
      .from('subscription_packages')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true });

    if (error) {
      console.error('Error fetching packages:', error);
    } else if (data) {
      setPackages(data.map(pkg => ({
        ...pkg,
        features: Array.isArray(pkg.features) ? pkg.features : JSON.parse(pkg.features as string || '[]')
      })));
    }
    setLoading(false);
  };

  const fetchUserSubscriptions = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('package_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString());

    if (!error && data) {
      setUserSubscriptions(data.map(sub => sub.package_id));
    }
  };

  const handlePurchase = async (pkg: SubscriptionPackage) => {
    if (!user) {
      toast.error('Você precisa estar logado');
      return;
    }

    if (pkg.price > 0 && balance < pkg.price) {
      toast.error('Saldo insuficiente');
      return;
    }

    setPurchasing(pkg.id);

    try {
      // Deduct balance if not free
      if (pkg.price > 0) {
        setBalance(prev => prev - pkg.price);
      }

      // Calculate subscription expiration (30 days)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      // Create subscription
      const { error: subError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: user.id,
          package_id: pkg.id,
          expires_at: expiresAt.toISOString(),
        });

      if (subError) throw subError;

      // Record commission if price > 0
      if (pkg.price > 0) {
        const platformCommission = Math.floor(pkg.price * COMMISSION_RATE);
        
        await supabase.from('platform_commissions').insert({
          source_type: 'subscription',
          source_id: pkg.id,
          creator_id: user.id, // Platform subscription
          buyer_id: user.id,
          gross_amount: pkg.price,
          commission_amount: platformCommission,
        });
      }

      toast.success(`${pkg.name} ativado com sucesso!`);
      setUserSubscriptions(prev => [...prev, pkg.id]);
      
    } catch (error) {
      console.error('Error purchasing subscription:', error);
      // Refund on error
      if (pkg.price > 0) {
        setBalance(prev => prev + pkg.price);
      }
      toast.error('Erro ao processar compra');
    } finally {
      setPurchasing(null);
    }
  };

  const getPackageIcon = (slug: string) => {
    switch (slug) {
      case 'acesso-live': return <Zap className="w-6 h-6" />;
      case 'acesso-criador': return <Crown className="w-6 h-6" />;
      case 'programa-monetizado': return <TrendingUp className="w-6 h-6" />;
      default: return <Star className="w-6 h-6" />;
    }
  };

  const getPackageGradient = (slug: string) => {
    switch (slug) {
      case 'acesso-live': return 'from-blue-500 via-cyan-500 to-blue-600';
      case 'acesso-criador': return 'from-amber-500 via-orange-500 to-amber-600';
      case 'programa-monetizado': return 'from-emerald-500 via-green-500 to-emerald-600';
      default: return 'from-primary via-primary/80 to-primary';
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full bg-background">
      <div className="pb-24">
        {/* Header */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground font-medium tracking-wider">MONETIZAÇÃO</p>
              <h2 className="text-xl font-bold text-foreground">Planos & Pacotes</h2>
            </div>
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1 gradient-primary px-2.5 py-1 rounded-full">
                <img src={crisexToken} alt="CRISEX" className="w-3.5 h-3.5" />
                <span className="text-xs font-bold text-primary-foreground">{balance.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Commission Info Banner */}
        <div className="px-4 py-3">
          <div className="bg-gradient-to-r from-emerald-500/20 via-green-500/10 to-emerald-500/20 border border-emerald-500/30 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                <DollarSign className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground mb-1">Modelo de Monetização</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Criadores recebem <span className="text-emerald-500 font-bold">70%</span> de todos os ganhos. 
                  A plataforma retém <span className="text-muted-foreground font-medium">30%</span> para manutenção e desenvolvimento.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Commission Breakdown */}
        <div className="px-4 py-2">
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-card border border-border rounded-xl p-3 text-center">
              <Package className="w-5 h-5 mx-auto mb-1 text-primary" />
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Packs</p>
              <p className="text-sm font-bold text-foreground">70/30</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-3 text-center">
              <Users className="w-5 h-5 mx-auto mb-1 text-primary" />
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Lives</p>
              <p className="text-sm font-bold text-foreground">70/30</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-3 text-center">
              <Star className="w-5 h-5 mx-auto mb-1 text-primary" />
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Mimos</p>
              <p className="text-sm font-bold text-foreground">70/30</p>
            </div>
          </div>
        </div>

        {/* Section Title */}
        <div className="px-4 pt-4 pb-2">
          <p className="text-[10px] text-muted-foreground font-medium tracking-wider mb-1">PACOTES DISPONÍVEIS</p>
        </div>

        {/* Subscription Packages */}
        <div className="px-4 space-y-3">
          {packages.map((pkg) => {
            const isSubscribed = userSubscriptions.includes(pkg.id);
            const isPurchasing = purchasing === pkg.id;
            const isFree = pkg.price === 0;

            return (
              <div 
                key={pkg.id} 
                className={`relative bg-card border rounded-2xl overflow-hidden transition-all ${
                  isSubscribed ? 'border-emerald-500/50' : 'border-border'
                }`}
              >
                {/* Header Gradient */}
                <div className={`h-2 bg-gradient-to-r ${getPackageGradient(pkg.slug)}`} />
                
                <div className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getPackageGradient(pkg.slug)} flex items-center justify-center text-white`}>
                      {getPackageIcon(pkg.slug)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-foreground">{pkg.name}</h3>
                        {isSubscribed && (
                          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-500 text-[9px] font-bold rounded-full uppercase">
                            Ativo
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {pkg.description}
                      </p>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-2 mb-4">
                    {pkg.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                          isSubscribed ? 'bg-emerald-500/20' : 'bg-primary/10'
                        }`}>
                          <Check className={`w-2.5 h-2.5 ${isSubscribed ? 'text-emerald-500' : 'text-primary'}`} />
                        </div>
                        <span className="text-xs text-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Price & Action */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {isFree ? (
                        <span className="text-lg font-bold text-emerald-500">GRÁTIS</span>
                      ) : (
                        <>
                          <span className="text-xl font-bold text-foreground">{pkg.price.toLocaleString()}</span>
                          <img src={crisexToken} alt="CRISEX" className="w-5 h-5" />
                          <span className="text-xs text-muted-foreground">/mês</span>
                        </>
                      )}
                    </div>

                    <button
                      onClick={() => handlePurchase(pkg)}
                      disabled={isSubscribed || isPurchasing}
                      className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
                        isSubscribed
                          ? 'bg-emerald-500/20 text-emerald-500 cursor-default'
                          : isPurchasing
                          ? 'bg-muted text-muted-foreground cursor-wait'
                          : `bg-gradient-to-r ${getPackageGradient(pkg.slug)} text-white active:scale-95`
                      }`}
                    >
                      {isSubscribed ? 'Ativo' : isPurchasing ? 'Processando...' : isFree ? 'Ativar' : 'Assinar'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Info */}
        <div className="px-4 py-6">
          <div className="bg-secondary/50 rounded-xl p-4 text-center">
            <p className="text-[10px] text-muted-foreground font-medium tracking-wider mb-1">TERMOS DE MONETIZAÇÃO</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Ao se tornar um criador monetizado, você concorda com a divisão de 70% (criador) e 30% (plataforma) 
              em todas as transações, incluindo vendas de packs, conteúdo privado, salas pagas, mimos e lives.
            </p>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
