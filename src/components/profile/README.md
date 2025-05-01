# Profile Song Feature - Spotify Integration

This feature allows users to add a song to their profile similar to Instagram's music feature. The implementation uses Spotify's Web API to search for songs and play previews directly within the app.

## How It Works

1. Users can click "Add a song to your profile" in their profile section
2. A search modal appears where they can search for songs on Spotify
3. After selecting a song, it appears on their profile with playback controls
4. The song preview can be played directly in the app without opening Spotify

## Setup Requirements

### 1. Spotify Developer Account

You need to register your app with Spotify:

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/)
2. Create a new application
3. Get your Client ID and Client Secret
4. Set your Redirect URI (if using user authentication flows)

### 2. Environment Variables

Add these to your `.env` file:

```
REACT_APP_SPOTIFY_CLIENT_ID=your_spotify_client_id
REACT_APP_SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
```

For production, you should set up a backend proxy to handle the API requests securely.

### 3. Database Updates

The profile table in Supabase needs these additional columns:

```sql
ALTER TABLE profiles 
ADD COLUMN spotify_track_id TEXT,
ADD COLUMN spotify_track_info JSONB;
```

## Implementation Notes

- The feature uses Spotify's "preview_url" which provides a 30-second audio preview
- For a full implementation, you would need to set up a proper backend proxy service
- The current implementation includes a mock layer for demonstration purposes
- For full song playback, you would need to implement Spotify's authorization flows and use their Web Playback SDK

## Resources

- [Spotify Web API Documentation](https://developer.spotify.com/documentation/web-api/)
- [Spotify Authorization Guide](https://developer.spotify.com/documentation/general/guides/authorization-guide/)
- [Spotify Web Playback SDK](https://developer.spotify.com/documentation/web-playback-sdk/) 