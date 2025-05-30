-- Create storage bucket for board images
INSERT INTO storage.buckets (id, name, public)
VALUES ('board-images', 'board-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for board images
DROP POLICY IF EXISTS "Anyone can view board images" ON storage.objects;
CREATE POLICY "Anyone can view board images"
ON storage.objects FOR SELECT
USING (bucket_id = 'board-images');

DROP POLICY IF EXISTS "Authenticated users can upload board images" ON storage.objects;
CREATE POLICY "Authenticated users can upload board images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'board-images' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update their own board images" ON storage.objects;
CREATE POLICY "Users can update their own board images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'board-images' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete their own board images" ON storage.objects;
CREATE POLICY "Users can delete their own board images"
ON storage.objects FOR DELETE
USING (bucket_id = 'board-images' AND auth.uid()::text = (storage.foldername(name))[1]); 