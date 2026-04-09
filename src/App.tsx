import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import styled from 'styled-components'; // Import styled-components
import { ThemeProvider } from './styles/ThemeProvider';
import GlobalStyles from './styles/GlobalStyles';
import Navbar from './components/common/Navbar';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Profile from './components/profile/Profile';
import Search from './components/profile/Search';
import Feed from './components/posts/Feed';
import Settings from './components/settings/Settings';
import Chatrooms from './components/chat/Chatrooms';
import Chatroom from './components/chat/Chatroom';
import BoardList from './components/boards/BoardList';
import CreateBoard from './components/boards/CreateBoard';
import BoardView from './components/boards/BoardView';
import ManageSpheraPage from './components/boards/ManageSpheraPage';
import { supabase } from './utils/supabaseClient';

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if user is in localStorage
        const storedUser = localStorage.getItem('user');
        console.log('Protected route - User in localStorage:', !!storedUser);
        
        // Check Supabase session
        const { data } = await supabase.auth.getSession();
        console.log('Protected route - Supabase session:', !!data.session);
        
        if (data.session || storedUser) {
          setIsAuthenticated(true);
        } else {
          console.log('No auth found, redirecting to login');
          setIsAuthenticated(false);
          navigate('/login');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
        navigate('/login');
      }
    };
    
    checkAuth();
  }, [navigate]);

  // Show loading while checking auth
  if (isAuthenticated === null) {
    return <div>Loading...</div>;
  }

  return isAuthenticated ? <>{children}</> : null;
};

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const ContentWrapper = styled.main`
  flex-grow: 1;
  overflow-y: auto; /* Allows content to scroll if it exceeds viewport */
  display: flex; /* Ensure children can also use height: 100% */
  flex-direction: column; /* Ensure children can also use height: 100% */
`;

const App: React.FC = () => {
  // Check if user is logged in
  const isLoggedIn = !!localStorage.getItem('user');

  return (
    <ThemeProvider>
      <GlobalStyles />
      <AppContainer>
        <Navbar />
        <ContentWrapper>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile/:userId" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/search" 
              element={
                <ProtectedRoute>
                  <Search />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/feed" 
              element={
                <ProtectedRoute>
                  <Feed />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } 
            />
            {/* Temporarily disabled chatrooms feature
            <Route 
              path="/chatrooms"
              element={
                <ProtectedRoute>
                  <Chatrooms />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/chatrooms/:id"
              element={
                <ProtectedRoute>
                  <Chatroom />
                </ProtectedRoute>
              }
            />
            */}
            <Route 
              path="/boards"
              element={
                <ProtectedRoute>
                  <BoardList />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/boards/create"
              element={
                <ProtectedRoute>
                  <CreateBoard />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/b/:slug"
              element={
                <ProtectedRoute>
                  <BoardView />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/b/:slug/manage"
              element={
                <ProtectedRoute>
                  <ManageSpheraPage />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to={isLoggedIn ? "/feed" : "/login"} replace />} />
          </Routes>
        </ContentWrapper>
      </AppContainer>
    </ThemeProvider>
  );
};

export default App;
