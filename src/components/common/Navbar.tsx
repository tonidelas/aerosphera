import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import styled from 'styled-components';

const NavbarWrapper = styled.div`
  width: 100%;
  z-index: 100;
  position: sticky;
  top: 0;
  margin-bottom: 20px;
`;

const NavBar = styled.nav`
  background: linear-gradient(180deg, rgba(200,220,255,0.85) 60%, rgba(180,210,255,0.7) 100%);
  backdrop-filter: blur(14px) brightness(1.08);
  border-radius: 0 0 24px 24px;
  box-shadow: 0 6px 32px 0 var(--shadow), 0 1.5px 0 0 #fff8 inset;
  padding: 16px 0;
  position: relative;
  z-index: 100;
  border: 1.5px solid var(--highlight);
  border-top: none;
  border-bottom: 2.5px solid #b0e0ff;
  box-sizing: border-box;
  transition: all 0.3s ease;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 60%;
    background: linear-gradient(180deg, rgba(255,255,255,0.45) 0%, transparent 100%);
    border-radius: 0 0 24px 24px;
    pointer-events: none;
    z-index: 1;
  }
`;

const NavContainer = styled.div`
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  z-index: 2;
`;

const NavBrand = styled(Link)`
  font-family: 'Segoe UI', 'Frutiger', 'Helvetica Neue', Arial, sans-serif;
  font-size: 2rem;
  color: #fff;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-shadow:
    0 1.5px 4px #b0e0ff44,
    0 1px 0 #fff,
    0 0 8px #7dc5ff33,
    0 0 2px #000,
    0 0 1.5px #000;
  filter: drop-shadow(0 1.5px 4px #b0e0ff33);
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;

  &:before {
    content: "";
    display: inline-block;
    width: 20px;
    height: 20px;
    background: linear-gradient(135deg, #7DC5FF, #4A8AF4);
    border-radius: 50%;
    box-shadow: 
      0 2px 8px rgba(66, 165, 245, 0.5),
      inset 0 1px 1px rgba(255, 255, 255, 0.6);
  }
  
  &:after {
    content: '';
    display: block;
    height: 4px;
    width: 60%;
    margin: 0 auto;
    background: linear-gradient(90deg, #fff8 0%, #b0e0ff33 100%);
    border-radius: 50%;
    opacity: 0.6;
    filter: blur(1.5px);
    margin-top: -4px;
    position: absolute;
    bottom: -4px;
    left: 20%;
  }
`;

const NavLinks = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const NavLink = styled.a`
  color: #fff;
  text-decoration: none;
  font-family: 'Segoe UI', 'Frutiger', 'Helvetica Neue', Arial, sans-serif;
  padding: 8px 16px;
  border-radius: 18px;
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  margin: 0 2px;
  background: linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(180,210,255,0.13) 100%);
  box-shadow: 0 1.5px 8px #b0e0ff33;
  transition: all 0.22s cubic-bezier(.4,2,.6,1), box-shadow 0.18s;
  position: relative;
  z-index: 2;
  border: 1px solid transparent;
  text-shadow:
    0 1px 2px #b0e0ff44,
    0 0 1px #000,
    0 0 0.5px #000;
  
  &:hover {
    background: linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(180,210,255,0.3) 100%);
    box-shadow: 0 2px 12px #7dc5ff66, 0 0 0 2px #3ec6ff44;
    border-color: #7DC5FF;
  }
  
  &.active {
    background: linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(180,210,255,0.4) 100%);
    box-shadow: 0 2px 16px #7dc5ff44, 0 0 0 2px #3ec6ff66;
    border-color: #3ec6ff;
    font-weight: 700;
    
    &:after {
      content: '';
      position: absolute;
      bottom: 4px;
      left: 50%;
      transform: translateX(-50%);
      width: 4px;
      height: 4px;
      background: #fff;
      border-radius: 50%;
      box-shadow: 0 0 4px rgba(255, 255, 255, 0.8);
    }
  }
`;

const DockWrapper = styled.div`
  display: flex;
  justify-content: center;
  transition: transform 0.3s ease, opacity 0.2s ease;
  position: relative;
  z-index: 50;
  margin-top: 16px;

  @media (max-width: 768px) {
    position: fixed;
    left: 0;
    bottom: 16px;
    width: 100%;
    z-index: 200;
    margin-top: 0;
  }
`;

const DockContainer = styled.div`
  width: max-content;
  margin: 0 auto;
  display: flex;
  justify-content: center;
`;

const Dock = styled.div`
  display: flex;
  gap: 18px;
  padding: 10px 24px;
  background: rgba(200, 220, 255, 0.5);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  box-shadow: 0 4px 20px var(--shadow);
  border: 1px solid var(--highlight);
  align-items: center;
  position: relative;
  
  &:before {
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
`;

const DockIcon = styled(Link)<{ $active?: boolean }>`
  width: 44px;
  height: 44px;
  border-radius: 8px;
  background-color: ${props => props.$active ? 'var(--accent)' : 'var(--primary)'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
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

// Mobile menu components
const MobileMenuIcon = styled.div`
  display: none;
  flex-direction: column;
  justify-content: space-between;
  width: 24px;
  height: 18px;
  cursor: pointer;
  
  @media (max-width: 768px) {
    display: flex;
  }
  
  span {
    height: 2px;
    width: 100%;
    background-color: white;
    border-radius: 4px;
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
      transform: rotate(-45deg) translate(6px, -6px);
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
    padding: ${props => (props.$isOpen ? '8px 0' : '0')};
    max-height: ${props => (props.$isOpen ? '300px' : '0')};
    overflow: hidden;
    transition: all 0.3s ease-in-out;
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
    z-index: 99;
    opacity: ${props => (props.$isOpen ? '1' : '0')};
    border-radius: 0 0 16px 16px;
    border: 1px solid var(--highlight);
    border-top: none;
  }
  
  a {
    padding: 12px 20px;
    color: white;
    text-decoration: none;
    text-align: center;
    font-weight: 500;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    transition: all 0.2s ease;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    
    &:last-child {
      border-bottom: none;
    }
    
    &:hover, &.active {
      background: rgba(255, 255, 255, 0.2);
    }
  }
`;

const ResponsiveNavLinks = styled(NavLinks)`
  @media (max-width: 768px) {
    display: none;
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
        setIsLoggedIn(true);
      }

      // Double-check with Supabase
      const { data } = await supabase.auth.getSession();
      
      if (data.session) {
        setIsLoggedIn(true);
        
        // If we have a session but no localStorage, update localStorage
        if (!userFromStorage) {
          localStorage.setItem('user', JSON.stringify(data.session.user));
        }
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
      
      if (currentScrollY > lastScrollY.current + 10 && currentScrollY > 100) {
        // Scrolling down - hide dock
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY.current - 10 || currentScrollY <= 100) {
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
          <NavBrand to="/">Aerosphera</NavBrand>
          
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
                <NavLink as={Link} to="/feed" className={location.pathname === '/feed' ? 'active' : ''}>
                  Feed
                </NavLink>
                <NavLink as={Link} to="/search" className={location.pathname === '/search' ? 'active' : ''}>
                  Search
                </NavLink>
                <NavLink as={Link} to="/chatrooms" className={location.pathname.startsWith('/chatrooms') ? 'active' : ''}> {/* Chatrooms Link moved here */}
                  Chat
                </NavLink>
                <NavLink as={Link} to="/profile" className={location.pathname === '/profile' ? 'active' : ''}>
                  Profile
                </NavLink>
                <NavLink as={Link} to="/settings" className={location.pathname === '/settings' ? 'active' : ''}>
                  Settings
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
                <NavLink as={Link} to="/login" className={location.pathname === '/login' ? 'active' : ''}>
                  Sign In
                </NavLink>
                <NavLink as={Link} to="/register" className={location.pathname === '/register' ? 'active' : ''}>
                  Register
                </NavLink>
              </>
            )}
          </ResponsiveNavLinks>
        </NavContainer>
      </NavBar>

      <MobileNavLinks $isOpen={isMobileMenuOpen}>
        <Link to="/" onClick={() => setIsMobileMenuOpen(false)}>Home</Link>
        {isLoggedIn && (
          <>
            <Link to="/chatrooms" onClick={() => setIsMobileMenuOpen(false)}>Chat</Link>
            <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)}>Profile</Link>
            <Link to="/settings" onClick={() => setIsMobileMenuOpen(false)}>Settings</Link>
            <a onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}>Logout</a>
          </>
        )}
        {!isLoggedIn && (
          <>
            <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>Sign In</Link>
            <Link to="/register" onClick={() => setIsMobileMenuOpen(false)}>Register</Link>
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
            <Dock>
              <DockIcon $active={location.pathname === '/feed'} to="/feed">
                🏠
              </DockIcon>
              <DockIcon $active={location.pathname === '/search'} to="/search">
                🔍
              </DockIcon>
              <DockIcon $active={location.pathname.startsWith('/chatrooms')} to="/chatrooms"> {/* Chatrooms Icon moved here */}
                💬
              </DockIcon>
              <DockIcon $active={location.pathname === '/profile'} to="/profile">
                👤
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