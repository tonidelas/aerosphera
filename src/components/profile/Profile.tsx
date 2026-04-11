import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactDOM from 'react-dom'; // Import ReactDOM for createPortal
import styled, { css, keyframes } from 'styled-components';
import { ContentBlock } from 'draft-js';
import { supabase } from '../../utils/supabaseClient';
import { uploadImage } from '../../utils/cloudinaryUtils';
import { extractYoutubeUrl } from '../../utils/youtubeUtils';
import { useSuppressYouTubeErrors } from '../../utils/errorHandling';
import {
  WindowContainer,
  WindowFrame,
  WindowTitleBar,
  WindowButtons,
  WindowButton,
  WindowTitle,
  WindowContent,
  AquaButton,
  Card,
  Grid,
  GlassPanel,
  Tab,
  TabsHeader,
  TabContainer,
  Divider,
  GlassInput
} from '../common/StyledComponents';
import SimpleEditor, { SimpleEditorHandle } from '../common/SimpleEditor';
import { searchDeezerTracks, DeezerTrack } from '../../utils/musicClient';
import Post from '../posts/Post'; // Import the Post component from posts directory

const BioTextarea = styled.textarea`
  width: 100%;
  min-height: 100px;
  padding: 8px;
  border-radius: 4px;
  border: 1px solid var(--highlight);
  background: rgba(255, 255, 255, 0.8);
  margin-bottom: 8px;
  font-family: inherit;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: var(--accent);
  }
`;

const BioText = styled.p`
  cursor: pointer;
  margin-bottom: 16px;
  padding: 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.1);
  transition: background 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const EditIcon = styled.span`
  font-size: 14px;
  opacity: 0.7;
  transition: opacity 0.2s ease;
  
  ${BioText}:hover & {
    opacity: 1;
  }
`;

const UsernameWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  flex-wrap: wrap;
  
  h2 {
    margin: 0;
    color: #000;
    font-size: 1.8em;
    word-break: break-word;
  }

  @media (max-width: 480px) {
    h2 {
      font-size: 1.4em;
    }
  }
`;

const UsernameInput = styled(GlassInput)`
  font-size: 1.5em;
  font-weight: bold;
  width: auto;
  min-width: 150px;
  margin-right: 5px;
  
  @media (max-width: 480px) {
    width: 100%;
    min-width: 0;
    margin-right: 0;
    margin-bottom: 8px;
  }
`;

const ProfilePhoto = styled.img`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--accent);
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);

  @media (max-width: 768px) {
    width: 90px;
    height: 90px;
  }

  @media (max-width: 480px) {
    width: 80px;
    height: 80px;
  }
`;

// Aqua-inspired colors
const CARD_BACKGROUNDS = [
  'linear-gradient(135deg, #F5F9FF, #E4EFF7)',
  'linear-gradient(135deg, #F0F7FF, #E0ECF9)',
  'linear-gradient(135deg, #F5FFFA, #E4F9EE)',
  'linear-gradient(135deg, #FFF5F5, #F9E4E4)',
  'linear-gradient(135deg, #F5F0FF, #EEE4F9)',
];

interface Post {
  id: string;
  content: string;
  rawContent?: any;
  background: string;
  date: string;
  image_url?: string | null;
  user_id: string;
  created_at?: string;
  music_track_id?: string;
  music_track_info?: DeezerTrack;
  youtube_video_url?: string | null;
}

interface UserProfile {
  id: string;
  username: string;
  bio: string;
  avatar_url: string;
  banner_url?: string;
  created_at: string;
  music_track_id?: string;
  music_track_info?: DeezerTrack;
}

const BackgroundOptions = styled.div`
  display: flex;
  gap: 8px;
`;

const BackgroundOption = styled.div<{ $bg: string; $selected: boolean }>`
  width: 30px;
  height: 30px;
  border-radius: 5px;
  background: ${props => props.$bg};
  cursor: pointer;
  border: ${props => props.$selected ? '2px solid var(--accent)' : '1px solid var(--highlight)'};
  box-shadow: ${props => props.$selected ? '0 0 5px var(--accent)' : 'none'};
  transition: transform 0.2s ease;
  
  &:hover {
    transform: scale(1.1);
  }
`;

// Define the keyframes for the pulse animation
const pulseAnimation = keyframes`
  0%, 100% {
    transform: scale(1.03) rotate(${Math.random() * 4 - 2}deg);
    box-shadow: 5px 5px 18px rgba(0, 0, 0, 0.25);
  }
  50% {
    transform: scale(1.05) rotate(${Math.random() * 4 - 2}deg);
    box-shadow: 7px 7px 22px rgba(0, 0, 0, 0.3);
  }
`;

const EmptyPostsMessage = styled.div`
  text-align: center;
  padding: 40px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 10px;
  box-shadow: 0 2px 10px var(--shadow);
  margin-top: 20px;
  
  h3 {
    color: var(--primary);
    margin-bottom: 10px;
  }
  
  p {
    color: #666;
  }
`;

// --- Banner Styles ---
const BannerContainer = styled.div<{ $bg: string }>`
  position: relative;
  width: 100%;
  height: 180px;
  background: ${props => props.$bg};
  border-radius: 12px 12px 0 0;
  overflow: hidden;
  margin-bottom: 0;
  display: flex;
  align-items: flex-end;
  justify-content: center;
`;

const BannerImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
`;

const BannerActions = styled.div`
  position: absolute;
  bottom: 10px;
  right: 20px;
  display: flex;
  gap: 8px;
  z-index: 10;
`;

const ProfileSectionContainer = styled.div`
  background: rgba(255, 255, 255, 0.9);
  border-radius: 0 0 12px 12px;
  padding: 0;
  position: relative;
  z-index: 5;
`;

const ProfilePhotoContainer = styled.div`
  position: absolute;
  top: -60px;
  left: 20px;
  border-radius: 50%;
  padding: 4px;
  background: white;
  z-index: 5;
`;

const ProfileInfoContainer = styled.div`
  padding-left: 10px;
  margin-left: 130px; /* Make room for the profile photo */
  padding-top: 5px;
`;

const IconButton = styled.button`
  background: none;
  border: none;
  color: var(--primary);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
  font-size: 14px;
  width: 24px;
  height: 24px;
  
  &:hover {
    background: rgba(0, 0, 0, 0.1);
    transform: scale(1.1);
  }
  
  @media (max-width: 480px) {
    font-size: 12px;
    width: 22px;
    height: 22px;
  }
`;

// Add a new LogoutButton styled component
const LogoutButton = styled.button`
  position: absolute;
  top: 18px;
  right: 24px;
  background: white;
  border: none;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 20;
  transition: background 0.2s;
  font-size: 18px;
  color: var(--primary);
  &:hover {
    background: #f5f5f5;
  }
`;

// Utility to get a random pastel color based on user id
function getPastelColorFromId(id: string): string {
  // Simple hash to get a number from the id
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  // Generate HSL pastel color
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 85%)`;
}

// New styled components for Spotify integration
const ProfileMusicContainer = styled.div`
  margin-top: 15px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 10px;
  padding: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  @media (max-width: 768px) {
    padding: 12px;
    margin-top: 10px;
  }
`;

const MusicPlayer = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  position: relative;
  
  @media (max-width: 480px) {
    gap: 10px;
    flex-wrap: wrap;
  }
`;

const AlbumCover = styled.img`
  width: 60px;
  height: 60px;
  border-radius: 5px;
  object-fit: cover;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  
  @media (max-width: 480px) {
    width: 50px;
    height: 50px;
  }
`;

const SongInfo = styled.div`
  flex: 1;
  min-width: 0; /* Prevent flex item from overflowing */
  
  @media (max-width: 480px) {
    width: calc(100% - 120px); /* Account for album cover + controls */
  }
`;

const SongTitle = styled.h4`
  margin: 0 0 5px 0;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  
  @media (max-width: 480px) {
    font-size: 0.9rem;
  }
`;

const ArtistName = styled.p`
  margin: 0;
  font-size: 0.9em;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  
  @media (max-width: 480px) {
    font-size: 0.8rem;
  }
`;

const PlayerControls = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  
  @media (max-width: 480px) {
    gap: 5px;
  }
`;

const PlayerButton = styled.button`
  background: none;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #333;
  background: rgba(255, 255, 255, 0.8);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 1);
    transform: scale(1.05);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  @media (max-width: 480px) {
    width: 32px;
    height: 32px;
    font-size: 0.9rem;
  }
`;

const AddSongButton = styled(AquaButton)`
  margin-top: 10px;
  font-size: 0.9em;
  padding: 6px 12px;
  height: auto;
  
  @media (max-width: 480px) {
    width: 100%;
    margin-top: 8px;
    font-size: 0.8em;
    padding: 6px 8px;
  }
`;

const SearchModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const SearchContent = styled.div`
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  
  @media (max-width: 480px) {
    width: 95%;
    padding: 16px;
    max-height: 80vh;
  }
`;

const SearchInput = styled(GlassInput)`
  width: 100%;
  margin-bottom: 20px;
  
  @media (max-width: 480px) {
    margin-bottom: 12px;
  }
`;

const SearchResults = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 5px;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 10px;
  }
  
  @media (max-width: 480px) {
    max-height: 50vh;
    gap: 8px;
  }
`;

const SongResult = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s ease;
  
  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
  
  @media (max-width: 480px) {
    padding: 8px;
    gap: 8px;
  }
`;

const ProgressBar = styled.div`
  height: 4px;
  width: 100%;
  background: #e0e0e0;
  border-radius: 2px;
  margin-top: 8px;
  overflow: hidden;
`;

const Progress = styled.div<{ $width: number }>`
  height: 100%;
  width: ${props => props.$width}%;
  background: var(--accent);
  transition: width 0.1s linear;
`;

// New styled components for Instagram-like layout
const ProfileHeader = styled.div`
  display: flex;
  align-items: center;
  padding: 20px;
  gap: 30px;
  
  @media (max-width: 480px) {
    padding: 16px;
    gap: 20px;
  }
`;

const ProfileDetails = styled.div`
  flex: 1;
`;

const ProfileStats = styled.div`
  display: flex;
  gap: 20px;
  margin: 15px 0;
  
  @media (max-width: 480px) {
    gap: 15px;
    margin: 10px 0;
  }
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  
  @media (max-width: 480px) {
    align-items: flex-start;
  }
`;

const StatNumber = styled.div`
  font-weight: bold;
  font-size: 1.1em;
`;

const StatLabel = styled.div`
  color: #666;
  font-size: 0.9em;
`;

const ProfileBio = styled.div`
  margin-bottom: 15px;
  
  @media (max-width: 480px) {
    margin-bottom: 10px;
  }
`;

const VerifiedBadge = styled.span`
  color: #3897f0;
  margin-left: 4px;
  font-size: 1rem;
`;

// Create a new EditPencil component for consistency
const EditPencil = () => (
  <span style={{ 
    fontSize: '14px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.8
  }}>✎</span>
);

const PostMusicContainer = styled.div`
  margin-top: 15px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 8px;
  padding: 12px;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
`;

const AudioPlayerStyled = styled.audio`
  width: 100%;
  height: 35px;
  margin-top: 8px;
  &::-webkit-media-controls-panel {
    background-color: rgba(255, 255, 255, 0.8);
    border-radius: 4px;
  }
  &::-webkit-media-controls-play-button,
  &::-webkit-media-controls-timeline,
  &::-webkit-media-controls-current-time-display,
  &::-webkit-media-controls-time-remaining-display,
  &::-webkit-media-controls-mute-button,
  &::-webkit-media-controls-volume-slider {
    color: #333;
  }
`;

// Styled components for the post menu
const PostMenuButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(255, 255, 255, 0.6);
  border: none;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 16px;
  color: #333;
  transition: background 0.2s;
  z-index: 11; // Ensure it's above hover effects
  
  &:hover {
    background: rgba(255, 255, 255, 0.9);
  }
`;

const PostMenuDropdown = styled.div`
  position: absolute;
  top: 40px; // Position below the button
  right: 10px;
  background: white;
  border-radius: 6px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.15);
  padding: 8px 0;
  z-index: 12;
  min-width: 100px;
`;

const PostMenuItem = styled.button`
  display: block;
  width: 100%;
  background: none;
  border: none;
  padding: 8px 16px;
  text-align: left;
  cursor: pointer;
  font-size: 14px;
  color: #333;
  
  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
  
  &.delete {
    color: #e74c3c;
  }
`;

// Define a custom interface for our extended post type
interface ExtendedPost {
  id: string;
  content: string;
  image_url: string | null;
  user_id: string;
  created_at: string;
  background?: string;
  music_track_id?: string;
  music_track_info?: DeezerTrack;
  likes_count?: number;
  is_liked?: boolean;
  date?: string;
  updated_at?: string;
  youtube_video_url?: string | null;
}

const Profile: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<ExtendedPost[]>([]);
  const [selectedBackground, setSelectedBackground] = useState(CARD_BACKGROUNDS[0]);
  const [activeTab, setActiveTab] = useState('posts');
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newBio, setNewBio] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCurrentUser, setIsCurrentUser] = useState(true); // Whether viewing own profile
  const [isEditMode, setIsEditMode] = useState(false); // Whether edit mode is enabled
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false); // For logout confirmation
  const [isMobileView, setIsMobileView] = useState(false); // For responsive design
  const editorRef = useRef<SimpleEditorHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { userId } = useParams<{ userId?: string }>();
  const [showProfileMusicSearch, setShowProfileMusicSearch] = useState(false);
  const [showPostMusicSearch, setShowPostMusicSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DeezerTrack[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<DeezerTrack | null>(null);
  const [currentlyPlayingPostId, setCurrentlyPlayingPostId] = useState<string | null>(null); // State for playing post
  const [isProfileSongPlaying, setIsProfileSongPlaying] = useState(false); // State for profile song playback
  const [showMenuForPost, setShowMenuForPost] = useState<string | null>(null); // State for post menu visibility
  const [postLikes, setPostLikes] = useState<{[key: string]: boolean}>({});
  const profileAudioRef = useRef<HTMLAudioElement>(null); // Add ref for profile audio
  const [isUsernameSaving, setIsUsernameSaving] = useState(false);

  const defaultAvatar = '/default-avatar.png';

  // Use our custom hook to suppress YouTube errors
  useSuppressYouTubeErrors();

  // Add useEffect for responsive design
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth <= 480);
    };
    
    // Set initial value
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        console.log('Attempting to fetch user data...');
        const userFromLocalStorage = localStorage.getItem('user');
        console.log('User from localStorage:', userFromLocalStorage);
        
        // Get current logged in user
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        console.log('Auth user from Supabase:', authUser, 'Error:', authError);
        
        if (!authUser) {
          console.log('No authenticated user found, redirecting to login');
          navigate('/login');
          return;
        }

        // Determine which user profile to fetch
        const profileId = userId || authUser.id;
        setIsCurrentUser(!userId || userId === authUser.id);
        console.log('Fetching profile for user ID:', profileId);

        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', profileId)
          .single();

        console.log('Profile data:', profileData, 'Error:', profileError);

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          
          // Only create a new profile if viewing own profile
          if (profileError.code === 'PGRST116' && (!userId || userId === authUser.id)) {
            console.log('Profile not found, creating a new one');
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert([
                {
                  id: authUser.id,
                  username: authUser.email?.split('@')[0] || 'user',
                  bio: '',
                  avatar_url: '',
                  created_at: new Date().toISOString()
                }
              ])
              .select()
              .single();
              
            if (createError) {
              console.error('Error creating profile:', createError);
              throw createError;
            }
            
            console.log('New profile created:', newProfile);
            setUser(newProfile);
            setNewBio(newProfile?.bio || '');
            setNewUsername(newProfile?.username || '');
            return;
          } else if (profileError.code === 'PGRST116') {
            // If viewing someone else's profile and it doesn't exist
            navigate('/search');
            return;
          } else {
            throw profileError;
          }
        }

        // Coerce music_track_id to string if it exists and is a number
        if (profileData && typeof profileData.music_track_id === 'number') {
          profileData.music_track_id = String(profileData.music_track_id);
        }
        
        // Always use the data directly from the database for state initialization
        setUser(profileData);
        setNewBio(profileData?.bio || '');
        setNewUsername(profileData?.username || '');

        // Fetch user posts
        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select('*')
          .eq('user_id', profileId)
          .order('created_at', { ascending: false });

        if (postsError) throw postsError;

        // Add backgrounds to posts that don't have them
        const postsWithBackgrounds = await Promise.all((postsData || []).map(async (post, index) => {
          // Get likes count for each post
          const { count, error: countError } = await supabase
            .from('likes')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id);
          
          let likesCount = 0;
          if (!countError && count !== null) {
            likesCount = count;
          }
          
          // Check if current user has liked this post
          let isLiked = false;
          if (authUser) {
            try {
              const { data: likeData, error: likeError } = await supabase
                .from('likes')
                .select('id')
                .eq('post_id', post.id)
                .eq('user_id', authUser.id)
                .limit(1);
                
              if (!likeError && likeData && likeData.length > 0) {
                isLiked = true;
              }
            } catch (error) {
              console.error('Error checking like status:', error);
            }
          }
          
          // Ensure music_track_info is properly typed
          let typedMusicTrackInfo: DeezerTrack | undefined = undefined;
          if (post.music_track_info) {
            typedMusicTrackInfo = post.music_track_info as DeezerTrack;
          }
          
          return {
            ...post,
            background: post.background || CARD_BACKGROUNDS[index % CARD_BACKGROUNDS.length],
            likes_count: likesCount,
            is_liked: isLiked,
            music_track_info: typedMusicTrackInfo,
            youtube_video_url: post.youtube_video_url
          };
        }));

        setPosts(postsWithBackgrounds);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
    
    // Re-fetch whenever userId changes to ensure data is fresh
  }, [navigate, userId]);

  // Debug effect to log user data when loaded
  useEffect(() => {
    if (user) {
      console.log('User data loaded:', { 
        user, 
        username: user.username,
        isCurrentUser,
        isEditingUsername
      });
    }
  }, [user, isCurrentUser, isEditingUsername]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('user');
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleSaveBio = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ bio: newBio })
        .eq('id', user.id);

      if (error) throw error;

      setUser(prev => prev ? { ...prev, bio: newBio } : null);
      setIsEditingBio(false);
    } catch (error) {
      console.error('Error saving bio:', error);
    }
  };

  const handleSaveUsername = async () => {
    if (!user || !newUsername.trim() || isUsernameSaving) return;

    try {
      setIsUsernameSaving(true);
      
      // Store username in a local variable to ensure consistency
      const usernameToSave = newUsername.trim();
      
      const { data, error } = await supabase
        .from('profiles')
        .update({ username: usernameToSave })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      // Update the user in state with the data returned from the database
      // This ensures we're using the value that was actually saved
      setUser(data);
      
      // Also update the local newUsername value to match what's in the database
      setNewUsername(data.username);
      setIsEditingUsername(false);
      
      console.log('Username successfully updated to:', data.username);
    } catch (error) {
      console.error('Error saving username:', error);
      // If there was an error, revert to the original username
      setNewUsername(user.username);
    } finally {
      setIsUsernameSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files?.length) return;

    try {
      const file = e.target.files[0];
      const imageUrl = await uploadImage(file);

      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: imageUrl })
        .eq('id', user.id);

      if (error) throw error;

      setUser(prev => prev ? { ...prev, avatar_url: imageUrl } : null);
    } catch (error) {
      console.error('Error uploading photo:', error);
    }
  };

  const handleAddPost = async () => {
    try {
      if (!editorRef.current || !user) return;
      const { html, raw } = editorRef.current.getContent();
      const currentImage = editorRef.current.getImage();

      // Use same validation logic as in CreatePost.tsx
      // Check for text content in html directly instead of relying on raw.blocks
      const hasTextContent = html && html.trim() !== '' && html !== '<p></p>' && html !== '<p><br></p>';
      
      if (!hasTextContent && !currentImage && !selectedTrack) {
        console.log('Attempted to create an empty post.');
        // Optionally show a user-friendly message here
        return; // Prevent creating empty post
      }

      // Extract YouTube URL from content if it exists
      const detectedYoutubeUrl = extractYoutubeUrl(html);

      const currentDate = new Date().toISOString();
      const { data, error } = await supabase
        .from('posts')
        .insert([
          {
            content: html,
            user_id: user.id,
            image_url: currentImage,
            background: selectedBackground,
            music_track_id: selectedTrack ? selectedTrack.id : null,
            music_track_info: selectedTrack ? selectedTrack : null,
            youtube_video_url: detectedYoutubeUrl // Add detected URL
          }
        ])
        .select()
        .single();
      if (error) {
        console.error('Error adding post:', error);
        throw error;
      }
      const newPost = {
        ...data,
        date: currentDate,
        rawContent: raw
      };
      setPosts(prev => [newPost, ...prev]);
      editorRef.current.reset();
      setSelectedTrack(null);
    } catch (error) {
      console.error('Error adding post:', error);
    }
  };

  const handleDeletePost = async (id: string) => {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPosts(prev => prev.filter(post => post.id !== id));
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  // Add a new function to handle post editing
  const handleEditPost = async (postId: string, newContent: string, newImage: string | null, newYoutubeUrl?: string | null) => {
    try {
      // Update the post in local state immediately for UI responsiveness
      setPosts(prev => prev.map(post => 
        post.id === postId
          ? { ...post, content: newContent, image_url: newImage, youtube_video_url: newYoutubeUrl ?? post.youtube_video_url, updated_at: new Date().toISOString() }
          : post
      ));
    } catch (error) {
      console.error('Error updating post in local state:', error);
    }
  };

  // Add handleLike function similar to Feed.tsx
  const handleLike = async (postId: string) => {
    try {
      if (!user) return;
      
      const post = posts.find(p => p.id === postId);
      if (!post) return;
      
      const isLiked = postLikes[postId] || false;
      
      if (isLiked) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .match({ post_id: postId, user_id: user.id });
          
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('likes')
          .insert([{ post_id: postId, user_id: user.id }]);
          
        if (error) throw error;
      }
      
      // Update local state
      setPostLikes(prev => ({
        ...prev, 
        [postId]: !isLiked
      }));
      
      // Refetch posts to get updated like counts
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      // Fetch user posts with like counts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      // Get likes count for each post
      const formattedPosts = await Promise.all((postsData || []).map(async (post) => {
        // Get likes count
        const { count, error: countError } = await supabase
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id);
          
        let likesCount = 0;
        if (!countError && count !== null) {
          likesCount = count;
        }
        
        // Check if current user has liked this post
        let isLiked = false;
        try {
          const { data: likeData, error: likeError } = await supabase
            .from('likes')
            .select('id')
            .eq('post_id', post.id)
            .eq('user_id', user.id)
            .limit(1);
            
          if (!likeError && likeData && likeData.length > 0) {
            isLiked = true;
          }
        } catch (error) {
          console.error('Error checking like status:', error);
        }
        
        // Handle music track info with proper typing
        const musicTrackInfo = post.music_track_info ? post.music_track_info as DeezerTrack : undefined;
        
        return {
          ...post,
          background: post.background || CARD_BACKGROUNDS[0],
          likes_count: likesCount,
          is_liked: isLiked,
          music_track_info: musicTrackInfo
        };
      }));

      setPosts(formattedPosts);
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  // --- Banner Handlers ---
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files?.length) return;
    try {
      const file = e.target.files[0];
      const bannerUrl = await uploadImage(file);
      console.log('Uploading banner to profile, user ID:', user.id);
      console.log('Banner URL:', bannerUrl);
      
      // Update the profiles table with banner_url field
      const { data, error } = await supabase
        .from('profiles')
        .update({ banner_url: bannerUrl })
        .eq('id', user.id)
        .select();
        
      if (error) {
        console.error('Error uploading banner:', error);
        throw error;
      }
      
      console.log('Banner update successful, response:', data);
      setUser(prev => prev ? { ...prev, banner_url: bannerUrl } : null);
    } catch (error) {
      console.error('Error uploading banner:', error);
    }
  };

  const handleRemoveBanner = async () => {
    if (!user) return;
    try {
      console.log('Removing banner from profile, user ID:', user.id);
      
      const { data, error } = await supabase
        .from('profiles')
        .update({ banner_url: null })
        .eq('id', user.id)
        .select();
        
      if (error) {
        console.error('Error removing banner:', error);
        throw error;
      }
      
      console.log('Banner removal successful, response:', data);
      setUser(prev => prev ? { ...prev, banner_url: '' } : null);
    } catch (error) {
      console.error('Error removing banner:', error);
    }
  };

  const searchMusic = async (query: string) => {
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      const results = await searchDeezerTracks(query);
      setSearchResults(results);
    } catch (error) {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectTrack = async (track: DeezerTrack) => {
    if (!user) return;
    try {
      // Save the selected track to the user's profile
      const { error } = await supabase
        .from('profiles')
        .update({
          music_track_id: track.id,
          music_track_info: track
        })
        .eq('id', user.id);
      if (error) throw error;
      setUser(prev => prev ? {
        ...prev,
        music_track_id: track.id,
        music_track_info: track
      } : null);
      setShowProfileMusicSearch(false);
    } catch (error) {
      console.error('Error saving track to profile:', error);
    }
  };

  const handleRemoveTrack = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          music_track_id: null,
          music_track_info: null
        })
        .eq('id', user.id);
      if (error) throw error;
      setUser(prev => prev ? {
        ...prev,
        music_track_id: undefined,
        music_track_info: undefined
      } : null);
    } catch (error) {
      console.error('Error removing track from profile:', error);
    }
  };

  // Add a refreshTrack function to get a fresh preview URL
  const refreshTrack = async () => {
    if (!user?.music_track_info) return;
    
    setIsSearching(true);
    try {
      // Re-search for the current track to get a fresh preview URL
      const query = `${user.music_track_info.title} ${user.music_track_info.artist.name}`;
      const results = await searchDeezerTracks(query);
      
      if (results.length > 0) {
        // Find a close match to the current track
        const match = results.find(track => 
          track.title.toLowerCase() === user.music_track_info!.title.toLowerCase() &&
          track.artist.name.toLowerCase() === user.music_track_info!.artist.name.toLowerCase()
        ) || results[0]; // Use first result if no exact match
        
        // Update the track in the database
        const { error } = await supabase
          .from('profiles')
          .update({
            music_track_id: match.id,
            music_track_info: match
          })
          .eq('id', user.id);
        
        if (error) throw error;
        
        // Update the UI
        setUser(prev => prev ? {
          ...prev,
          music_track_id: match.id,
          music_track_info: match
        } : null);
        
        console.log('Track refreshed with new data:', match);
      } else {
        console.error('No results found when refreshing track');
      }
    } catch (error) {
      console.error('Error refreshing track:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Modify renderSearchResults to accept an onSelect callback
  const renderSearchResults = (onSelect: (track: DeezerTrack) => void) => {
    if (isSearching) return <p style={{ textAlign: 'center', color: '#666' }}>Searching...</p>;
    if (searchResults.length === 0 && searchQuery && !isSearching) return <p style={{ textAlign: 'center', color: '#666' }}>No tracks found.</p>;
    return searchResults.map(track => (
      <SongResult key={track.id} onClick={() => onSelect(track)}>
        <AlbumCover src={track.album.cover || '/default-album.png'} alt="Album Cover" />
        <SongInfo>
          <SongTitle>{track.title}</SongTitle>
          <ArtistName>{track.artist.name}</ArtistName>
        </SongInfo>
      </SongResult>
    ));
  };

  // Add useEffect to refresh track only if preview is missing initially
  useEffect(() => {
    if (user?.music_track_info && !user.music_track_info.preview) {
      console.log('Track info present but preview missing, refreshing...');
      refreshTrack();
    }
  }, [user?.music_track_info]); // Run when track info changes

  // Add effect to handle global audio play events
  useEffect(() => {
    const handleGlobalAudioPlay = (event: Event) => {
      // Cast event to CustomEvent to access detail
      const customEvent = event as CustomEvent<{ source: string, id?: string }>;
      if (customEvent.detail.source !== 'profile') {
        profileAudioRef.current?.pause();
        setIsProfileSongPlaying(false); // Update state if paused externally
      }
    };

    document.addEventListener('aerofy-audio-play', handleGlobalAudioPlay);

    // Cleanup listener on component unmount
    return () => {
      document.removeEventListener('aerofy-audio-play', handleGlobalAudioPlay);
    };
  }, []); // Empty dependency array ensures this runs only once

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <WindowContainer>
      <WindowFrame>
        <WindowTitleBar>
          <WindowButtons>
            <WindowButton color="#FF5F57" />
            <WindowButton color="#FFBD2E" />
            <WindowButton color="#28C840" />
          </WindowButtons>
          <WindowTitle>Profile</WindowTitle>
        </WindowTitleBar>
        <WindowContent style={{ position: 'relative' }}>
          {isCurrentUser && (
            <>
              <LogoutButton onClick={() => setShowLogoutConfirm(true)} title="Logout">
                <span role="img" aria-label="logout">⏻</span>
              </LogoutButton>
              {/* Add Edit Toggle Button */}
              <div style={{
                position: 'absolute',
                top: '18px',
                right: '72px',
                zIndex: 20
              }}>
                <AquaButton 
                  onClick={() => setIsEditMode(!isEditMode)}
                  style={{ 
                    height: '36px',
                    padding: '0 15px',
                    background: isEditMode ? 'var(--accent)' : 'white',
                    color: isEditMode ? 'white' : 'var(--primary)'
                  }}
                >
                  {isEditMode ? 'View Mode' : 'Edit Profile'}
                </AquaButton>
              </div>
              {showLogoutConfirm && (
                <div style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  width: '100vw',
                  height: '100vh',
                  background: 'rgba(0,0,0,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1000
                }}>
                  <div style={{
                    background: 'white',
                    borderRadius: '10px',
                    padding: '32px 24px',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
                    minWidth: '300px',
                    textAlign: 'center'
                  }}>
                    <h3 style={{ marginBottom: '18px' }}>Are you sure you want to log out?</h3>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
                      <AquaButton onClick={handleLogout} style={{ minWidth: '80px' }}>Yes</AquaButton>
                      <AquaButton onClick={() => setShowLogoutConfirm(false)} style={{ minWidth: '80px', background: '#eee', color: '#333' }}>Cancel</AquaButton>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          {/* --- Profile Banner --- */}
          <div style={{ position: 'relative' }}>
            <BannerContainer $bg={user.banner_url ? 'transparent' : getPastelColorFromId(user.id)}>
              {user.banner_url && (
                <BannerImage
                  src={user.banner_url}
                  alt="Profile Banner"
                />
              )}
              {/* Banner actions */}
              {isCurrentUser && isEditMode && (
                <BannerActions>
                  <input
                    type="file"
                    accept="image/*,image/gif"
                    onChange={handleBannerUpload}
                    style={{ display: 'none' }}
                    ref={bannerInputRef}
                  />
                  <AquaButton 
                    onClick={() => bannerInputRef.current?.click()} 
                    style={{ 
                      height: '32px', 
                      padding: '0 10px', 
                      fontSize: '12px',
                      whiteSpace: 'nowrap',
                      minWidth: 'auto',
                      cursor: 'pointer'
                    }}
                  >
                    {user.banner_url ? 'Change' : 'Add'}
                  </AquaButton>
                  {user.banner_url && (
                    <AquaButton 
                      onClick={handleRemoveBanner} 
                      style={{ 
                        height: '32px', 
                        padding: '0 10px',
                        fontSize: '12px',
                        whiteSpace: 'nowrap',
                        minWidth: 'auto',
                        background: '#ff6b6b',
                        cursor: 'pointer'
                      }}
                    >
                      Remove
                    </AquaButton>
                  )}
                </BannerActions>
              )}
            </BannerContainer>
          </div>

          {/* --- Profile Section --- */}
          <ProfileSectionContainer>
            <ProfileHeader>
              <ProfilePhoto src={user.avatar_url || defaultAvatar} alt="Profile" />
              
              <ProfileDetails>
                <UsernameWrapper>
                  {isCurrentUser && isEditMode && isEditingUsername ? (
                    <>
                      <UsernameInput
                        type="text"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        disabled={isUsernameSaving}
                      />
                      <AquaButton 
                        onClick={handleSaveUsername} 
                        style={{ 
                          height: '34px', 
                          padding: '0 12px',
                          opacity: isUsernameSaving ? 0.7 : 1,
                          cursor: isUsernameSaving ? 'not-allowed' : 'pointer',
                          ...(isMobileView ? {
                            width: '100%',
                            marginTop: '0'
                          } : {})
                        }}
                        disabled={isUsernameSaving}
                      >
                        {isUsernameSaving ? 'Saving...' : 'Save'}
                      </AquaButton>
                    </>
                  ) : (
                    <>
                      <h2>{user.username || 'Unknown User'}</h2>
                      {isCurrentUser && isEditMode && (
                        <IconButton onClick={() => setIsEditingUsername(true)} title="Edit username">
                          <EditPencil />
                        </IconButton>
                      )}
                    </>
                  )}
                </UsernameWrapper>
                
                <ProfileStats>
                  <StatItem>
                    <StatNumber>{posts.length}</StatNumber>
                    <StatLabel>Posts</StatLabel>
                  </StatItem>
                </ProfileStats>
              </ProfileDetails>
            </ProfileHeader>
            
            <div style={{ padding: '0 20px 20px' }}>
              <ProfileBio>
                {isCurrentUser && isEditMode && isEditingBio ? (
                  <div>
                    <BioTextarea
                      value={newBio}
                      onChange={(e) => setNewBio(e.target.value)}
                      rows={3}
                    />
                    <AquaButton onClick={handleSaveBio}>Save</AquaButton>
                  </div>
                ) : (
                  <BioText onClick={isCurrentUser && isEditMode ? () => setIsEditingBio(true) : undefined}>
                    {user.bio || 'No bio yet'}
                    {isCurrentUser && isEditMode && (
                      <EditIcon><EditPencil /></EditIcon>
                    )}
                  </BioText>
                )}
              </ProfileBio>
              
              {/* Deezer Song Profile Feature */}
              <ProfileMusicContainer>
                {user.music_track_info ? (
                  <>
                    <MusicPlayer>
                      <AlbumCover
                        src={user.music_track_info.album.cover || '/default-album.png'}
                        alt="Album Cover"
                      />
                      <SongInfo>
                        <SongTitle>{user.music_track_info.title}</SongTitle>
                        <ArtistName>{user.music_track_info.artist.name}</ArtistName>
                        <div style={{ marginTop: '8px' }}>
                          {user.music_track_info.preview ? (
                            <audio 
                              ref={profileAudioRef}
                              controls 
                              src={user.music_track_info.preview} 
                              style={{ width: '100%', height: '30px', marginTop: '8px' }}
                              onPlay={() => {
                                console.log('Profile audio playing');
                                setIsProfileSongPlaying(true);
                                document.dispatchEvent(new CustomEvent('aerofy-audio-play', { 
                                  detail: { source: 'profile' } 
                                }));
                              }}
                              onPause={() => {
                                console.log('Profile audio paused');
                                setIsProfileSongPlaying(false);
                              }}
                              onEnded={() => {
                                console.log('Profile audio ended');
                                setIsProfileSongPlaying(false);
                              }}
                              onError={(e) => {
                                console.error('Audio playback error:', e);
                                // Automatically refresh when playback fails
                                refreshTrack(); // Call refreshTrack here
                              }}
                             >
                               Your browser does not support the audio element.
                            </audio>
                          ) : (
                            <small style={{ color: '#ff5555', fontSize: '0.8em' }}>
                              No preview available. Loading new track data...
                            </small>
                          )}
                        </div>
                      </SongInfo>
                      <PlayerControls>
                        {isCurrentUser && isEditMode && (
                          <PlayerButton onClick={handleRemoveTrack} title="Remove song">
                            ❌
                          </PlayerButton>
                        )}
                      </PlayerControls>
                    </MusicPlayer>
                  </>
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <p>No song selected for profile</p>
                    {isCurrentUser && isEditMode && (
                      <AddSongButton onClick={() => setShowProfileMusicSearch(true)}>
                        Add a song to your profile
                      </AddSongButton>
                    )}
                  </div>
                )}
              </ProfileMusicContainer>
            </div>

            {/* Profile photo edit button */}
            {isCurrentUser && isEditMode && (
              <div style={{ 
                position: 'absolute', 
                top: '90px',
                left: '90px', 
                background: 'white',
                borderRadius: '50%',
                padding: '2px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                cursor: 'pointer',
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '26px',
                height: '26px'
              }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  style={{ display: 'none' }}
                  ref={fileInputRef}
                />
                <IconButton onClick={() => fileInputRef.current?.click()} title="Change photo" 
                  style={{ padding: 0, width: '20px', height: '20px' }}>
                  <EditPencil />
                </IconButton>
              </div>
            )}
          </ProfileSectionContainer>

          <TabsHeader style={{ marginTop: '20px' }}>
            <Tab
              $active={activeTab === 'posts'}
              onClick={() => setActiveTab('posts')}
            >
              Posts
            </Tab>
            <Tab
              $active={activeTab === 'about'}
              onClick={() => setActiveTab('about')}
            >
              About
            </Tab>
          </TabsHeader>

          {/* Song Search Modal for Posts - Moved to top level */}
          {showPostMusicSearch && ReactDOM.createPortal((
            <SearchModal>
              <SearchContent>
                <h3>Add a song to your post</h3>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                  <SearchInput type="text" placeholder="Search music (artist or title)..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchMusic(searchQuery)} />
                  <AquaButton onClick={() => searchMusic(searchQuery)} disabled={isSearching} style={{ minWidth: '80px' }}>{isSearching ? '...' : 'Search'}</AquaButton>
                </div>
                <SearchResults>{renderSearchResults((track) => { 
                  setSelectedTrack(track); 
                  setShowPostMusicSearch(false); 
                  setSearchQuery(''); 
                  setSearchResults([]); 
                })}</SearchResults>
                <div style={{ textAlign: 'right', marginTop: '20px' }}>
                  <AquaButton onClick={() => { setShowPostMusicSearch(false); setSearchQuery(''); setSearchResults([]); }} style={{ background: '#eee', color: '#333' }}>Cancel</AquaButton>
                </div>
              </SearchContent>
            </SearchModal>
          ), document.body)}

          <TabContainer>
            {activeTab === 'posts' && (
              <div>
                {isCurrentUser && (
                  <GlassPanel>
                    <h3 style={{ marginBottom: '15px', color: 'var(--primary)' }}>Create a New Post-it Note</h3>
                    <SimpleEditor ref={editorRef} />
                    {/* Song preview */}
                    {selectedTrack && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(0,0,0,0.05)', borderRadius: 6, padding: 8, marginTop: 10 }}>
                        <AlbumCover src={selectedTrack.album.cover || '/default-album.png'} alt="Album Cover" />
                        <SongInfo style={{ flexGrow: 1 }}>
                          <SongTitle>{selectedTrack.title}</SongTitle>
                          <ArtistName>{selectedTrack.artist.name}</ArtistName>
                        </SongInfo>
                        <button onClick={() => setSelectedTrack(null)} style={{ background: 'none', border: 'none', color: '#ff4757', cursor: 'pointer', fontSize: '1.2em', padding: 5 }}>❌</button>
                      </div>
                    )}
                    <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                      <div>
                        <small style={{ color: '#666', display: 'block', marginBottom: '5px' }}>Choose background:</small>
                        <BackgroundOptions>
                          {CARD_BACKGROUNDS.map((bg, index) => (
                            <BackgroundOption key={index} $bg={bg} $selected={selectedBackground === bg} onClick={() => setSelectedBackground(bg)} />
                          ))}
                        </BackgroundOptions>
                      </div>
                      <AquaButton type="button" onClick={() => setShowPostMusicSearch(true)} disabled={!!selectedTrack} style={{ padding: '6px 12px', fontSize: '0.9em', height: 'auto', marginTop: '10px' }}>
                        {selectedTrack ? 'Song Added' : 'Add Song Snippet'}
                      </AquaButton>
                      <AquaButton onClick={handleAddPost} style={{ minWidth: '140px' }}>Add Post-it Note</AquaButton>
                    </div>
                  </GlassPanel>
                )}
                <Grid>
                  {posts.length > 0 ? (
                    posts.map((post) => {
                      // Handle music track info with proper typing
                      const musicTrackInfo = post.music_track_info ? post.music_track_info as DeezerTrack : undefined;
                      
                      return (
                        <Post
                          key={post.id}
                          id={post.id}
                          content={post.content}
                          image_url={post.image_url}
                          user_id={post.user_id}
                          username={user?.username || 'Unknown'}
                          avatar_url={user?.avatar_url || null}
                          likes_count={post.likes_count ?? 0}
                          is_liked={post.is_liked ?? false}
                          onLike={handleLike}
                          onEdit={handleEditPost}
                          currentUserId={isCurrentUser ? user?.id : null}
                          onDelete={() => handleDeletePost(post.id)}
                          created_at={post.created_at || (post.date ?? new Date().toISOString())}
                          background={post.background || undefined}
                          music_track_id={post.music_track_id}
                          music_track_info={musicTrackInfo}
                          youtube_video_url={post.youtube_video_url}
                        />
                      );
                    })
                  ) : (
                    <EmptyPostsMessage>
                      <h3>No Post-it Notes Yet</h3>
                      <p>When you add posts, they'll appear here as colorful post-it notes!</p>
                      {isCurrentUser && (
                        <p>Use the editor above to create your first post.</p>
                      )}
                    </EmptyPostsMessage>
                  )}
                </Grid>
              </div>
            )}
            {activeTab === 'about' && (
              <div>
                <GlassPanel>
                  <h3>About {user.username}</h3>
                  <p>Member since {new Date(user.created_at).toLocaleDateString()}</p>
                </GlassPanel>
              </div>
            )}
          </TabContainer>
          
          {/* Song Search Modal */}
          {showProfileMusicSearch && ReactDOM.createPortal((
            <SearchModal>
              <SearchContent>
                <h3>Add a song to your profile</h3>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                  <SearchInput
                    type="text"
                    placeholder="Search music (artist or title)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchMusic(searchQuery)}
                  />
                  <AquaButton
                    onClick={() => searchMusic(searchQuery)}
                    disabled={isSearching}
                    style={{ minWidth: '80px' }}
                  >
                    {isSearching ? 'Searching...' : 'Search'}
                  </AquaButton>
                </div>
                <SearchResults>
                  {renderSearchResults(handleSelectTrack)}
                </SearchResults>
                <div style={{ textAlign: 'right', marginTop: '20px' }}>
                  <AquaButton
                    onClick={() => setShowProfileMusicSearch(false)}
                    style={{ background: '#eee', color: '#333' }}
                  >
                    Cancel
                  </AquaButton>
                </div>
              </SearchContent>
            </SearchModal>
          ), document.body)}
        </WindowContent>
      </WindowFrame>
    </WindowContainer>
  );
};

export default Profile; 