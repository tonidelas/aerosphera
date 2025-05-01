import express from 'express';
import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Spotify API constants
const SPOTIFY_API_BASE_URL = 'https://api.spotify.com/v1';
const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/api/token';

// Token cache to avoid requesting a new token on every request
let tokenData = {
  access_token: '',
  expires_at: 0
};

// Create Express router
const router = express.Router();

// Enable CORS
router.use(cors());

/**
 * Get a client credentials token for Spotify API access
 */
async function getSpotifyToken() {
  // Check if the current token is still valid
  if (tokenData.access_token && tokenData.expires_at > Date.now()) {
    return tokenData.access_token;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Spotify API credentials are not configured');
  }

  try {
    // Request a new token
    const response = await axios({
      method: 'post',
      url: SPOTIFY_AUTH_URL,
      params: {
        grant_type: 'client_credentials'
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
      }
    });

    // Update token cache
    tokenData = {
      access_token: response.data.access_token,
      expires_at: Date.now() + (response.data.expires_in * 1000)
    };

    return tokenData.access_token;
  } catch (error) {
    console.error('Failed to get Spotify token:', error);
    throw error;
  }
}

/**
 * Search for tracks endpoint
 */
router.get('/search', async (req, res) => {
  try {
    const query = req.query.q;
    const limit = req.query.limit || 10;
    
    if (!query) {
      return res.status(400).json({ error: 'Missing query parameter' });
    }
    
    const token = await getSpotifyToken();
    
    const response = await axios.get(`${SPOTIFY_API_BASE_URL}/search`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      params: {
        q: query,
        type: 'track',
        limit
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error searching Spotify:', error);
    res.status(500).json({ error: 'Failed to search Spotify' });
  }
});

/**
 * Get track by ID endpoint
 */
router.get('/tracks/:id', async (req, res) => {
  try {
    const trackId = req.params.id;
    
    if (!trackId) {
      return res.status(400).json({ error: 'Missing track ID' });
    }
    
    const token = await getSpotifyToken();
    
    const response = await axios.get(`${SPOTIFY_API_BASE_URL}/tracks/${trackId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error getting track from Spotify:', error);
    res.status(500).json({ error: 'Failed to get track from Spotify' });
  }
});

export default router; 