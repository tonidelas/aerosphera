import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { supabase } from '../../utils/supabaseClient';
import Post from './Post';
import CreatePost from './CreatePost';
import { DeezerTrack } from '../../utils/deezerClient';
import { Session } from '@supabase/supabase-js';
import { useSuppressYouTubeErrors } from '../../utils/errorHandling';
import { useNavigate } from 'react-router-dom';

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
  image_url?: string | null;
  user_id: string;
  created_at: string;
  updated_at?: string;
  background?: string;
  music_track_id?: string;
  music_track_info?: any;
  board_id?: string | null;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
  likes_count: number;
  is_liked: boolean;
  youtube_video_url?: string | null;
  boards: {
    id: string;
    name: string;
    slug: string;
    icon_image_url: string | null;
    description: string | null;
    creator_user_id: string | null;
    created_at: string;
    updated_at: string;
    banner_image_url: string | null;
  } | null;
}

const Feed: React.FC = () => {
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [feedBgUrl, setFeedBgUrl] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const navigate = useNavigate();

  // Use our custom hook to suppress YouTube errors
  useSuppressYouTubeErrors();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) setLoadingProfile(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        setFeedBgUrl(null);
        setLoadingProfile(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user) {
      setFeedBgUrl(null);
      setLoadingProfile(false);
      return;
    }

    const loadProfileBackground = async () => {
      setLoadingProfile(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('feed_background_image_url')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error("Error fetching profile background:", error);
          setFeedBgUrl(null);
        } else {
          setFeedBgUrl(data?.feed_background_image_url || null);
        }
      } catch (err) {
        console.error("Failed to load profile background:", err);
        setFeedBgUrl(null);
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfileBackground();
  }, [session]);

  useEffect(() => {
    const defaultBackground = 'linear-gradient(to bottom, #BADFFF, #E2E8F0)';
    if (feedBgUrl) {
      document.body.style.background = `url(${feedBgUrl}) center/cover no-repeat fixed`;
    } else {
      document.body.style.background = defaultBackground;
    }
    return () => {
      document.body.style.background = defaultBackground;
    };
  }, [feedBgUrl]);

  const fetchPosts = async () => {
    setLoadingPosts(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;
      setCurrentUserId(userId || null);

      console.log('Fetching posts...');
      
      // Get all posts with board information
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          boards (
            id,
            name,
            slug,
            icon_image_url
          )
        `)
        .order('created_at', { ascending: false });

      if (postsError) {
        console.error('Error fetching posts:', postsError);
        throw postsError;
      }
      
      if (!postsData || postsData.length === 0) {
        setPosts([]);
        setLoadingPosts(false);
        return;
      }
      
      // Get unique user IDs from the posts
      const userIds = Array.from(new Set(postsData.map(post => post.user_id)));
      
      // Fetch all profiles for these users in a single query
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', userIds);
        
      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        // Don't throw here, we'll use a fallback for profiles
      }
      
      // Create a map of user_id -> profile data for easy lookup
      const profilesMap = new Map();
      if (profilesData) {
        profilesData.forEach(profile => {
          profilesMap.set(profile.id, profile);
        });
      }
      
      // Get post IDs for likes queries
      const postIds = postsData.map(p => p.id);
      let likesMap = new Map<string, number>();
      let userLikesSet = new Set<string>();

      // Fetch the like counts for all posts
      if (postIds.length > 0) {
        try {
          // First try the RPC method (if it exists)
          const { data: countsData, error: countsError } = await supabase
            .rpc('get_like_counts', { post_ids: postIds });

          if (countsError) {
            // If RPC fails, fallback to counting likes manually for each post
            console.log("RPC get_like_counts failed, falling back to manual counts");
            const { data: likesData, error: likesDataError } = await supabase
              .from('likes')
              .select('post_id')
              .in('post_id', postIds);
              
            if (!likesDataError && likesData) {
              // Count likes for each post
              likesData.forEach(like => {
                const count = likesMap.get(like.post_id) || 0;
                likesMap.set(like.post_id, count + 1);
              });
            } else {
              console.error("Error fetching likes data:", likesDataError);
            }
          } else if (countsData) {
            countsData.forEach((item: { post_id: string, like_count: number }) => 
              likesMap.set(item.post_id, item.like_count));
          }

          // Check which posts the current user has liked
          if (userId) {
            const { data: userLikesData, error: userLikesError } = await supabase
              .from('likes')
              .select('post_id')
              .eq('user_id', userId)
              .in('post_id', postIds);

            if (!userLikesError && userLikesData) {
              userLikesData.forEach(like => userLikesSet.add(like.post_id));
            } else {
              console.error("Error fetching user likes:", userLikesError);
            }
          }
        } catch (err) {
          console.error("Error processing likes:", err);
        }
      }

      // Combine the post data with profile data
      const formattedPosts = postsData.map((post: any) => {
        // Get the profile or use a fallback
        const profile = profilesMap.get(post.user_id) || { 
          username: 'Unknown User', 
          avatar_url: null 
        };

        return {
          ...post,
          profiles: {
            username: profile.username,
            avatar_url: profile.avatar_url
          },
          likes_count: likesMap.get(post.id) || 0,
          is_liked: userLikesSet.has(post.id),
          music_track_info: typeof post.music_track_info === 'string'
            ? JSON.parse(post.music_track_info)
            : post.music_track_info,
          youtube_video_url: post.youtube_video_url,
          boards: post.boards
        };
      });
      
      setPosts(formattedPosts);
    } catch (error) {
      console.error('Error in fetchPosts function:', error);
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    fetchPosts();

    const postSubscription = supabase.channel('public:posts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, fetchPosts)
      .subscribe();

    const likeSubscription = supabase.channel('public:likes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, fetchPosts)
      .subscribe();

    return () => {
      supabase.removeChannel(postSubscription);
      supabase.removeChannel(likeSubscription);
    };
  }, []);

  const handleLike = async (postId: string) => {
    try {
      const user = await supabase.auth.getUser();
      const userId = user.data.user?.id;
      if (!userId) throw new Error('Not authenticated');

      const post = posts.find((p: PostData) => p.id === postId);
      if (!post) return;

      const wasLiked = post.is_liked;
      setPosts(currentPosts => currentPosts.map(p =>
        p.id === postId
          ? { ...p, is_liked: !wasLiked, likes_count: wasLiked ? p.likes_count - 1 : p.likes_count + 1 }
          : p
      ));

      if (wasLiked) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .match({ post_id: postId, user_id: userId });

        if (error) {
          console.error("Error unliking:", error);
          setPosts(currentPosts => currentPosts.map(p =>
            p.id === postId
              ? { ...p, is_liked: wasLiked, likes_count: post.likes_count }
              : p
          ));
          throw error;
        }
      } else {
        const { error } = await supabase
          .from('likes')
          .insert([{ post_id: postId, user_id: userId }]);

        if (error) {
          console.error("Error liking:", error);
          setPosts(currentPosts => currentPosts.map(p =>
            p.id === postId
              ? { ...p, is_liked: wasLiked, likes_count: post.likes_count }
              : p
          ));
          throw error;
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleEditPost = async (postId: string, newContent: string, newImage: string | null) => {
    try {
      // Update the post in local state immediately for UI responsiveness
      setPosts(currentPosts => currentPosts.map(p =>
        p.id === postId
          ? { ...p, content: newContent, image_url: newImage, updated_at: new Date().toISOString() }
          : p
      ));
    } catch (error) {
      console.error('Error updating post in local state:', error);
    }
  };

  const handleProfileClick = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  if (loadingPosts || loadingProfile) {
    return <LoadingIndicator>Loading Feed...</LoadingIndicator>;
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
              image_url={post.image_url || null}
              user_id={post.user_id}
              username={post.profiles.username}
              avatar_url={post.profiles.avatar_url || null}
              likes_count={post.likes_count}
              is_liked={post.is_liked}
              onLike={handleLike}
              onEdit={handleEditPost}
              currentUserId={currentUserId}
              onDelete={fetchPosts}
              created_at={post.created_at}
              background={post.background}
              music_track_id={post.music_track_id}
              music_track_info={post.music_track_info}
              youtube_video_url={post.youtube_video_url}
              onProfileClick={handleProfileClick}
              board={post.boards}
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