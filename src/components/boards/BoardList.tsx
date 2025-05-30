import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { Board } from '../../types/board';
import { getBoards, subscribeToBoard, unsubscribeFromBoard, isUserSubscribed } from '../../utils/boardApi';
import { supabase } from '../../utils/supabaseClient';

const BoardListContainer = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 32px 20px;
  
  @media (max-width: 768px) {
    padding: 24px 16px;
  }
  
  @media (max-width: 480px) {
    padding: 20px 12px;
  }
`;

const PageHeader = styled.div`
  text-align: center;
  margin-bottom: 48px;
  
  @media (max-width: 768px) {
    margin-bottom: 40px;
  }
  
  @media (max-width: 480px) {
    margin-bottom: 32px;
  }
`;

const PageTitle = styled.h1`
  color: var(--text);
  font-size: 3.5rem;
  font-weight: 700;
  margin: 0 0 16px 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  
  @media (max-width: 768px) {
    font-size: 2.8rem;
    margin-bottom: 12px;
  }
  
  @media (max-width: 480px) {
    font-size: 2.2rem;
    margin-bottom: 10px;
  }
`;

const PageSubtitle = styled.p`
  color: #666;
  font-size: 1.2rem;
  margin: 0 0 32px 0;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.6;
  
  @media (max-width: 768px) {
    font-size: 1.1rem;
    margin-bottom: 24px;
    max-width: 500px;
  }
  
  @media (max-width: 480px) {
    font-size: 1rem;
    margin-bottom: 20px;
    max-width: 350px;
    padding: 0 10px;
  }
`;

const BoardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
    margin-bottom: 24px;
  }
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 16px;
    margin-bottom: 20px;
  }
`;

const BoardCard = styled.div`
  background: rgba(245, 245, 247, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 20px;
  padding: 28px;
  transition: all 0.4s ease;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(29, 107, 167, 0.1);
  
  @media (max-width: 768px) {
    padding: 24px;
    border-radius: 16px;
  }
  
  @media (max-width: 480px) {
    padding: 20px;
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
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.9);
    transform: translateY(-8px);
    box-shadow: 0 12px 40px rgba(29, 107, 167, 0.2);
    border-color: rgba(52, 165, 216, 0.5);
    
    @media (max-width: 480px) {
      transform: translateY(-4px);
    }
    
    &::before {
      opacity: 1;
    }
  }
`;

const BoardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  
  @media (max-width: 768px) {
    margin-bottom: 14px;
  }
  
  @media (max-width: 480px) {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    margin-bottom: 12px;
  }
`;

const BoardTitleLink = styled(Link)`
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--text);
  text-decoration: none;
  flex: 1;
  transition: color 0.3s ease;

  &:hover {
    color: #1D6BA7;
  }
  
  @media (max-width: 768px) {
    font-size: 1.4rem;
  }
  
  @media (max-width: 480px) {
    font-size: 1.3rem;
  }
`;

const BoardSlug = styled.div`
  font-size: 0.9rem;
  color: #1D6BA7;
  font-family: 'Monaco', 'Menlo', monospace;
  background: rgba(52, 165, 216, 0.1);
  padding: 4px 8px;
  border-radius: 6px;
  display: inline-block;
  margin-bottom: 12px;
  border: 1px solid rgba(52, 165, 216, 0.3);
  font-weight: 600;
  
  @media (max-width: 768px) {
    font-size: 0.85rem;
    padding: 3px 7px;
    margin-bottom: 10px;
  }
  
  @media (max-width: 480px) {
    font-size: 0.8rem;
    padding: 3px 6px;
    margin-bottom: 8px;
  }
`;

const SubscribeButton = styled.button<{ $isSubscribed: boolean }>`
  background: ${props => props.$isSubscribed 
    ? 'rgba(220, 0, 78, 0.2)' 
    : 'rgba(52, 165, 216, 0.2)'
  };
  backdrop-filter: blur(10px);
  border: 2px solid ${props => props.$isSubscribed ? '#dc004e' : '#52A5D8'};
  color: ${props => props.$isSubscribed ? '#dc004e' : '#1D6BA7'};
  padding: 10px 20px;
  border-radius: 25px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  position: relative;
  overflow: hidden;
  min-height: 40px;
  
  @media (max-width: 768px) {
    padding: 8px 16px;
    font-size: 0.85rem;
    border-radius: 20px;
  }
  
  @media (max-width: 480px) {
    width: 100%;
    padding: 12px 16px;
    font-size: 0.9rem;
    border-radius: 20px;
    min-height: 44px;
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

  &:hover {
    background: ${props => props.$isSubscribed 
      ? 'rgba(220, 0, 78, 0.3)' 
      : 'rgba(52, 165, 216, 0.3)'
    };
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(29, 107, 167, 0.2);
    
    @media (max-width: 480px) {
      transform: translateY(-1px);
    }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const BoardDescription = styled.p`
  color: #666;
  margin: 0 0 16px 0;
  line-height: 1.6;
  font-size: 1rem;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  
  @media (max-width: 768px) {
    font-size: 0.95rem;
    margin-bottom: 14px;
  }
  
  @media (max-width: 480px) {
    font-size: 0.9rem;
    margin-bottom: 12px;
    -webkit-line-clamp: 4;
  }
`;

const BoardMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(52, 165, 216, 0.2);
  font-size: 0.85rem;
  color: #999;
  
  @media (max-width: 768px) {
    font-size: 0.8rem;
    margin-top: 14px;
    padding-top: 14px;
  }
  
  @media (max-width: 480px) {
    font-size: 0.75rem;
    margin-top: 12px;
    padding-top: 12px;
  }
`;

const CreateBoardButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: rgba(52, 165, 216, 0.2);
  backdrop-filter: blur(10px);
  border: 2px solid #52A5D8;
  color: #1D6BA7;
  padding: 16px 32px;
  border-radius: 50px;
  text-decoration: none;
  font-weight: 700;
  font-size: 1.1rem;
  margin-bottom: 48px;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(52, 165, 216, 0.2);
  min-height: 52px;
  
  @media (max-width: 768px) {
    padding: 14px 28px;
    font-size: 1rem;
    margin-bottom: 40px;
    border-radius: 40px;
  }
  
  @media (max-width: 480px) {
    padding: 16px 24px;
    font-size: 0.95rem;
    margin-bottom: 32px;
    border-radius: 26px;
    width: 100%;
    min-height: 56px;
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

  &:hover {
    background: rgba(52, 165, 216, 0.3);
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(52, 165, 216, 0.3);
    color: #1D6BA7;
    
    @media (max-width: 480px) {
      transform: translateY(-2px);
    }
  }
`;

const LoadingText = styled.div`
  text-align: center;
  color: #666;
  padding: 80px 20px;
  font-size: 1.3rem;
  font-weight: 500;
  
  @media (max-width: 768px) {
    padding: 60px 16px;
    font-size: 1.2rem;
  }
  
  @media (max-width: 480px) {
    padding: 40px 12px;
    font-size: 1.1rem;
  }
`;

const ErrorText = styled.div`
  text-align: center;
  color: #dc004e;
  padding: 60px 20px;
  font-size: 1.3rem;
  font-weight: 500;
  background: rgba(220, 0, 78, 0.1);
  border: 1px solid rgba(220, 0, 78, 0.3);
  border-radius: 16px;
  margin: 40px 0;
  
  @media (max-width: 768px) {
    padding: 40px 16px;
    font-size: 1.2rem;
    margin: 30px 0;
    border-radius: 12px;
  }
  
  @media (max-width: 480px) {
    padding: 30px 12px;
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
        setError('Failed to load Spheras');
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

  if (loading) return <LoadingText>Loading Spheras...</LoadingText>;
  if (error) return <ErrorText>{error}</ErrorText>;

  return (
    <BoardListContainer>
      <PageHeader>
        <PageTitle>Discover Spheras</PageTitle>
        <PageSubtitle>
          Join communities, share ideas, and connect with people who share your interests
        </PageSubtitle>
      </PageHeader>
      
      <CreateBoardButton to="/boards/create">
        ✨ Create New Sphera
      </CreateBoardButton>
      
      {boards.length === 0 ? (
        <EmptyState>
          <EmptyStateIcon>🌟</EmptyStateIcon>
          <EmptyStateText>No Spheras found</EmptyStateText>
          <EmptyStateSubtext>Be the first to create a Sphera and start building your community!</EmptyStateSubtext>
        </EmptyState>
      ) : (
        <BoardGrid>
          {boards.map(board => {
            const isSubscribed = subscriptions.has(board.id);
            const isLoading = actionLoading.has(board.id);
            
            return (
              <BoardCard key={board.id}>
                <BoardSlug>/b/{board.slug}</BoardSlug>
                <BoardHeader>
                  <div style={{ flex: 1 }}>
                    <BoardTitleLink to={`/b/${board.slug}`}>
                      {board.name}
                    </BoardTitleLink>
                  </div>
                  {currentUserId && (
                    <SubscribeButton
                      $isSubscribed={isSubscribed}
                      onClick={() => handleSubscriptionToggle(board.id, isSubscribed)}
                      disabled={isLoading}
                    >
                      {isLoading ? '...' : isSubscribed ? 'Joined' : 'Join'}
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
          })}
        </BoardGrid>
      )}
    </BoardListContainer>
  );
};

export default BoardList; 