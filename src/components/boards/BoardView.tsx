import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import styled from 'styled-components';
import { Board } from '../../types/board';
import { getBoardBySlug, getBoardPosts, subscribeToBoard, unsubscribeFromBoard, isUserSubscribed } from '../../utils/boardApi';
import { supabase } from '../../utils/supabaseClient';

const BoardContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
`;

const BoardHeader = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 30px;
  margin-bottom: 24px;
`;

const BoardTitleRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
`;

const BoardActions = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const BoardTitle = styled.h1`
  color: #fff;
  margin: 0;
  font-size: 2rem;
  font-weight: 600;
  flex: 1;
`;

const BoardDescription = styled.p`
  color: rgba(255, 255, 255, 0.8);
  margin: 0 0 12px 0;
  line-height: 1.6;
`;

const ActionButton = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 10px 20px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid;

  ${props => props.variant === 'primary' ? `
    background: rgba(100, 255, 218, 0.2);
    border-color: #64ffda;
    color: #64ffda;

    &:hover:not(:disabled) {
      background: rgba(100, 255, 218, 0.3);
    }
  ` : `
    background: rgba(255, 82, 82, 0.2);
    border-color: #ff5252;
    color: #ff5252;

    &:hover:not(:disabled) {
      background: rgba(255, 82, 82, 0.3);
    }
  `}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PostCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
`;

const LoadingText = styled.div`
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
  padding: 40px;
`;

const ErrorText = styled.div`
  text-align: center;
  color: #ff5252;
  padding: 20px;
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
          setError('Board not found');
          return;
        }
        setBoard(boardData);

        // Fetch posts for this board
        const postsData = await getBoardPosts(boardData.id);
        setPosts(postsData);

        // Check subscription status
        if (user?.id) {
          const subscriptionStatus = await isUserSubscribed(boardData.id, user.id);
          setIsSubscribed(subscriptionStatus);
        }
      } catch (err) {
        console.error('Error fetching board data:', err);
        setError('Failed to load board');
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
      } else {
        await subscribeToBoard(board.id);
        setIsSubscribed(true);
      }
    } catch (err) {
      console.error('Error toggling subscription:', err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingText>Loading board...</LoadingText>;
  if (error) return <ErrorText>{error}</ErrorText>;
  if (!board) return <ErrorText>Board not found</ErrorText>;

  return (
    <BoardContainer>
      <BoardHeader>
        <BoardTitleRow>
          <BoardTitle>{board.name}</BoardTitle>
          <BoardActions>
            <ActionButton 
              as={Link} 
              to={`/feed?board=${board.slug}`}
              variant="primary"
            >
              Create Post
            </ActionButton>
            {currentUserId && (
              <ActionButton
                variant={isSubscribed ? 'secondary' : 'primary'}
                onClick={handleSubscriptionToggle}
                disabled={actionLoading}
              >
                {actionLoading ? '...' : isSubscribed ? 'Unsubscribe' : 'Subscribe'}
              </ActionButton>
            )}
          </BoardActions>
        </BoardTitleRow>
        {board.description && (
          <BoardDescription>{board.description}</BoardDescription>
        )}
      </BoardHeader>

      {posts.length === 0 ? (
        <LoadingText>No posts yet.</LoadingText>
      ) : (
        posts.map(post => (
          <PostCard key={post.id}>
            <div>{post.content}</div>
          </PostCard>
        ))
      )}
    </BoardContainer>
  );
};

export default BoardView; 