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
  ProfileHeader,
  ProfileImage,
  ProfileInfo,
  AquaButton,
  Card,
  Grid,
  GlassPanel,
  Tab,
  TabsHeader,
  TabContainer,
  TabContent,
  Divider
} from '../common/StyledComponents';
import RichTextEditor, { RichTextEditorHandle } from '../common/RichTextEditor';

const ProfileActions = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 10px;
`;

const PhotoActions = styled(ProfileActions)`
  margin-top: 15px;
`;

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

const ProfilePhoto = styled.img`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--accent);
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
`;

const RemoveButton = styled(AquaButton)`
  background: #ff6b6b;
  
  &:hover {
    background: #ff5252;
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
  image?: string | null;
  user_id: string;
}

interface UserProfile {
  id: string;
  username: string;
  bio: string;
  avatar_url: string;
  created_at: string;
}

const NewPostForm = styled(GlassPanel)`
  margin-bottom: 30px;
`;

const FormTitle = styled.h3`
  color: var(--primary);
  margin-bottom: 15px;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
`;

const BackgroundOptions = styled.div`
  display: flex;
  gap: 8px;
`;

const BackgroundOption = styled.div<{ bg: string; $selected: boolean }>`
  width: 30px;
  height: 30px;
  border-radius: 5px;
  background: ${props => props.bg};
  cursor: pointer;
  border: ${props => props.$selected ? '2px solid var(--accent)' : '1px solid var(--highlight)'};
  box-shadow: ${props => props.$selected ? '0 0 5px var(--accent)' : 'none'};
  transition: transform 0.2s ease;
  
  &:hover {
    transform: scale(1.1);
  }
`;

const PostContent = styled.div`
  img {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
  }
`;

const PostDate = styled.div`
  font-size: 12px;
  color: #666;
  margin-top: 10px;
`;

const DeleteButton = styled.span`
  position: absolute;
  top: 10px;
  right: 10px;
  width: 24px;
  height: 24px;
  border-radius: 12px;
  background: rgba(255, 90, 90, 0.8);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.3s ease;
  
  &:hover {
    background: rgba(255, 50, 50, 0.9);
  }
`;

const PostCard = styled(Card)`
  position: relative;
  
  &:hover ${DeleteButton} {
    opacity: 1;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 0;
  color: #666;
  
  h3 {
    margin-bottom: 10px;
    color: var(--primary);
  }
`;

const Profile: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedBackground, setSelectedBackground] = useState(CARD_BACKGROUNDS[0]);
  const [activeTab, setActiveTab] = useState('posts');
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [newBio, setNewBio] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCurrentUser, setIsCurrentUser] = useState(true); // Whether viewing own profile
  const editorRef = useRef<RichTextEditorHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { userId } = useParams<{ userId?: string }>();

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

        // Fetch user posts
        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select('*')
          .eq('user_id', profileId)
          .order('created_at', { ascending: false });

        if (postsError) throw postsError;

        setPosts(postsData || []);
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
    if (!user || !editorRef.current) return;

    try {
      const { html, raw } = editorRef.current.getContent();
      const image = editorRef.current.getImage();

      const { data, error } = await supabase
        .from('posts')
        .insert([
          {
            content: html,
            rawContent: raw,
            user_id: user.id,
            background: '#ffffff',
            date: new Date().toISOString(),
            image
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setPosts(prev => [data, ...prev]);
      editorRef.current.getContent(); // Reset editor
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
        <WindowContent>
          <ProfileHeader>
            <div>
              <img src={user.avatar_url || '/default-avatar.png'} alt="Profile" style={{ width: '120px', height: '120px', borderRadius: '50%' }} />
            </div>
            <ProfileInfo>
              <h2>{user.username}</h2>
              {isCurrentUser && isEditingBio ? (
                <div>
                  <textarea
                    value={newBio}
                    onChange={(e) => setNewBio(e.target.value)}
                    rows={3}
                  />
                  <AquaButton onClick={handleSaveBio}>Save</AquaButton>
                </div>
              ) : (
                <div>
                  <p>{user.bio}</p>
                  {isCurrentUser && (
                    <AquaButton onClick={() => setIsEditingBio(true)}>Edit Bio</AquaButton>
                  )}
                </div>
              )}
              {isCurrentUser && (
                <PhotoActions>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    style={{ display: 'none' }}
                    id="photo-upload"
                  />
                  <label htmlFor="photo-upload">
                    <AquaButton as="span">Change Photo</AquaButton>
                  </label>
                  <AquaButton onClick={handleLogout}>Logout</AquaButton>
                </PhotoActions>
              )}
            </ProfileInfo>
          </ProfileHeader>

          <TabsHeader>
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
                    <RichTextEditor ref={editorRef} />
                    <AquaButton onClick={handleAddPost}>Add Post</AquaButton>
                  </GlassPanel>
                )}
                <Grid>
                  {posts.length > 0 ? (
                    posts.map(post => (
                      <Card key={post.id} gradient>
                        <div dangerouslySetInnerHTML={{ __html: post.content }} />
                        {post.image && (
                          <img src={post.image} alt="Post" style={{ maxWidth: '100%', marginTop: '10px' }} />
                        )}
                        <Divider />
                        <div>{new Date(post.date).toLocaleDateString()}</div>
                        {isCurrentUser && (
                          <AquaButton onClick={() => handleDeletePost(post.id)}>
                            Delete
                          </AquaButton>
                        )}
                      </Card>
                    ))
                  ) : (
                    <div>No posts yet</div>
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