-- Create storage bucket for board images
INSERT INTO storage.buckets (id, name, public)
VALUES ('board-images', 'board-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for board images
CREATE POLICY "Anyone can view board images"
ON storage.objects FOR SELECT
USING (bucket_id = 'board-images');

CREATE POLICY "Authenticated users can upload board images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'board-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own board images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'board-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own board images"
ON storage.objects FOR DELETE
USING (bucket_id = 'board-images' AND auth.uid()::text = (storage.foldername(name))[1]); 