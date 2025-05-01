-- Add Spotify-related columns to profiles table
ALTER TABLE profiles 
ADD COLUMN spotify_track_id TEXT,
ADD COLUMN spotify_track_info JSONB; 