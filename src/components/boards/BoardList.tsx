import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { Board } from '../../types/board';
import { getBoards, subscribeToBoard, unsubscribeFromBoard, isUserSubscribed } from '../../utils/boardApi';
import { supabase } from '../../utils/supabaseClient';

const BoardListContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
`;

const BoardCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: translateY(-2px);
  }
`;

const BoardHeader = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: 12px;
`;

const BoardTitle = styled(Link)`
  font-size: 1.4rem;
  font-weight: 600;
  color: #fff;
  text-decoration: none;
  flex: 1;

  &:hover {
    color: #64ffda;
  }
`;

const SubscribeButton = styled.button<{ $isSubscribed: boolean }>`
  background: ${props => props.$isSubscribed ? 'rgba(255, 82, 82, 0.2)' : 'rgba(100, 255, 218, 0.2)'};
  border: 1px solid ${props => props.$isSubscribed ? '#ff5252' : '#64ffda'};
  color: ${props => props.$isSubscribed ? '#ff5252' : '#64ffda'};
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: ${props => props.$isSubscribed ? 'rgba(255, 82, 82, 0.3)' : 'rgba(100, 255, 218, 0.3)'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const BoardDescription = styled.p`
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
  line-height: 1.5;
`;

const BoardMeta = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  margin-top: 12px;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
`;

const CreateBoardButton = styled(Link)`
  display: inline-block;
  background: rgba(100, 255, 218, 0.2);
  border: 1px solid #64ffda;
  color: #64ffda;
  padding: 12px 24px;
  border-radius: 25px;
  text-decoration: none;
  font-weight: 500;
  margin-bottom: 24px;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(100, 255, 218, 0.3);
    transform: translateY(-2px);
  }
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

const BoardList: React.FC = () => {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [subscriptions, setSubscriptions] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUserId(user?.id || null);

        // Fetch boards
        const boardsData = await getBoards();
        setBoards(boardsData);

        // Check subscriptions for authenticated user
        if (user?.id) {
          const subscriptionChecks = await Promise.all(
            boardsData.map(board => isUserSubscribed(board.id, user.id))
          );
          
          const subscribedBoardIds = new Set(
            boardsData
              .filter((_, index) => subscriptionChecks[index])
              .map(board => board.id)
          );
          
          setSubscriptions(subscribedBoardIds);
        }
      } catch (err) {
        console.error('Error fetching boards:', err);
        setError('Failed to load boards');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubscriptionToggle = async (boardId: string, isCurrentlySubscribed: boolean) => {
    if (!currentUserId) return;

    setActionLoading(prev => new Set(prev).add(boardId));

    try {
      if (isCurrentlySubscribed) {
        await unsubscribeFromBoard(boardId);
        setSubscriptions(prev => {
          const newSet = new Set(prev);
          newSet.delete(boardId);
          return newSet;
        });
      } else {
        await subscribeToBoard(boardId);
        setSubscriptions(prev => new Set(prev).add(boardId));
      }
    } catch (err) {
      console.error('Error toggling subscription:', err);
      setError('Failed to update subscription');
    } finally {
      setActionLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(boardId);
        return newSet;
      });
    }
  };

  if (loading) return <LoadingText>Loading boards...</LoadingText>;
  if (error) return <ErrorText>{error}</ErrorText>;

  return (
    <BoardListContainer>
      <CreateBoardButton to="/boards/create">+ Create New Board</CreateBoardButton>
      
      {boards.length === 0 ? (
        <LoadingText>No boards found. Create the first one!</LoadingText>
      ) : (
        boards.map(board => {
          const isSubscribed = subscriptions.has(board.id);
          const isLoading = actionLoading.has(board.id);
          
          return (
            <BoardCard key={board.id}>
              <BoardHeader>
                <BoardTitle to={`/b/${board.slug}`}>
                  {board.name}
                </BoardTitle>
                {currentUserId && (
                  <SubscribeButton
                    $isSubscribed={isSubscribed}
                    onClick={() => handleSubscriptionToggle(board.id, isSubscribed)}
                    disabled={isLoading}
                  >
                    {isLoading ? '...' : isSubscribed ? 'Unsubscribe' : 'Subscribe'}
                  </SubscribeButton>
                )}
              </BoardHeader>
              
              {board.description && (
                <BoardDescription>{board.description}</BoardDescription>
              )}
              
              <BoardMeta>
                <span>Created {new Date(board.created_at).toLocaleDateString()}</span>
              </BoardMeta>
            </BoardCard>
          );
        })
      )}
    </BoardListContainer>
  );
};

export default BoardList; 