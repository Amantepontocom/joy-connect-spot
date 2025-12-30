-- Create reels table
CREATE TABLE public.reels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  video_url TEXT,
  thumbnail_url TEXT NOT NULL,
  description TEXT,
  audio_name TEXT,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reels ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Reels are viewable by everyone"
ON public.reels
FOR SELECT
USING (is_active = true);

CREATE POLICY "Creators can manage their reels"
ON public.reels
FOR ALL
USING (auth.uid() = creator_id);

-- Create reels_likes table for tracking likes
CREATE TABLE public.reels_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reel_id UUID NOT NULL REFERENCES public.reels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(reel_id, user_id)
);

-- Enable RLS
ALTER TABLE public.reels_likes ENABLE ROW LEVEL SECURITY;

-- Policies for likes
CREATE POLICY "Users can view all likes"
ON public.reels_likes
FOR SELECT
USING (true);

CREATE POLICY "Users can like reels"
ON public.reels_likes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike reels"
ON public.reels_likes
FOR DELETE
USING (auth.uid() = user_id);

-- Function to update likes count
CREATE OR REPLACE FUNCTION public.update_reel_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.reels SET likes_count = likes_count + 1 WHERE id = NEW.reel_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.reels SET likes_count = likes_count - 1 WHERE id = OLD.reel_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for likes count
CREATE TRIGGER on_reel_like_change
AFTER INSERT OR DELETE ON public.reels_likes
FOR EACH ROW
EXECUTE FUNCTION public.update_reel_likes_count();

-- Insert sample reels data
INSERT INTO public.reels (creator_id, thumbnail_url, description, audio_name, likes_count, comments_count, views_count)
SELECT 
  id as creator_id,
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800' as thumbnail_url,
  'Sinta a energia da noite... 🌙 Aproveite os novos mimos! #vip #night' as description,
  'ORIGINAL AUDIO' as audio_name,
  14200 as likes_count,
  842 as comments_count,
  1256 as views_count
FROM public.profiles
LIMIT 1;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.reels;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reels_likes;