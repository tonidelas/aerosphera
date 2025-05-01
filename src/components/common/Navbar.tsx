import React, { useState, useEffect, useRef } from 'react';
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
  display: flex;
  justify-content: center;
  transition: transform 0.3s ease, opacity 0.2s ease;
  position: relative;
  z-index: 50;
  margin-top: 20px;

  @media (max-width: 768px) {
    position: fixed;
    left: 0;
    bottom: 0;
    width: 100%;
    z-index: 200;
    margin-top: 0;
  }
`;

const DockContainer = styled.div`
  max-width: 600px;
  width: 100%;
  padding: 0 10px;
  margin: 0 auto;
  display: flex;
  justify-content: center;

  @media (max-width: 480px) {
    padding: 0 5px;
  }
`;

// Mobile menu components
const MobileMenuIcon = styled.div`
  display: none;
  flex-direction: column;
  justify-content: space-between;
  width: 30px;
  height: 21px;
  cursor: pointer;
  
  @media (max-width: 768px) {
    display: flex;
  }
  
  span {
    height: 3px;
    width: 100%;
    background-color: white;
    border-radius: 3px;
    transition: all 0.3s ease;
  }
  
  &.open {
    span:nth-child(1) {
      transform: rotate(45deg) translate(5px, 5px);
    }
    
    span:nth-child(2) {
      opacity: 0;
    }
    
    span:nth-child(3) {
      transform: rotate(-45deg) translate(7px, -6px);
    }
  }
`;

const MobileNavLinks = styled.div<{ $isOpen: boolean }>`
  display: none;
  
  @media (max-width: 768px) {
    display: flex;
    flex-direction: column;
    background: linear-gradient(to bottom, #7DC5FF, #4A8AF4);
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    padding: ${props => (props.$isOpen ? '10px 0' : '0')};
    max-height: ${props => (props.$isOpen ? '300px' : '0')};
    overflow: hidden;
    transition: all 0.3s ease-in-out;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    z-index: 99;
  }
  
  a {
    padding: 12px 16px;
    color: white;
    text-decoration: none;
    text-align: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    
    &:last-child {
      border-bottom: none;
    }
  }
`;

const ResponsiveNavLinks = styled(NavLinks)`
  @media (max-width: 768px) {
    display: none;
  }
`;

const ResponsiveDock = styled(Dock)`
  background: rgba(200, 220, 255, 0.5);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  box-shadow: 0 4px 20px var(--shadow);
  border: 1px solid var(--highlight);
  position: relative;
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 50%;
    background: linear-gradient(to bottom, var(--highlight), transparent);
    border-radius: 16px 16px 0 0;
    pointer-events: none;
  }
  @media (max-width: 480px) {
    padding: 10px;
    gap: 10px;
  }
`;

const ResponsiveDockIcon = styled(DockIcon)`
  @media (max-width: 480px) {
    width: 40px;
    height: 40px;
    font-size: 20px;
  }
`;

const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  
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
    
    // Reset visibility when navigating to a new page
    setIsVisible(true);
    lastScrollY.current = 0;
  }, [location]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY.current + 10) {
        // Scrolling down - hide dock
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY.current - 10 || currentScrollY <= 0) {
        // Scrolling up or at the top - show dock
        setIsVisible(true);
      }
      
      lastScrollY.current = currentScrollY;
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

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

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };
  
  return (
    <NavbarWrapper>
      <NavBar>
        <NavContainer>
          <NavBrand>Aqua Social</NavBrand>
          
          <MobileMenuIcon 
            className={isMobileMenuOpen ? 'open' : ''} 
            onClick={toggleMobileMenu}
          >
            <span></span>
            <span></span>
            <span></span>
          </MobileMenuIcon>

          <ResponsiveNavLinks>
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
          </ResponsiveNavLinks>
        </NavContainer>
      </NavBar>

      <MobileNavLinks $isOpen={isMobileMenuOpen}>
        {isLoggedIn ? (
          <>
            <NavLink as={Link} to="/feed" onClick={closeMobileMenu}>
              Feed
            </NavLink>
            <NavLink as={Link} to="/profile" onClick={closeMobileMenu}>
              My Profile
            </NavLink>
            <NavLink as={Link} to="/search" onClick={closeMobileMenu}>
              Find Friends
            </NavLink>
            <NavLink
              as="a"
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleLogout();
                closeMobileMenu();
              }}
            >
              Logout
            </NavLink>
          </>
        ) : (
          <>
            <NavLink as={Link} to="/login" onClick={closeMobileMenu}>
              Sign In
            </NavLink>
            <NavLink as={Link} to="/register" onClick={closeMobileMenu}>
              Sign Up
            </NavLink>
          </>
        )}
      </MobileNavLinks>
      
      {isLoggedIn && (
        <DockWrapper style={{ 
          transform: isVisible ? 'translateY(0)' : 'translateY(100px)',
          opacity: isVisible ? 1 : 0,
          visibility: isVisible ? 'visible' : 'hidden'
        }}>
          <DockContainer>
            <ResponsiveDock>
              <ResponsiveDockIcon $active={location.pathname === '/feed'} to="/feed">
                🏠
              </ResponsiveDockIcon>
              <ResponsiveDockIcon $active={location.pathname === '/profile'} to="/profile">
                👤
              </ResponsiveDockIcon>
              <ResponsiveDockIcon $active={location.pathname === '/search'} to="/search">
                🔍
              </ResponsiveDockIcon>
              <ResponsiveDockIcon $active={location.pathname === '/settings'} to="/settings">
                ⚙️
              </ResponsiveDockIcon>
            </ResponsiveDock>
          </DockContainer>
        </DockWrapper>
      )}
    </NavbarWrapper>
  );
};

export default Navbar; 