-- Create storage bucket for reel videos/thumbnails
INSERT INTO storage.buckets (id, name, public)
VALUES ('reel-media', 'reel-media', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for live thumbnails
INSERT INTO storage.buckets (id, name, public)
VALUES ('live-thumbnails', 'live-thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for reel-media bucket
CREATE POLICY "Reel media is publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'reel-media');

CREATE POLICY "Authenticated users can upload reel media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'reel-media' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own reel media"
ON storage.objects FOR UPDATE
USING (bucket_id = 'reel-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own reel media"
ON storage.objects FOR DELETE
USING (bucket_id = 'reel-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- RLS policies for live-thumbnails bucket
CREATE POLICY "Live thumbnails are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'live-thumbnails');

CREATE POLICY "Authenticated users can upload live thumbnails"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'live-thumbnails' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own live thumbnails"
ON storage.objects FOR UPDATE
USING (bucket_id = 'live-thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own live thumbnails"
ON storage.objects FOR DELETE
USING (bucket_id = 'live-thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);