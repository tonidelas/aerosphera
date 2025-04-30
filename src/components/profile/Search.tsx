import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { supabase } from '../../utils/supabaseClient';
import {
  WindowContainer,
  WindowFrame,
  WindowTitleBar,
  WindowButtons,
  WindowButton,
  WindowTitle,
  WindowContent,
  GlassInput,
  AquaButton,
  GlassPanel,
  Card,
  Divider
} from '../common/StyledComponents';

const ResultsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
`;

const UserCard = styled(Card)`
  display: flex;
  align-items: center;
  gap: 15px;
  transition: transform 0.3s ease;
  background: linear-gradient(135deg, #F5F9FF, #E4EFF7);
  
  &:hover {
    transform: translateY(-5px);
  }
`;

const UserAvatar = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 30px;
  overflow: hidden;
  border: 2px solid var(--accent);
  box-shadow: 0 2px 8px var(--shadow);
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const UserInfo = styled.div`
  flex: 1;
`;

const NoResults = styled.div`
  text-align: center;
  padding: 40px;
  color: var(--text);
  font-style: italic;
`;

const SearchContainer = styled.div`
  display: flex;
  gap: 10px;
  margin: 20px 0;
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  margin: 30px auto;
  border: 3px solid rgba(13, 158, 255, 0.2);
  border-top: 3px solid var(--accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

interface User {
  id: string;
  username: string;
  bio: string;
  avatar_url: string | null;
}

const Search: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<User[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  const defaultAvatar = '/default-avatar.png';
  
  // Fetch all users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*');
          
        if (error) throw error;
        
        console.log('Fetched users:', data);
        setAllUsers(data || []);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, []);
  
  const handleSearch = () => {
    if (!searchTerm.trim()) {
      // Show all users if search term is empty
      setResults(allUsers);
      setHasSearched(true);
      return;
    }
    
    setIsSearching(true);
    setHasSearched(true);
    
    // Filter users based on search term
    const filteredUsers = allUsers.filter(user => 
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.bio?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setResults(filteredUsers);
    setIsSearching(false);
  };
  
  return (
    <WindowContainer>
      <WindowFrame>
        <WindowTitleBar>
          <WindowButtons>
            <WindowButton color="#FF5F56" />
            <WindowButton color="#FFBD2E" />
            <WindowButton color="#27C93F" />
          </WindowButtons>
          <WindowTitle>Find Friends</WindowTitle>
        </WindowTitleBar>
        
        <WindowContent>
          <h2>Find Other Users</h2>
          <p>Search for other users to connect with</p>
          
          <Divider />
          
          <GlassPanel>
            <SearchContainer>
              <GlassInput
                type="text"
                placeholder="Search by username or interests..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                onKeyPress={(e: React.KeyboardEvent) => e.key === 'Enter' && handleSearch()}
                style={{ flex: 1 }}
              />
              <AquaButton onClick={handleSearch}>
                Search
              </AquaButton>
            </SearchContainer>
          </GlassPanel>
          
          {loading ? (
            <LoadingSpinner />
          ) : isSearching ? (
            <LoadingSpinner />
          ) : (
            <>
              {hasSearched || results.length > 0 ? (
                <ResultsContainer>
                  {results.length > 0 ? (
                    results.map(user => (
                      <UserCard key={user.id}>
                        <UserAvatar>
                          <img 
                            src={user.avatar_url || defaultAvatar} 
                            alt={user.username} 
                          />
                        </UserAvatar>
                        <UserInfo>
                          <h3>{user.username || 'Unnamed User'}</h3>
                          <p>{user.bio || 'No bio yet'}</p>
                          <Link to={`/profile/${user.id}`}>
                            <AquaButton>View Profile</AquaButton>
                          </Link>
                        </UserInfo>
                      </UserCard>
                    ))
                  ) : (
                    <NoResults>
                      No users found with those interests. Try a different search.
                    </NoResults>
                  )}
                </ResultsContainer>
              ) : (
                <AquaButton onClick={() => {
                  setResults(allUsers);
                  setHasSearched(true);
                }}>
                  View All Users
                </AquaButton>
              )}
            </>
          )}
        </WindowContent>
      </WindowFrame>
    </WindowContainer>
  );
};

export default Search; 