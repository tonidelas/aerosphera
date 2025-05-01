import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { supabase } from '../../utils/supabaseClient';
import Post from './Post';
import CreatePost from './CreatePost';

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

interface Post {
  id: string;
  content: string;
  image_url: string | null;
  user_id: string;
  created_at: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
  likes_count: number;
  is_liked: boolean;
}

interface Like {
  user_id: string;
  post_id: string;
  count?: number;
}

const Feed: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    try {
      const user = await supabase.auth.getUser();
      const userId = user.data.user?.id;

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
      const formattedPosts = await Promise.all(postsData.map(async post => {
        // Fetch the profile information for this post
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', post.user_id)
          .single();
          
        if (profileError) {
          console.error('Error fetching profile for post:', profileError);
          return {
            ...post,
            profiles: {
              username: 'Unknown',
              avatar_url: null
            },
            likes_count: 0,
            is_liked: false
          };
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
              .select('*')
              .eq('post_id', post.id)
              .eq('user_id', userId);
              
            if (!likeError && likeData && likeData.length > 0) {
              isLiked = true;
            }
          } catch (error) {
            console.error('Error checking like status:', error);
            // Continue with isLiked as false
          }
        }
        
        return {
          ...post,
          profiles: {
            username: profileData?.username || 'Unknown',
            avatar_url: profileData?.avatar_url
          },
          likes_count: likesCount,
          is_liked: isLiked
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

      const post = posts.find(p => p.id === postId);
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
    <FeedContainer>
      <CreatePost onPostCreated={fetchPosts} />
      
      {posts.length > 0 ? (
        posts.map(post => (
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
          />
        ))
      ) : (
        <EmptyFeed>
          No posts yet. Be the first to share something!
        </EmptyFeed>
      )}
    </FeedContainer>
  );
};

export default Feed; 