-- Create reels_comments table
CREATE TABLE public.reels_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reel_id UUID NOT NULL REFERENCES public.reels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reels_comments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Comments are viewable by everyone"
ON public.reels_comments
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can comment"
ON public.reels_comments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
ON public.reels_comments
FOR DELETE
USING (auth.uid() = user_id);

-- Function to update comments count
CREATE OR REPLACE FUNCTION public.update_reel_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.reels SET comments_count = comments_count + 1 WHERE id = NEW.reel_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.reels SET comments_count = comments_count - 1 WHERE id = OLD.reel_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for comments count
CREATE TRIGGER on_reel_comment_change
AFTER INSERT OR DELETE ON public.reels_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_reel_comments_count();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.reels_comments;