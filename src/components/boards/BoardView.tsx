import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import styled from 'styled-components';
import { Board } from '../../types/board';
import { getBoardBySlug, getBoardPosts, subscribeToBoard, unsubscribeFromBoard, isUserSubscribed, getBoardMemberCount } from '../../utils/boardApi';
import { supabase } from '../../utils/supabaseClient';
import Post from '../posts/Post';
import CreatePost from '../posts/CreatePost';

const BoardContainer = styled.div`
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
  padding: 20px;
  min-height: 100vh;
  
  @media (max-width: 768px) {
    padding: 16px;
  }
  
  @media (max-width: 480px) {
    padding: 12px;
  }
`;

const BoardBanner = styled.div<{ $bannerUrl?: string }>`
  height: 240px;
  max-height: 30vh;
  background: ${props => props.$bannerUrl 
    ? `url(${props.$bannerUrl}) center/cover no-repeat`
    : 'linear-gradient(135deg, #52A5D8 0%, #1D6BA7 50%, #0D9EFF 100%)'
  };
  border-radius: 20px;
  position: relative;
  overflow: hidden;
  margin-bottom: -70px;
  display: flex;
  align-items: flex-end;
  padding: 30px;
  box-shadow: 0 8px 32px rgba(29, 107, 167, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.3);
  
  @media (max-width: 768px) {
    height: 200px;
    padding: 24px;
    margin-bottom: -60px;
    border-radius: 16px;
  }
  
  @media (max-width: 480px) {
    height: 160px;
    padding: 16px;
    margin-bottom: -40px;
    border-radius: 12px;
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: transparent;
    pointer-events: none;
  }
`;

const BoardInfo = styled.div`
  background: rgba(245, 245, 247, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 24px;
  padding: 24px;
  margin-bottom: 24px;
  position: relative;
  margin-top: 70px;
  box-shadow: 0 8px 32px rgba(29, 107, 167, 0.15);
  color: var(--text);
  
  @media (max-width: 768px) {
    padding: 20px;
    margin-top: 60px;
    margin-bottom: 20px;
    border-radius: 20px;
  }
  
  @media (max-width: 480px) {
    padding: 16px;
    margin-top: 40px;
    margin-bottom: 16px;
    border-radius: 16px;
  }
`;

const BoardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 24px;
  margin-bottom: 20px;
  
  @media (max-width: 768px) {
    gap: 16px;
    margin-bottom: 16px;
  }
  
  @media (max-width: 480px) {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 12px;
  }
`;

const BoardIcon = styled.div<{ $iconUrl?: string }>`
  width: 100px;
  height: 100px;
  border-radius: 20px;
  background: ${props => props.$iconUrl 
    ? `url(${props.$iconUrl}) center/cover`
    : 'linear-gradient(135deg, #52A5D8 0%, #1D6BA7 50%, #0D9EFF 100%)'
  };
  border: 3px solid rgba(255, 255, 255, 0.8);
  flex-shrink: 0;
  box-shadow: 0 4px 20px rgba(29, 107, 167, 0.3);
  position: relative;
  
  @media (max-width: 768px) {
    width: 80px;
    height: 80px;
    border-radius: 16px;
  }
  
  @media (max-width: 480px) {
    width: 70px;
    height: 70px;
    border-radius: 14px;
  }
`;

const BoardTitleSection = styled.div`
  flex: 1;
  min-width: 0;
  
  @media (max-width: 480px) {
    width: 100%;
  }
`;

const BoardTitle = styled.h1`
  color: var(--text);
  margin: 0 0 8px 0;
  font-size: 2.4rem;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  letter-spacing: -0.02em;
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
  
  @media (max-width: 480px) {
    font-size: 1.8rem;
  }
`;

const BoardSlug = styled.div`
  color: #1D6BA7;
  font-size: 1.1rem;
  margin-bottom: 14px;
  font-family: 'Monaco', 'Menlo', monospace;
  background: rgba(52, 165, 216, 0.1);
  padding: 5px 10px;
  border-radius: 8px;
  display: inline-block;
  border: 1px solid rgba(52, 165, 216, 0.3);
  font-weight: 600;
  
  @media (max-width: 768px) {
    font-size: 1rem;
    padding: 4px 10px;
  }
  
  @media (max-width: 480px) {
    font-size: 0.9rem;
    padding: 4px 8px;
    margin-bottom: 10px;
  }
`;

const BoardStats = styled.div`
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
  
  @media (max-width: 768px) {
    gap: 18px;
    margin-bottom: 14px;
  }
  
  @media (max-width: 480px) {
    gap: 12px;
    justify-content: center;
    margin-bottom: 12px;
  }
`;

const Stat = styled.div`
  text-align: center;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  padding: 14px 18px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.8);
  min-width: 90px;
  box-shadow: 0 2px 10px rgba(29, 107, 167, 0.1);
  
  @media (max-width: 768px) {
    padding: 12px 16px;
    min-width: 80px;
    border-radius: 12px;
  }
  
  @media (max-width: 480px) {
    padding: 10px 12px;
    min-width: 70px;
    border-radius: 10px;
  }
`;

const StatNumber = styled.div`
  color: #1D6BA7;
  font-size: 1.8rem;
  font-weight: 800;
  text-shadow: 0 1px 2px rgba(29, 107, 167, 0.2);
  
  @media (max-width: 768px) {
    font-size: 1.6rem;
  }
  
  @media (max-width: 480px) {
    font-size: 1.4rem;
  }
`;

const StatLabel = styled.div`
  color: #666;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 600;
  margin-top: 4px;
  
  @media (max-width: 768px) {
    font-size: 0.8rem;
    letter-spacing: 0.5px;
  }
  
  @media (max-width: 480px) {
    font-size: 0.75rem;
    letter-spacing: 0.5px;
  }
`;

const BoardDescription = styled.p`
  color: var(--text);
  margin: 0 0 20px 0;
  line-height: 1.6;
  font-size: 1.1rem;
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(10px);
  padding: 18px;
  border-radius: 12px;
  border-left: 4px solid #52A5D8;
  border: 1px solid rgba(255, 255, 255, 0.6);
  
  @media (max-width: 768px) {
    font-size: 1rem;
    padding: 16px;
    margin-bottom: 18px;
  }
  
  @media (max-width: 480px) {
    font-size: 0.95rem;
    padding: 14px;
    margin-bottom: 16px;
    border-radius: 10px;
  }
`;

const BoardActions = styled.div`
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    gap: 12px;
  }
  
  @media (max-width: 480px) {
    flex-direction: column;
    gap: 12px;
  }
`;

const ActionButton = styled.button<{ variant?: 'primary' | 'secondary' | 'success' }>`
  padding: 16px 32px;
  border-radius: 50px;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  position: relative;
  overflow: hidden;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  backdrop-filter: blur(10px);
  min-height: 48px;

  @media (max-width: 768px) {
    padding: 14px 28px;
    font-size: 1rem;
    border-radius: 40px;
  }
  
  @media (max-width: 480px) {
    padding: 16px 24px;
    font-size: 0.95rem;
    width: 100%;
    min-height: 52px;
    border-radius: 26px;
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
    transition: left 0.5s;
  }

  &:hover::before {
    left: 100%;
  }

  ${props => {
    if (props.variant === 'success') {
      return `
        background: rgba(46, 125, 50, 0.2);
        border-color: #2e7d32;
        color: #2e7d32;
        box-shadow: 0 4px 15px rgba(46, 125, 50, 0.2);
        &:hover:not(:disabled) {
          background: rgba(46, 125, 50, 0.3);
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(46, 125, 50, 0.3);
          
          @media (max-width: 480px) {
            transform: translateY(-2px);
          }
        }
      `;
    }
    if (props.variant === 'secondary') {
      return `
        background: rgba(220, 0, 78, 0.2);
        border-color: #dc004e;
        color: #dc004e;
        box-shadow: 0 4px 15px rgba(220, 0, 78, 0.2);
        &:hover:not(:disabled) {
          background: rgba(220, 0, 78, 0.3);
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(220, 0, 78, 0.3);
          
          @media (max-width: 480px) {
            transform: translateY(-2px);
          }
        }
      `;
    }
    return `
      background: rgba(52, 165, 216, 0.2);
      border-color: #52A5D8;
      color: #1D6BA7;
      box-shadow: 0 4px 15px rgba(52, 165, 216, 0.2);
      &:hover:not(:disabled) {
        background: rgba(52, 165, 216, 0.3);
        transform: translateY(-3px);
        box-shadow: 0 8px 25px rgba(52, 165, 216, 0.3);
        
        @media (max-width: 480px) {
          transform: translateY(-2px);
        }
      }
    `;
  }}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none !important;
  }
`;

const ContentSection = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 32px;
  
  @media (max-width: 768px) {
    gap: 24px;
  }
  
  @media (max-width: 480px) {
    gap: 20px;
  }
`;

const PostsSection = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 2px solid rgba(52, 165, 216, 0.4);
  border-radius: 24px;
  padding: 32px;
  box-shadow: 0 12px 40px rgba(29, 107, 167, 0.25);
  position: relative;
  overflow: hidden;
  margin-top: 8px;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 6px;
    background: linear-gradient(90deg, #52A5D8, #1D6BA7, #0D9EFF);
  }
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(52, 165, 216, 0.05) 0%, rgba(29, 107, 167, 0.08) 100%);
    pointer-events: none;
  }
  
  @media (max-width: 768px) {
    padding: 24px;
    border-radius: 20px;
    border-width: 1.5px;
    
    &::before {
      height: 4px;
    }
  }
  
  @media (max-width: 480px) {
    padding: 20px;
    border-radius: 16px;
    border-width: 1px;
    
    &::before {
      height: 4px;
    }
  }
`;

const SectionTitle = styled.h2`
  color: var(--text);
  margin: 0 0 28px 0;
  font-size: 1.8rem;
  font-weight: 700;
  text-align: center;
  position: relative;
  
  @media (max-width: 768px) {
    font-size: 1.6rem;
    margin-bottom: 24px;
  }
  
  @media (max-width: 480px) {
    font-size: 1.4rem;
    margin-bottom: 20px;
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: -8px;
    left: 50%;
    transform: translateX(-50%);
    width: 60px;
    height: 3px;
    background: linear-gradient(90deg, #52A5D8, #1D6BA7);
    border-radius: 2px;
    
    @media (max-width: 480px) {
      width: 40px;
      height: 2px;
    }
  }
`;

const CreatePostSection = styled.div`
  margin-bottom: 32px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(52, 165, 216, 0.3);
  border-radius: 20px;
  padding: 28px;
  position: relative;
  overflow: hidden;
  
  @media (max-width: 768px) {
    padding: 24px;
    margin-bottom: 24px;
    border-radius: 16px;
  }
  
  @media (max-width: 480px) {
    padding: 20px;
    margin-bottom: 20px;
    border-radius: 14px;
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #52A5D8, #1D6BA7);
  }
`;

const LoadingText = styled.div`
  text-align: center;
  color: #666;
  padding: 60px;
  font-size: 1.3rem;
  font-weight: 500;
  
  @media (max-width: 768px) {
    padding: 40px;
    font-size: 1.2rem;
  }
  
  @media (max-width: 480px) {
    padding: 30px;
    font-size: 1.1rem;
  }
`;

const ErrorText = styled.div`
  text-align: center;
  color: #dc004e;
  padding: 60px;
  font-size: 1.3rem;
  font-weight: 500;
  background: rgba(220, 0, 78, 0.1);
  border: 1px solid rgba(220, 0, 78, 0.3);
  border-radius: 16px;
  margin: 40px 0;
  
  @media (max-width: 768px) {
    padding: 40px;
    font-size: 1.2rem;
    margin: 30px 0;
    border-radius: 12px;
  }
  
  @media (max-width: 480px) {
    padding: 30px;
    font-size: 1.1rem;
    margin: 20px 0;
    border-radius: 10px;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  color: #666;
  padding: 80px 20px;
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  border: 2px dashed rgba(52, 165, 216, 0.3);
  
  @media (max-width: 768px) {
    padding: 60px 16px;
    border-radius: 16px;
  }
  
  @media (max-width: 480px) {
    padding: 40px 12px;
    border-radius: 12px;
  }
`;

const EmptyStateIcon = styled.div`
  font-size: 5rem;
  margin-bottom: 20px;
  opacity: 0.6;
  
  @media (max-width: 768px) {
    font-size: 4rem;
    margin-bottom: 16px;
  }
  
  @media (max-width: 480px) {
    font-size: 3rem;
    margin-bottom: 12px;
  }
`;

const EmptyStateText = styled.div`
  font-size: 1.4rem;
  margin-bottom: 12px;
  font-weight: 600;
  color: var(--text);
  
  @media (max-width: 768px) {
    font-size: 1.2rem;
    margin-bottom: 10px;
  }
  
  @media (max-width: 480px) {
    font-size: 1.1rem;
    margin-bottom: 8px;
  }
`;

const EmptyStateSubtext = styled.div`
  font-size: 1rem;
  opacity: 0.7;
  max-width: 400px;
  margin: 0 auto;
  line-height: 1.5;
  color: #666;
  
  @media (max-width: 768px) {
    font-size: 0.95rem;
    max-width: 350px;
  }
  
  @media (max-width: 480px) {
    font-size: 0.9rem;
    max-width: 280px;
  }
`;

const BoardView: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [board, setBoard] = useState<Board | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [memberCount, setMemberCount] = useState(0);
  const [showCreatePost, setShowCreatePost] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!slug) return;

      try {
        setLoading(true);
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUserId(user?.id || null);

        // Fetch board
        const boardData = await getBoardBySlug(slug);
        if (!boardData) {
          setError('Sphera not found');
          return;
        }
        setBoard(boardData);

        // Fetch posts for this board with full post data
        const postsData = await getBoardPosts(boardData.id);
        setPosts(postsData);

        // Get member count
        try {
          const count = await getBoardMemberCount(boardData.id);
          setMemberCount(count);
        } catch (err) {
          console.error('Error fetching member count:', err);
          setMemberCount(0);
        }

        // Check subscription status
        if (user?.id) {
          const subscriptionStatus = await isUserSubscribed(boardData.id, user.id);
          setIsSubscribed(subscriptionStatus);
        }
      } catch (err) {
        console.error('Error fetching board data:', err);
        setError('Failed to load Sphera');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  const handleSubscriptionToggle = async () => {
    if (!currentUserId || !board) return;

    setActionLoading(true);
    try {
      if (isSubscribed) {
        await unsubscribeFromBoard(board.id);
        setIsSubscribed(false);
        setMemberCount(prev => Math.max(0, prev - 1));
      } else {
        await subscribeToBoard(board.id);
        setIsSubscribed(true);
        setMemberCount(prev => prev + 1);
      }
    } catch (err) {
      console.error('Error toggling subscription:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePostCreated = () => {
    setShowCreatePost(false);
    // Refresh posts
    if (board) {
      getBoardPosts(board.id).then(setPosts);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const user = await supabase.auth.getUser();
      const userId = user.data.user?.id;
      if (!userId) throw new Error('Not authenticated');

      const post = posts.find(p => p.id === postId);
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
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('likes')
          .insert([{ post_id: postId, user_id: userId }]);
        if (error) throw error;
      }
    } catch (error) {
      console.error('Error handling like:', error);
    }
  };

  const handleDeletePost = () => {
    // Refresh posts after deletion
    if (board) {
      getBoardPosts(board.id).then(setPosts);
    }
  };

  if (loading) return <LoadingText>Loading Sphera...</LoadingText>;
  if (error) return <ErrorText>{error}</ErrorText>;
  if (!board) return <ErrorText>Sphera not found</ErrorText>;

  return (
    <BoardContainer>
      <BoardBanner $bannerUrl={board.banner_image_url || undefined} />
      
      <BoardInfo>
        <BoardHeader>
          <BoardIcon $iconUrl={board.icon_image_url || undefined} />
          <BoardTitleSection>
            <BoardTitle>{board.name}</BoardTitle>
            <BoardSlug>/b/{board.slug}</BoardSlug>
            <BoardStats>
              <Stat>
                <StatNumber>{posts.length}</StatNumber>
                <StatLabel>Posts</StatLabel>
              </Stat>
              <Stat>
                <StatNumber>{memberCount}</StatNumber>
                <StatLabel>Members</StatLabel>
              </Stat>
            </BoardStats>
          </BoardTitleSection>
        </BoardHeader>
        
        {board.description && (
          <BoardDescription>{board.description}</BoardDescription>
        )}
        
        <BoardActions>
          {currentUserId && (
            <>
              <ActionButton
                variant={isSubscribed ? 'success' : 'primary'}
                onClick={handleSubscriptionToggle}
                disabled={actionLoading}
              >
                {actionLoading ? '...' : isSubscribed ? '✓ Joined' : '+ Join'}
              </ActionButton>
              {isSubscribed && (
                <ActionButton
                  variant="primary"
                  onClick={() => setShowCreatePost(!showCreatePost)}
                >
                  {showCreatePost ? 'Cancel' : '+ Create Post'}
                </ActionButton>
              )}
            </>
          )}
        </BoardActions>
      </BoardInfo>

      <ContentSection>
        <PostsSection>
          {showCreatePost && currentUserId && isSubscribed && (
            <CreatePostSection>
              <SectionTitle>Create a new post</SectionTitle>
              <CreatePost 
                onPostCreated={handlePostCreated}
                defaultBoardId={board.id}
              />
            </CreatePostSection>
          )}
          
          <SectionTitle>Posts</SectionTitle>
          
          {posts.length === 0 ? (
            <EmptyState>
              <EmptyStateIcon>📝</EmptyStateIcon>
              <EmptyStateText>No posts yet in this Sphera</EmptyStateText>
              <EmptyStateSubtext>
                {currentUserId ? 'Be the first to share something!' : 'Join to start posting!'}
              </EmptyStateSubtext>
            </EmptyState>
          ) : (
            posts.map(post => (
              <Post
                key={post.id}
                id={post.id}
                content={post.content}
                image_url={post.image_url}
                username={post.profiles?.username || 'Unknown User'}
                avatar_url={post.profiles?.avatar_url}
                likes_count={post.likes_count || 0}
                is_liked={post.is_liked || false}
                onLike={handleLike}
                user_id={post.user_id}
                currentUserId={currentUserId}
                onDelete={handleDeletePost}
                created_at={post.created_at}
                background={post.background}
                music_track_info={post.music_track_info}
                youtube_video_url={post.youtube_video_url}
              />
            ))
          )}
        </PostsSection>
      </ContentSection>
    </BoardContainer>
  );
};

export default BoardView; 