import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactDOM from 'react-dom'; // Import ReactDOM for createPortal
import styled, { keyframes } from 'styled-components';
import { DeezerTrack, MusicTrack, searchDeezerTracks } from '../../utils/musicClient';
import { uploadImage } from '../../utils/cloudinaryUtils';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../../utils/cropImage';
import { extractYoutubeUrl } from '../../utils/youtubeUtils';
import { useSuppressYouTubeErrors } from '../../utils/errorHandling';
import { supabase } from '../../utils/supabaseClient';
import {
  WindowContainer,
  WindowFrame,
  WindowTitleBar,
  WindowButtons,
  WindowButton,
  WindowTitle,
  WindowContent,
  AquaButton,
  Grid,
  GlassPanel,
  Tab,
  TabsHeader,
  TabContainer,
  GlassInput
} from '../common/StyledComponents';
import SimpleEditor, { SimpleEditorHandle } from '../common/SimpleEditor';
import Post from '../posts/Post'; // Import the Post component from posts directory

const BioTextarea = styled.textarea`
  width: 100%;
  padding: 16px;
  border-radius: 16px;
  border: 1px solid rgba(13, 158, 255, 0.2);
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(10px);
  margin-bottom: 8px;
  font-family: inherit;
  resize: vertical;
  font-size: 1.1em;
  color: #333;
  box-shadow: inset 0 2px 10px rgba(0,0,0,0.05);
  transition: all 0.3s ease;
  
  &:focus {
    background: rgba(255, 255, 255, 0.8);
    border-color: #0D9EFF;
    box-shadow: 0 0 15px rgba(13, 158, 255, 0.2);
    outline: none;
  }
`;

const BioText = styled.p`
  cursor: pointer;
  margin-bottom: 16px;
  padding: 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  line-height: 1.5;
  
  &:hover {
    background: rgba(255, 255, 255, 0.6);
    transform: translateY(-1px);
  }
  
  @media (max-width: 480px) {
    justify-content: center;
    text-align: center;
    padding: 10px;
    font-size: 0.95em;
  }
`;

const EditIcon = styled.span`
  font-size: 14px;
  opacity: 0.7;
`;

const UsernameWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  flex-wrap: wrap;
  
  @media (max-width: 480px) {
    justify-content: center;
  }
  
  h2 {
    margin: 0;
    color: #000;
    font-size: 1.8em;
    font-weight: 700;
  }
`;

const UsernameInput = styled(GlassInput)`
  font-size: 1.8em;
  font-weight: 800;
  width: 100%;
  max-width: 350px;
  text-align: inherit;
  background: rgba(255, 255, 255, 0.5);
  border: 2px solid rgba(13, 158, 255, 0.1);
  border-radius: 12px;
  padding: 8px 16px;
  color: #1a1a1a;
  
  &:focus {
    background: rgba(255, 255, 255, 0.8);
    border-color: #0D9EFF;
    box-shadow: 0 0 15px rgba(13, 158, 255, 0.2);
  }
`;

const ProfilePhoto = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: white;
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover { transform: scale(1.1); }
`;

const ProfilePhotoContainer = styled.div`
  position: relative;
  width: 160px;
  height: 160px;
  margin-top: -85px;
  margin-left: 40px;
  border-radius: 50%;
  border: 8px solid #ffffff;
  box-shadow: 0 15px 45px rgba(0,0,0,0.25);
  z-index: 100; /* Ensure it stays above EVERYTHING, including banner overlays */
  background: white;
  overflow: hidden;
  
  @media (max-width: 768px) { 
    width: 140px; 
    height: 140px;
    margin-top: -70px; 
    margin-left: 30px; 
  }
  
  @media (max-width: 480px) { 
    width: 130px; 
    height: 130px;
    margin-top: -65px; 
    margin-left: auto;
    margin-right: auto;
    margin-bottom: 15px;
  }
`;

const ImageEditOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(13, 158, 255, 0.4);
  backdrop-filter: blur(8px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  opacity: 0;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 50%; /* Force circularity */
  z-index: 15;
  
  &:hover {
    opacity: 1;
  }
  
  span {
    font-size: 28px;
    text-shadow: 0 2px 10px rgba(0,0,0,0.3);
  }
`;

const SimpleImageEditButton = styled.div`
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  color: #1D6BA7;
  padding: 10px 24px;
  border-radius: 30px;
  font-weight: 700;
  font-size: 14px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 #fff;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.5);
  
  &:hover {
    transform: scale(1.05);
    background: white;
    box-shadow: 0 12px 40px rgba(0,0,0,0.3);
  }
`;

const ChangePhotoButton = styled.div`
  position: absolute;
  bottom: 0;
  right: 0;
  background: var(--accent);
  color: white;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: 3px solid white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  z-index: 5;
`;

const CropperModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0,0,0,0.85);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
`;

const CropperContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 500px;
  height: 500px;
  background: #1a1a1a;
  border-radius: 12px;
  overflow: hidden;
`;

const CropperControls = styled.div`
  width: 100%;
  max-width: 500px;
  padding: 24px;
  background: #252525;
  border-radius: 0 0 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const SliderContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  color: white;
  input { flex: 1; accent-color: var(--accent); }
`;

const CARD_BACKGROUNDS = [
  'linear-gradient(135deg, #F5F9FF, #E4EFF7)',
  'linear-gradient(135deg, #F0F7FF, #E0ECF9)',
  'linear-gradient(135deg, #F5FFFA, #E4F9EE)',
  'linear-gradient(135deg, #FFF5F5, #F9E4E4)',
  'linear-gradient(135deg, #F5F0FF, #EEE4F9)',
];

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
`;

const BannerContainer = styled.div<{ $bg: string }>`
  position: relative;
  width: 100%;
  height: 250px;
  background: ${props => props.$bg};
  border-radius: 30px 30px 0 0;
  overflow: hidden;
  box-shadow: inset 0 -60px 100px rgba(0,0,0,0.1);
  z-index: 1; /* Lower than PFP */
  
  @media (max-width: 768px) { height: 200px; }
`;

const BannerImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: filter 0.5s ease;
`;

const BannerActions = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(2px);
  z-index: 10;
`;

const ProfileSectionContainer = styled.div`
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(25px);
  border-radius: 0 0 30px 30px;
  position: relative;
  z-index: 5;
  transition: all 0.4s ease;
  padding-bottom: 30px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  margin-top: -1px;
  width: 100%;
  box-shadow: 0 20px 50px rgba(0,0,0,0.05);
`;

const ProfileHeader = styled.div`
  display: flex;
  align-items: center;
  padding: 30px 40px;
  gap: 50px;
  
  @media (max-width: 768px) {
    gap: 30px;
    padding: 20px 30px;
  }
  
  @media (max-width: 480px) {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 20px;
    padding: 15px;
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
    justify-content: center;
    margin: 8px 0;
  }
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const StatNumber = styled.div` font-weight: bold; `;
const StatLabel = styled.div` color: #666; font-size: 0.9em; `;

const ProfileBio = styled.div` 
  margin-bottom: 20px;
  padding: 0 40px;
  
  @media (max-width: 480px) {
    padding: 0 20px;
  }
`;

const ProfileMusicContainer = styled.div`
  margin-top: 15px;
  margin-bottom: 20px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  border-radius: 16px;
  padding: 18px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.05);
  border: 1px solid rgba(255, 255, 255, 0.4);
  
  @media (max-width: 480px) {
    margin: 15px 15px 20px 15px;
    padding: 15px;
  }
`;

const MusicPlayer = styled.div` display: flex; align-items: center; gap: 15px; `;
const AlbumCover = styled.img` width: 60px; height: 60px; border-radius: 5px; object-fit: cover; `;
const SongInfo = styled.div` flex: 1; min-width: 0; `;
const SongTitle = styled.h4` margin: 0 0 5px 0; `;
const ArtistName = styled.p` margin: 0; font-size: 0.9em; color: #666; `;
const PlayerControls = styled.div` display: flex; align-items: center; gap: 10px; `;

const PlayerButton = styled.button`
  background: white; border: none; width: 36px; height: 36px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; cursor: pointer;
`;



const LogoutButton = styled.button`
  position: absolute; top: 18px; right: 24px; background: rgba(255, 255, 255, 0.7); border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center;
  justify-content: center; cursor: pointer; z-index: 20; color: #ff5f57;
  backdrop-filter: blur(5px);
  transition: all 0.2s ease;
  &:hover { background: white; transform: scale(1.1); box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
`;

const EditToggleContainer = styled.div`
  position: absolute;
  top: 18px;
  right: 72px;
  z-index: 20;
  display: flex;
  gap: 10px;
`;

const MinimalEditButton = styled.button<{ $active?: boolean }>`
  background: ${props => props.$active ? '#0D9EFF' : 'rgba(255, 255, 255, 0.8)'};
  color: ${props => props.$active ? 'white' : '#555'};
  border: 1px solid ${props => props.$active ? '#0D9EFF' : 'rgba(0, 0, 0, 0.05)'};
  border-radius: 18px;
  padding: 6px 16px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  backdrop-filter: blur(8px);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    background: ${props => props.$active ? '#1da1f2' : 'white'};
  }
`;

const IconButton = styled.button`
  background: none; border: none; color: var(--primary); cursor: pointer;
  padding: 4px; display: flex; align-items: center; justify-content: center;
`;

const StyledWindowContainer = styled(WindowContainer)`
  max-width: 900px !important;
  width: 100% !important;
  padding: 0 20px !important;
  margin-top: 40px !important;
  margin-bottom: 40px !important;

  @media (max-width: 768px) {
    padding: 0 10px !important;
    margin-top: 20px !important;
    margin-bottom: 20px !important;
  }
`;

const StyledWindowFrame = styled(WindowFrame)`
  box-shadow: 0 30px 80px rgba(0,0,0,0.25) !important;
  border: 1px solid rgba(255,255,255,0.4) !important;
  width: 100% !important;
`;

const EditPencil = () => <span>✎</span>;

const EmptyPostsMessage = styled.div` text-align: center; padding: 40px; margin-top: 20px; `;

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
  z-index: 2000;
`;

const SearchContent = styled.div`
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
`;

const SearchInput = styled(GlassInput)`
  width: 100%;
`;

const SearchResults = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 20px;
`;

const SongResult = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
`;

function getPastelColorFromId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return `hsl(${Math.abs(hash) % 360}, 70%, 85%)`;
}

const Profile = () => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('posts');
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [newBio, setNewBio] = useState('');
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCurrentUser, setIsCurrentUser] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isUsernameSaving, setIsUsernameSaving] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showPostMusicSearch, setShowPostMusicSearch] = useState(false);
  const [showProfileMusicSearch, setShowProfileMusicSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DeezerTrack[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<DeezerTrack | null>(null);
  const [selectedBackground, setSelectedBackground] = useState(CARD_BACKGROUNDS[0]);
  const [postLikes, setPostLikes] = useState<{[key: string]: boolean}>({});

  // Cropper State
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const editorRef = useRef<SimpleEditorHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const profileAudioRef = useRef<HTMLAudioElement>(null);

  useSuppressYouTubeErrors();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) { navigate('/login'); return; }
        const profileId = userId || authUser.id;
        setIsCurrentUser(!userId || userId === authUser.id);
        
        const { data: profileData, error: profileError } = await supabase.from('profiles').select('*').eq('id', profileId).single();
        if (profileError) { navigate('/search'); return; }
        setUser(profileData);
        setNewBio(profileData?.bio || '');
        setNewUsername(profileData?.username || '');

        const { data: postsData, error: postsError } = await supabase.from('posts').select('*').eq('user_id', profileId).order('created_at', { ascending: false });
        if (postsError) throw postsError;
        
        const fetchedPosts = postsData || [];
        
        // Fetch like status and counts
        const postIds = fetchedPosts.map(p => p.id);
        const likesMap = new Map<string, number>();
        const userLikesSet = new Set<string>();

        if (postIds.length > 0) {
          // 1. Get total like counts
          const { data: countsData } = await supabase.rpc('get_like_counts', { post_ids: postIds });
          if (countsData) {
            countsData.forEach((item: any) => likesMap.set(item.post_id, item.like_count));
          } else {
            // Manual fallback if RPC fails
            const { data: allLikes } = await supabase.from('likes').select('post_id').in('post_id', postIds);
            allLikes?.forEach(l => likesMap.set(l.post_id, (likesMap.get(l.post_id) || 0) + 1));
          }

          // 2. Check if current user liked these posts
          if (authUser) {
            const { data: userLikes } = await supabase.from('likes').select('post_id').eq('user_id', authUser.id).in('post_id', postIds);
            userLikes?.forEach(l => userLikesSet.add(l.post_id));
          }
        }

        const formattedPosts = fetchedPosts.map(p => ({
          ...p,
          likes_count: likesMap.get(p.id) || 0,
          is_liked: userLikesSet.has(p.id)
        }));

        setPosts(formattedPosts);
        
        // Update postLikes map for UI
        const newLikesMap: {[key: string]: boolean} = {};
        formattedPosts.forEach(p => {
          if (p.is_liked) newLikesMap[p.id] = true;
        });
        setPostLikes(newLikesMap);

      } catch (error) { 
        console.error('Error fetching profile data:', error); 
      } finally { 
        setIsLoading(false); 
      }
    };
    fetchUserData();

    // Set up real-time subscriptions
    const postsChannel = supabase.channel('profile_posts_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, fetchUserData)
      .subscribe();
      
    const likesChannel = supabase.channel('profile_likes_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, fetchUserData)
      .subscribe();

    return () => {
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(likesChannel);
    };
  }, [navigate, userId]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleSaveBio = async () => {
    await supabase.from('profiles').update({ bio: newBio }).eq('id', user.id);
    setUser({ ...user, bio: newBio });
    setIsEditingBio(false);
  };

  const handleSaveUsername = async () => {
    setIsUsernameSaving(true);
    const { data } = await supabase.from('profiles').update({ username: newUsername }).eq('id', user.id).select().single();
    setUser(data);
    setIsEditingUsername(false);
    setIsUsernameSaving(false);
  };

  const onCropComplete = (area: any, pixels: any) => setCroppedAreaPixels(pixels);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    setOriginalFile(file);
    const reader = new FileReader();
    reader.onload = () => { setImageToCrop(reader.result as string); setIsCropping(true); };
    reader.readAsDataURL(file);
  };

  const handleApplyCrop = async () => {
    if (!user || !fileInputRef.current) return;
    try {
      setIsUploading(true);
      let fileToUpload: any = originalFile;
      if (originalFile?.type !== 'image/gif' && imageToCrop && croppedAreaPixels) {
        const blob = await getCroppedImg(imageToCrop, croppedAreaPixels);
        if (blob) fileToUpload = blob;
      }
      const url = await uploadImage(fileToUpload);
      const { error } = await supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id);
      if (error) throw error;

      setUser({ ...user, avatar_url: url });
      setIsCropping(false);
      setImageToCrop(null);
      setOriginalFile(null);
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      alert(error.message || 'Error uploading photo. Please try a smaller file.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddPost = async () => {
    if (!editorRef.current || !user) return;
    const { html, raw } = editorRef.current.getContent();
    const { data } = await supabase.from('posts').insert([{ content: html, user_id: user.id, background: selectedBackground }]).select().single();
    setPosts([data, ...posts]);
    editorRef.current.reset();
  };

  const handleDeletePost = async (id: string) => {
    await supabase.from('posts').delete().eq('id', id);
    setPosts(posts.filter(p => p.id !== id));
  };

  const handleLike = async (postId: string) => {
    try {
      if (!user) return;
      const post = posts.find(p => p.id === postId);
      if (!post) return;
      const currentIsLiked = postLikes[postId] ?? post.is_liked ?? false;
      
      const { error } = currentIsLiked 
        ? await supabase.from('likes').delete().match({ post_id: postId, user_id: user.id })
        : await supabase.from('likes').insert([{ post_id: postId, user_id: user.id }]);

      if (error) throw error;

      setPostLikes(prev => ({ ...prev, [postId]: !currentIsLiked }));
      setPosts(prev => prev.map(p => p.id === postId 
        ? { ...p, likes_count: (p.likes_count || 0) + (currentIsLiked ? -1 : 1), is_liked: !currentIsLiked } 
        : p
      ));
    } catch (error) { console.error(error); }
  };

  const handleEditPost = async (postId: string, newContent: string) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, content: newContent } : p));
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files?.length) return;
    try {
      const url = await uploadImage(e.target.files[0]);
      const { error } = await supabase.from('profiles').update({ banner_url: url }).eq('id', user.id);
      if (error) throw error;
      setUser({ ...user, banner_url: url });
    } catch (error: any) {
      console.error('Error uploading banner:', error);
      alert(error.message || 'Error uploading banner. Please try a smaller file.');
    }
  };

  const searchMusic = async (q: string) => {
    if (!q.trim()) return;
    setIsSearching(true);
    try {
      const res = await searchDeezerTracks(q);
      setSearchResults(res);
    } catch (error) { console.error(error); } finally {
      setIsSearching(false);
    }
  };

  const handleSelectTrack = async (track: DeezerTrack) => {
    if (!user) return;
    try {
      await supabase.from('profiles').update({ music_track_id: track.id, music_track_info: track }).eq('id', user.id);
      setUser({ ...user, music_track_id: track.id, music_track_info: track });
      setShowProfileMusicSearch(false);
    } catch (error) { console.error(error); }
  };

  const handleRemoveTrack = async () => {
    if (!user) return;
    try {
      await supabase.from('profiles').update({ music_track_id: null, music_track_info: null }).eq('id', user.id);
      setUser({ ...user, music_track_id: null, music_track_info: null });
    } catch (error) { console.error(error); }
  };

  const renderSearchResults = (onSelect: (track: MusicTrack) => void) => {
    if (isSearching) return <p style={{ textAlign: 'center', color: '#666' }}>Searching...</p>;
    if (searchResults.length === 0 && searchQuery && !isSearching) {
      return <p style={{ textAlign: 'center', color: '#666' }}>No tracks found.</p>;
    }
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

  if (isLoading) return <div>Loading...</div>;
  if (!user) return null;

  return (
    <StyledWindowContainer>
      <StyledWindowFrame>
        <WindowTitleBar>
          <WindowButtons><WindowButton color="#FF5F57" /><WindowButton color="#FFBD2E" /><WindowButton color="#28C840" /></WindowButtons>
          <WindowTitle>Profile</WindowTitle>
        </WindowTitleBar>
        <WindowContent style={{ position: 'relative', background: '#fff' }}>
          {isCurrentUser && (
            <>
              <LogoutButton onClick={() => setShowLogoutConfirm(true)} title="Logout">⏻</LogoutButton>
              <EditToggleContainer>
                <MinimalEditButton 
                  $active={isEditMode} 
                  onClick={() => setIsEditMode(!isEditMode)}
                >
                  {isEditMode ? <><span>✓</span> Done</> : <><span>✎</span> Edit Profile</>}
                </MinimalEditButton>
              </EditToggleContainer>
            </>
          )}

          <BannerContainer $bg={user.banner_url ? 'transparent' : getPastelColorFromId(user.id)}>
            {user.banner_url && <BannerImage src={user.banner_url} />}
            {isCurrentUser && isEditMode && (
              <BannerActions onClick={() => bannerInputRef.current?.click()}>
                <input type="file" accept="image/*" style={{ display: 'none' }} ref={bannerInputRef} onChange={handleBannerUpload} />
                <SimpleImageEditButton>
                  <span>📷</span> Update Banner
                </SimpleImageEditButton>
              </BannerActions>
            )}
          </BannerContainer>

          <ProfileSectionContainer>
            <ProfileHeader>
              <ProfilePhotoContainer>
                <ProfilePhoto src={user.avatar_url || '/default-avatar.png'} />
                {isCurrentUser && isEditMode && (
                  <>
                    <input type="file" accept="image/*,image/gif" style={{ display: 'none' }} ref={fileInputRef} onChange={handlePhotoUpload} />
                    <ImageEditOverlay onClick={() => fileInputRef.current?.click()}>
                      <span>📷</span>
                      Change
                    </ImageEditOverlay>
                  </>
                )}
              </ProfilePhotoContainer>
              <ProfileDetails>
                <UsernameWrapper>
                  {isEditMode ? (
                    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', alignItems: 'inherit' }}>
                      <UsernameInput 
                        value={newUsername} 
                        onChange={e => setNewUsername(e.target.value)}
                        onBlur={handleSaveUsername}
                        placeholder="Enter username..."
                      />
                      <span style={{ fontSize: '11px', color: '#0D9EFF', marginTop: '4px', fontWeight: '600' }}>✓ Auto-saves</span>
                    </div>
                  ) : (
                    <h2>{user.username}</h2>
                  )}
                </UsernameWrapper>
                <ProfileStats><StatItem><StatNumber>{posts.length}</StatNumber><StatLabel>Posts</StatLabel></StatItem></ProfileStats>
              </ProfileDetails>
            </ProfileHeader>

            <ProfileBio>
              {isEditMode ? (
                <div style={{ position: 'relative', width: '100%' }}>
                  <BioTextarea 
                    value={newBio} 
                    onChange={e => setNewBio(e.target.value)} 
                    onBlur={handleSaveBio}
                    placeholder="Tell us about yourself..."
                  />
                  <div style={{ textAlign: 'right', fontSize: '10px', color: '#0D9EFF', fontWeight: '600', marginTop: '2px' }}>✓ Bio saved on blur</div>
                </div>
              ) : (
                <BioText>{user.bio || 'No bio yet'}</BioText>
              )}
            </ProfileBio>

              {/* Profile Music Feature */}
              <ProfileMusicContainer>
                {user.music_track_info ? (
                  <MusicPlayer>
                    <AlbumCover src={user.music_track_info.album.cover || '/default-album.png'} alt="Album Cover" />
                    <SongInfo>
                      <SongTitle>{user.music_track_info.title}</SongTitle>
                      <ArtistName>{user.music_track_info.artist.name}</ArtistName>
                      <div style={{ marginTop: '8px' }}>
                        {user.music_track_info.preview ? (
                          <audio ref={profileAudioRef} controls src={user.music_track_info.preview} style={{ width: '100%', height: '30px', marginTop: '8px' }} />
                        ) : (
                          <small style={{ color: '#ff5555', fontSize: '0.8em' }}>No preview available.</small>
                        )}
                      </div>
                    </SongInfo>
                    <PlayerControls>
                      {isCurrentUser && isEditMode && (
                        <PlayerButton onClick={handleRemoveTrack} title="Remove song">❌</PlayerButton>
                      )}
                    </PlayerControls>
                  </MusicPlayer>
                ) : (
                  <div style={{ textAlign: 'center', padding: '15px 0' }}>
                    {isCurrentUser && isEditMode && (
                      <MinimalEditButton 
                        onClick={() => setShowProfileMusicSearch(true)}
                        style={{ 
                          margin: '0 auto', 
                          padding: '12px 32px', 
                          fontSize: '15px',
                          background: 'rgba(255, 255, 255, 0.9)',
                          boxShadow: '0 8px 25px rgba(13, 158, 255, 0.2)'
                        }}
                      >
                        🎵 Add Profile Song
                      </MinimalEditButton>
                    )}
                  </div>
                )}
              </ProfileMusicContainer>
          </ProfileSectionContainer>

          <TabsHeader style={{ marginTop: '20px' }}>
            <Tab $active={activeTab === 'posts'} onClick={() => setActiveTab('posts')}>Posts</Tab>
            <Tab $active={activeTab === 'about'} onClick={() => setActiveTab('about')}>About</Tab>
          </TabsHeader>

          <TabContainer>
            {activeTab === 'posts' && (
              <div>
                {isCurrentUser && (
                  <GlassPanel>
                    <h3>New Note</h3>
                    <SimpleEditor ref={editorRef} />
                    <AquaButton onClick={handleAddPost} style={{ marginTop: 10 }}>Add Post</AquaButton>
                  </GlassPanel>
                )}
                <Grid>
                  {posts.map(p => (
                    <Post 
                      key={p.id} 
                      id={p.id}
                      content={p.content}
                      image_url={p.image_url}
                      user_id={p.user_id}
                      username={user.username} 
                      avatar_url={user.avatar_url} 
                      currentUserId={user.id}
                      likes_count={p.likes_count ?? 0}
                      is_liked={postLikes[p.id] ?? p.is_liked ?? false}
                      onLike={handleLike}
                      onDelete={() => handleDeletePost(p.id)}
                      created_at={p.created_at}
                      background={p.background}
                      music_track_info={p.music_track_info}
                      youtube_video_url={p.youtube_video_url}
                    />
                  ))}
                </Grid>
              </div>
            )}
            {activeTab === 'about' && (
              <GlassPanel>
                <div style={{ padding: '10px' }}>
                  <h3 style={{ marginBottom: '15px', color: 'var(--primary)', borderBottom: '1px solid var(--highlight)', paddingBottom: '10px' }}>
                    User Information
                  </h3>
                  <div style={{ display: 'grid', gap: '15px' }}>
                    <div>
                      <strong style={{ color: '#666', fontSize: '0.9em' }}>Username</strong>
                      <p style={{ margin: '5px 0', fontSize: '1.2em', fontWeight: 'bold' }}>@{user.username}</p>
                    </div>
                    <div>
                      <strong style={{ color: '#666', fontSize: '0.9em' }}>About Me</strong>
                      <p style={{ margin: '5px 0', lineHeight: '1.6' }}>{user.bio || 'This user is mysterious and hasn\'t shared a bio yet.'}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '40px', marginTop: '10px' }}>
                      <div>
                        <strong style={{ color: '#666', fontSize: '0.9em' }}>Member Since</strong>
                        <p style={{ margin: '5px 0', fontWeight: '500' }}>{new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      </div>
                      <div>
                        <strong style={{ color: '#666', fontSize: '0.9em' }}>Total Posts</strong>
                        <p style={{ margin: '5px 0', fontWeight: '500' }}>{posts.length}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </GlassPanel>
            )}
          </TabContainer>

          {/* Song Search Modal */}
          {showProfileMusicSearch && ReactDOM.createPortal((
            <SearchModal>
              <SearchContent>
                <h3>Add a song to your profile</h3>
                <form onSubmit={(e) => { e.preventDefault(); searchMusic(searchQuery); }} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                  <SearchInput
                    type="text"
                    placeholder="Search music (artist or title)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <AquaButton type="submit" disabled={isSearching}>
                    {isSearching ? '...' : 'Search'}
                  </AquaButton>
                </form>
                <SearchResults>
                  {renderSearchResults(handleSelectTrack)}
                </SearchResults>
                <div style={{ textAlign: 'right', marginTop: '20px' }}>
                  <AquaButton onClick={() => setShowProfileMusicSearch(false)} style={{ background: '#eee', color: '#333' }}>
                    Cancel
                  </AquaButton>
                </div>
              </SearchContent>
            </SearchModal>
          ), document.body)}

          {isCropping && imageToCrop && (
            <CropperModal>
              <h2>Edit Photo</h2>
              <CropperContainer>
                <Cropper image={imageToCrop} crop={crop} zoom={zoom} aspect={1} cropShape="round" onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} />
              </CropperContainer>
              <CropperControls>
                <SliderContainer><span>Zoom</span><input type="range" value={zoom} min={1} max={3} step={0.1} onChange={e => setZoom(Number(e.target.value))} /></SliderContainer>
                <div style={{ display: 'flex', gap: 10 }}>
                  <AquaButton onClick={handleApplyCrop} disabled={isUploading}>{isUploading ? 'Uploading...' : 'Save'}</AquaButton>
                  <AquaButton onClick={() => setIsCropping(false)} style={{ background: '#444' }}>Cancel</AquaButton>
                </div>
              </CropperControls>
            </CropperModal>
          )}
        </WindowContent>
      </StyledWindowFrame>
    </StyledWindowContainer>
  );
};

export default Profile;