import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { supabase } from '../../utils/supabaseClient';
import { uploadImage } from '../../utils/cloudinaryUtils';
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
  
  h2 {
    margin: 0;
  }
`;

const UsernameInput = styled(GlassInput)`
  font-size: 1.5em;
  font-weight: bold;
  width: auto;
  min-width: 150px;
  margin-right: 5px;
`;

const ProfilePhoto = styled.img`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--accent);
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
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
  image?: string | null;
  user_id: string;
  created_at?: string;
}

interface UserProfile {
  id: string;
  username: string;
  bio: string;
  avatar_url: string;
  banner_url?: string;
  created_at: string;
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

const PostCard = styled(Card)`
  position: relative;
  transform: rotate(${props => Math.random() * 6 - 3}deg);
  transition: all 0.3s ease;
  box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.15);
  padding: 20px;
  
  &:hover {
    transform: rotate(0deg) scale(1.05);
    box-shadow: 5px 5px 15px rgba(0, 0, 0, 0.2);
    z-index: 10;
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
  border-radius: 12px;
  padding: 24px;
  margin-top: -30px;
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
  transition: background 0.2s;
  font-size: 16px;
  
  &:hover {
    background: rgba(0, 0, 0, 0.1);
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

const Profile: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedBackground, setSelectedBackground] = useState(CARD_BACKGROUNDS[0]);
  const [activeTab, setActiveTab] = useState('posts');
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newBio, setNewBio] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCurrentUser, setIsCurrentUser] = useState(true); // Whether viewing own profile
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false); // For logout confirmation
  const editorRef = useRef<SimpleEditorHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { userId } = useParams<{ userId?: string }>();

  const defaultAvatar = '/default-avatar.png';

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
        const postsWithBackgrounds = (postsData || []).map((post, index) => ({
          ...post,
          background: post.background || CARD_BACKGROUNDS[index % CARD_BACKGROUNDS.length]
        }));

        setPosts(postsWithBackgrounds);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [navigate, userId]);

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
    if (!user || !newUsername.trim()) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ username: newUsername })
        .eq('id', user.id);

      if (error) throw error;

      setUser(prev => prev ? { ...prev, username: newUsername } : null);
      setIsEditingUsername(false);
    } catch (error) {
      console.error('Error saving username:', error);
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
      const currentDate = new Date().toISOString();

      const { data, error } = await supabase
        .from('posts')
        .insert([
          {
            content: html,
            user_id: user.id
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error adding post:', error);
        throw error;
      }

      // Add the background, image, date, and rawContent locally instead of in the database
      const newPost = {
        ...data,
        background: selectedBackground,
        date: currentDate,
        image: currentImage,
        rawContent: raw
      };

      setPosts(prev => [newPost, ...prev]);
      editorRef.current.reset(); // Reset editor
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
              {isCurrentUser && (
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
            {/* Profile Photo Container (overlaps banner) */}
            <ProfilePhotoContainer>
              {user.avatar_url ? (
                <ProfilePhoto src={user.avatar_url} alt="Profile" />
              ) : (
                <ProfilePhoto src={defaultAvatar} alt="Profile" />
              )}
              
              {/* Photo edit overlay - only shown for current user */}
              {isCurrentUser && (
                <div style={{ 
                  position: 'absolute', 
                  bottom: '0', 
                  right: '0', 
                  background: 'white',
                  borderRadius: '50%',
                  padding: '4px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  cursor: 'pointer'
                }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    style={{ display: 'none' }}
                    ref={fileInputRef}
                  />
                  <IconButton onClick={() => fileInputRef.current?.click()} title="Change photo">
                    ✎
                  </IconButton>
                </div>
              )}
            </ProfilePhotoContainer>

            {/* Profile Info */}
            <div style={{ paddingLeft: '10px' }}>
              {isCurrentUser && isEditingUsername ? (
                <UsernameWrapper>
                  <UsernameInput
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                  />
                  <AquaButton onClick={handleSaveUsername} style={{ height: '34px', padding: '0 12px' }}>
                    Save
                  </AquaButton>
                </UsernameWrapper>
              ) : (
                <UsernameWrapper>
                  <h2>{user.username}</h2>
                  {isCurrentUser && (
                    <IconButton onClick={() => setIsEditingUsername(true)} title="Edit username">
                      ✎
                    </IconButton>
                  )}
                </UsernameWrapper>
              )}
              
              {isCurrentUser && isEditingBio ? (
                <div>
                  <BioTextarea
                    value={newBio}
                    onChange={(e) => setNewBio(e.target.value)}
                    rows={3}
                  />
                  <AquaButton onClick={handleSaveBio}>Save</AquaButton>
                </div>
              ) : (
                <BioText onClick={isCurrentUser ? () => setIsEditingBio(true) : undefined}>
                  {user.bio || 'No bio yet'}
                  {isCurrentUser && (
                    <EditIcon>✎</EditIcon>
                  )}
                </BioText>
              )}
            </div>
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

          <TabContainer>
            {activeTab === 'posts' && (
              <div>
                {isCurrentUser && (
                  <GlassPanel>
                    <h3 style={{ marginBottom: '15px', color: 'var(--primary)' }}>Create a New Post-it Note</h3>
                    <SimpleEditor ref={editorRef} />
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      marginTop: '15px',
                      alignItems: 'center'
                    }}>
                      <div>
                        <small style={{ color: '#666' }}>Express yourself with a colorful note!</small>
                        <BackgroundOptions>
                          {CARD_BACKGROUNDS.map((bg, index) => (
                            <BackgroundOption 
                              key={index}
                              $bg={bg}
                              $selected={selectedBackground === bg}
                              onClick={() => setSelectedBackground(bg)}
                            />
                          ))}
                        </BackgroundOptions>
                      </div>
                      <AquaButton onClick={handleAddPost} style={{ minWidth: '140px' }}>
                        Add Post-it Note
                      </AquaButton>
                    </div>
                  </GlassPanel>
                )}
                <Grid>
                  {posts.length > 0 ? (
                    posts.map((post, index) => (
                      <PostCard key={post.id} $gradient style={{
                        background: post.background || CARD_BACKGROUNDS[index % CARD_BACKGROUNDS.length]
                      }}>
                        <div dangerouslySetInnerHTML={{ __html: post.content }} />
                        {post.image && (
                          <img src={post.image} alt="Post" style={{ maxWidth: '100%', marginTop: '10px', borderRadius: '4px' }} />
                        )}
                        <Divider />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>{new Date(post.created_at || post.date).toLocaleDateString()}</div>
                          {isCurrentUser && (
                            <AquaButton onClick={() => handleDeletePost(post.id)} style={{ height: '32px', padding: '6px 12px' }}>
                              Delete
                            </AquaButton>
                          )}
                        </div>
                      </PostCard>
                    ))
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
        </WindowContent>
      </WindowFrame>
    </WindowContainer>
  );
};

export default Profile; 