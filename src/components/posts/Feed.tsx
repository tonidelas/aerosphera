import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { supabase } from '../../utils/supabaseClient';
import Post from './Post';
import CreatePost from './CreatePost';
import { DeezerTrack } from '../../utils/deezerClient';

const FeedContainer = styled.div`
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  
  @media (max-width: 768px) {
    padding: 15px;
  }
  
  @media (max-width: 480px) {
    padding: 10px;
    max-width: 100%;
  }
`;

const LoadingIndicator = styled.div`
  text-align: center;
  padding: 30px;
  color: var(--primary);
  font-weight: bold;
  
  @media (max-width: 480px) {
    padding: 20px;
  }
`;

const EmptyFeed = styled.div`
  text-align: center;
  margin-top: 30px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  
  @media (max-width: 480px) {
    margin-top: 20px;
    padding: 15px;
  }
`;

interface PostData {
  id: string;
  content: string;
  image_url: string | null;
  user_id: string;
  created_at: string;
  background?: string;
  music_track_id?: string;
  music_track_info?: DeezerTrack;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
  likes_count: number;
  is_liked: boolean;
}

const FEED_BG_KEY = 'feedBackgroundImage';

const Feed: React.FC = () => {
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [feedBg, setFeedBg] = useState<string | null>(null);

  useEffect(() => {
    const savedBg = localStorage.getItem(FEED_BG_KEY);
    if (savedBg) setFeedBg(savedBg);
    else setFeedBg(null);
  }, []);

  useEffect(() => {
    if (feedBg) {
      document.body.style.background = `url(${feedBg}) center/cover no-repeat fixed`;
    } else {
      document.body.style.background = 'linear-gradient(to bottom, #BADFFF, #E2E8F0)';
    }
    return () => {
      document.body.style.background = 'linear-gradient(to bottom, #BADFFF, #E2E8F0)';
    };
  }, [feedBg]);

  const fetchPosts = async () => {
    try {
      const user = await supabase.auth.getUser();
      const userId = user.data.user?.id;
      setCurrentUserId(userId || null);

      console.log('Fetching posts...');
      
      // First fetch all profiles to ensure they exist
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');
        
      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      } else {
        console.log('Profiles found:', profiles?.length);
      }

      // Now fetch posts and join with profiles manually
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (postsError) {
        console.error('Error details:', postsError);
        throw postsError;
      }
      
      if (!postsData || postsData.length === 0) {
        setPosts([]);
        setLoading(false);
        return;
      }
      
      // Get user information for each post
      const formattedPosts = await Promise.all(postsData.map(async (post: any) => {
        // Fetch the profile information for this post
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', post.user_id)
          .single();
          
        let profileInfo = {
          username: 'Unknown',
          avatar_url: null
        };
        if (!profileError && profileData) {
          profileInfo = profileData;
        } else if (profileError) {
           console.error('Error fetching profile for post:', post.id, profileError);
        }
        
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
        if (userId) {
          try {
            const { data: likeData, error: likeError } = await supabase
              .from('likes')
              .select('id')
              .eq('post_id', post.id)
              .eq('user_id', userId)
              .limit(1);
              
            if (!likeError && likeData && likeData.length > 0) {
              isLiked = true;
            }
          } catch (error) {
            console.error('Error checking like status:', error);
          }
        }
        
        return {
          ...post,
          profiles: profileInfo,
          likes_count: likesCount,
          is_liked: isLiked,
          music_track_info: typeof post.music_track_info === 'string' ? JSON.parse(post.music_track_info) : post.music_track_info
        };
      }));
      
      setPosts(formattedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleLike = async (postId: string) => {
    try {
      const user = await supabase.auth.getUser();
      const userId = user.data.user?.id;
      if (!userId) throw new Error('Not authenticated');

      const post = posts.find((p: PostData) => p.id === postId);
      if (!post) return;

      if (post.is_liked) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .match({ post_id: postId, user_id: userId });

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('likes')
          .insert([{ post_id: postId, user_id: userId }]);

        if (error) throw error;
      }

      fetchPosts(); // Refresh posts to update like counts
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  if (loading) {
    return <LoadingIndicator>Loading...</LoadingIndicator>;
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        transition: 'background 0.3s',
      }}
    >
      <FeedContainer>
        <CreatePost onPostCreated={fetchPosts} />
        
        {posts.length > 0 ? (
          posts.map((post: PostData) => (
            <Post
              key={post.id}
              id={post.id}
              content={post.content}
              image_url={post.image_url}
              user_id={post.user_id}
              username={post.profiles.username}
              avatar_url={post.profiles.avatar_url}
              likes_count={post.likes_count}
              is_liked={post.is_liked}
              onLike={handleLike}
              currentUserId={currentUserId}
              onDelete={fetchPosts}
              created_at={post.created_at}
              background={post.background}
              music_track_id={post.music_track_id}
              music_track_info={post.music_track_info}
            />
          ))
        ) : (
          <EmptyFeed>
            No posts yet. Be the first to share something!
          </EmptyFeed>
        )}
      </FeedContainer>
    </div>
  );
};

export default Feed; 