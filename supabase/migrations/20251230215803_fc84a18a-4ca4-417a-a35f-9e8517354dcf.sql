
-- Create subscription packages table
CREATE TABLE public.subscription_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price INTEGER NOT NULL,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user subscriptions table
CREATE TABLE public.user_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  package_id UUID NOT NULL REFERENCES public.subscription_packages(id) ON DELETE CASCADE,
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create creator earnings table
CREATE TABLE public.creator_earnings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL,
  source_type TEXT NOT NULL, -- 'mimo', 'product', 'subscription', 'live', 'private_content'
  source_id UUID,
  gross_amount INTEGER NOT NULL,
  platform_commission INTEGER NOT NULL,
  net_amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'available', 'withdrawn'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create platform commissions log table
CREATE TABLE public.platform_commissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_type TEXT NOT NULL,
  source_id UUID,
  creator_id UUID NOT NULL,
  buyer_id UUID NOT NULL,
  gross_amount INTEGER NOT NULL,
  commission_rate NUMERIC NOT NULL DEFAULT 0.30,
  commission_amount INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add commission columns to purchases
ALTER TABLE public.purchases 
ADD COLUMN platform_commission INTEGER DEFAULT 0,
ADD COLUMN creator_earnings INTEGER DEFAULT 0;

-- Add commission columns to mimos_history
ALTER TABLE public.mimos_history
ADD COLUMN platform_commission INTEGER DEFAULT 0,
ADD COLUMN creator_earnings INTEGER DEFAULT 0;

-- Enable RLS on new tables
ALTER TABLE public.subscription_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_commissions ENABLE ROW LEVEL SECURITY;

-- RLS policies for subscription_packages (public read)
CREATE POLICY "Subscription packages are viewable by everyone"
ON public.subscription_packages FOR SELECT USING (true);

-- RLS policies for user_subscriptions
CREATE POLICY "Users can view their own subscriptions"
ON public.user_subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own subscriptions"
ON public.user_subscriptions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS policies for creator_earnings
CREATE POLICY "Creators can view their own earnings"
ON public.creator_earnings FOR SELECT
USING (auth.uid() = creator_id);

CREATE POLICY "System can insert earnings"
ON public.creator_earnings FOR INSERT
WITH CHECK (true);

-- RLS policies for platform_commissions
CREATE POLICY "Admins and involved users can view commissions"
ON public.platform_commissions FOR SELECT
USING (auth.uid() = creator_id OR auth.uid() = buyer_id);

CREATE POLICY "System can insert commissions"
ON public.platform_commissions FOR INSERT
WITH CHECK (true);

-- Insert default subscription packages
INSERT INTO public.subscription_packages (name, slug, description, price, features) VALUES
(
  'Acesso Live',
  'acesso-live',
  'Acesse todas as transmissões ao vivo sem restrições e interaja com seus criadores favoritos.',
  4990,
  '["Acesso ilimitado a Lives", "Chat prioritário", "Sem anúncios", "Badge exclusivo"]'::jsonb
),
(
  'Acesso Criador',
  'acesso-criador',
  'Desbloqueie conteúdo exclusivo e tenha acesso direto aos criadores premium da plataforma.',
  9990,
  '["Tudo do Acesso Live", "Conteúdo exclusivo", "Mensagens diretas", "Desconto em compras", "Prioridade em eventos"]'::jsonb
),
(
  'Programa Monetizado',
  'programa-monetizado',
  'Torne-se um criador verificado e comece a monetizar seu conteúdo na plataforma.',
  0,
  '["Monetização de conteúdo", "70% dos ganhos líquidos", "Ferramentas de análise", "Suporte prioritário", "Verificação de perfil"]'::jsonb
);

-- Create function to calculate commission
CREATE OR REPLACE FUNCTION public.calculate_commission(gross_amount INTEGER)
RETURNS TABLE(platform_share INTEGER, creator_share INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY SELECT 
    FLOOR(gross_amount * 0.30)::INTEGER as platform_share,
    FLOOR(gross_amount * 0.70)::INTEGER as creator_share;
END;
$$;

-- Create function to process transaction with commission
CREATE OR REPLACE FUNCTION public.process_monetized_transaction(
  p_source_type TEXT,
  p_source_id UUID,
  p_creator_id UUID,
  p_buyer_id UUID,
  p_gross_amount INTEGER
)
RETURNS TABLE(platform_commission INTEGER, creator_earnings INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_platform_share INTEGER;
  v_creator_share INTEGER;
BEGIN
  -- Calculate shares
  v_platform_share := FLOOR(p_gross_amount * 0.30);
  v_creator_share := FLOOR(p_gross_amount * 0.70);
  
  -- Log platform commission
  INSERT INTO public.platform_commissions (
    source_type, source_id, creator_id, buyer_id, 
    gross_amount, commission_amount
  ) VALUES (
    p_source_type, p_source_id, p_creator_id, p_buyer_id,
    p_gross_amount, v_platform_share
  );
  
  -- Add creator earnings
  INSERT INTO public.creator_earnings (
    creator_id, source_type, source_id,
    gross_amount, platform_commission, net_amount
  ) VALUES (
    p_creator_id, p_source_type, p_source_id,
    p_gross_amount, v_platform_share, v_creator_share
  );
  
  RETURN QUERY SELECT v_platform_share, v_creator_share;
END;
$$;
