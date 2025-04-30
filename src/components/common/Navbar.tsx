import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import {
  NavBar,
  NavContainer,
  NavBrand,
  NavLinks,
  NavLink,
  Dock,
} from './StyledComponents';
import styled from 'styled-components';

// Redefine DockIcon with $active instead of active
const DockIcon = styled(Link)<{ $active?: boolean }>`
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background-color: ${props => props.$active ? 'var(--accent)' : 'var(--primary)'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  box-shadow: 0 2px 8px var(--shadow);
  transition: all 0.3s ease;
  background-image: linear-gradient(to bottom, 
    ${props => props.$active ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.5)'}, 
    transparent
  );
  border: 1px solid var(--highlight);
  
  &:hover {
    transform: translateY(-5px) scale(1.1);
  }
`;

const NavbarWrapper = styled.div`
  width: 100%;
  z-index: 100;
  position: sticky;
  top: 0;
`;

const DockWrapper = styled.div`
  margin-top: 20px;
  display: flex;
  justify-content: center;
`;

const DockContainer = styled.div`
  max-width: 600px;
  width: 100%;
`;

const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  useEffect(() => {
    // Check localStorage and Supabase session
    const checkAuth = async () => {
      const userFromStorage = localStorage.getItem('user');
      if (userFromStorage) {
        console.log('User found in localStorage');
        setIsLoggedIn(true);
      }

      // Double-check with Supabase
      const { data } = await supabase.auth.getSession();
      console.log('Supabase session:', data);
      
      if (data.session) {
        console.log('Active Supabase session found');
        setIsLoggedIn(true);
        
        // If we have a session but no localStorage, update localStorage
        if (!userFromStorage) {
          localStorage.setItem('user', JSON.stringify(data.session.user));
        }
      } else if (!data.session && userFromStorage) {
        // If no session but localStorage exists, we might need to refresh auth
        console.log('No active session but user in localStorage');
      }
    };
    
    checkAuth();
  }, [location]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('user');
      setIsLoggedIn(false);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  return (
    <NavbarWrapper>
      <NavBar>
        <NavContainer>
          <NavBrand>Aqua Social</NavBrand>
          <NavLinks>
            {isLoggedIn ? (
              <>
                <NavLink as={Link} to="/feed">
                  Feed
                </NavLink>
                <NavLink as={Link} to="/profile">
                  My Profile
                </NavLink>
                <NavLink as={Link} to="/search">
                  Find Friends
                </NavLink>
                <NavLink
                  as="a"
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleLogout();
                  }}
                >
                  Logout
                </NavLink>
              </>
            ) : (
              <>
                <NavLink as={Link} to="/login">
                  Sign In
                </NavLink>
                <NavLink as={Link} to="/register">
                  Sign Up
                </NavLink>
              </>
            )}
          </NavLinks>
        </NavContainer>
      </NavBar>
      
      {isLoggedIn && (
        <DockWrapper>
          <DockContainer>
            <Dock>
              <DockIcon $active={location.pathname === '/feed'} to="/feed">
                🏠
              </DockIcon>
              <DockIcon $active={location.pathname === '/profile'} to="/profile">
                👤
              </DockIcon>
              <DockIcon $active={location.pathname === '/search'} to="/search">
                🔍
              </DockIcon>
              <DockIcon $active={location.pathname === '/settings'} to="/settings">
                ⚙️
              </DockIcon>
            </Dock>
          </DockContainer>
        </DockWrapper>
      )}
    </NavbarWrapper>
  );
};

export default Navbar; 