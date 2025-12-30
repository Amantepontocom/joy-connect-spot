-- Create discrete mode transactions table
CREATE TABLE public.discrete_mode_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  live_id UUID REFERENCES public.lives(id) ON DELETE SET NULL,
  reel_id UUID REFERENCES public.reels(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL DEFAULT 10,
  creator_share INTEGER NOT NULL,
  platform_share INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.discrete_mode_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own transactions (as payer or receiver)
CREATE POLICY "Users can view their own discrete mode transactions"
ON public.discrete_mode_transactions
FOR SELECT
USING (auth.uid() = user_id OR auth.uid() = creator_id);

-- Users can create their own transactions
CREATE POLICY "Users can create discrete mode transactions"
ON public.discrete_mode_transactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Add index for faster queries
CREATE INDEX idx_discrete_mode_user_id ON public.discrete_mode_transactions(user_id);
CREATE INDEX idx_discrete_mode_creator_id ON public.discrete_mode_transactions(creator_id);
CREATE INDEX idx_discrete_mode_created_at ON public.discrete_mode_transactions(created_at DESC);