import styled from 'styled-components';

export const GlassPanel = styled.div`
  background-color: var(--glass);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 8px 16px var(--shadow);
  padding: 20px;
  margin-bottom: 20px;
  position: relative;
  border: 1px solid var(--highlight);
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 50%;
    background: linear-gradient(to bottom, var(--highlight), transparent);
    border-radius: 12px 12px 0 0;
    pointer-events: none;
  }
  
  @media (max-width: 768px) {
    padding: 15px;
  }
  
  @media (max-width: 480px) {
    padding: 12px;
    margin-bottom: 15px;
  }
`;

export const Dock = styled.div`
  background: transparent;
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 15px;
  display: flex;
  justify-content: center;
  gap: 15px;
  margin: 0 auto;
  max-width: 80%;
  position: relative;
  @media (max-width: 768px) {
    max-width: 95%;
  }
`;

interface DockIconProps {
  active?: boolean;
}

export const DockIcon = styled.div<DockIconProps>`
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background-color: ${props => props.active ? 'var(--accent)' : 'var(--primary)'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  box-shadow: 0 2px 8px var(--shadow);
  transition: all 0.3s ease;
  background-image: linear-gradient(to bottom, 
    ${props => props.active ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.5)'}, 
    transparent
  );
  border: 1px solid var(--highlight);
  
  &:hover {
    transform: translateY(-5px) scale(1.1);
  }
`;

export const AquaButton = styled.button`
  background: linear-gradient(to bottom, #7DC5FF, #4A8AF4);
  color: white;
  border: 1px solid #4A8AF4;
  border-radius: 20px;
  padding: 8px 20px;
  cursor: pointer;
  font-weight: bold;
  box-shadow: 0 1px 3px var(--shadow);
  transition: all 0.3s ease;
  
  &:hover {
    background: linear-gradient(to bottom, #90D2FF, #5A9AFF);
  }
  
  &:active {
    background: linear-gradient(to bottom, #4A8AF4, #7DC5FF);
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.3);
  }
`;

export const GlassInput = styled.input`
  background-color: rgba(255, 255, 255, 0.7);
  border: 1px solid var(--highlight);
  border-radius: 8px;
  padding: 10px;
  width: 100%;
  color: var(--text);
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(5px);
  
  &:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 5px var(--accent);
  }
`;

export const GlassTextArea = styled.textarea`
  background-color: rgba(255, 255, 255, 0.7);
  border: 1px solid var(--highlight);
  border-radius: 8px;
  padding: 10px;
  width: 100%;
  min-height: 100px;
  color: var(--text);
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(5px);
  line-height: 1.4;
  
  &:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 5px var(--accent);
  }
`;

export const NavBar = styled.nav`
  background: linear-gradient(180deg, rgba(200,220,255,0.85) 60%, rgba(180,210,255,0.7) 100%);
  backdrop-filter: blur(14px) brightness(1.08);
  border-radius: 0 0 24px 24px;
  box-shadow: 0 6px 32px 0 var(--shadow), 0 1.5px 0 0 #fff8 inset;
  padding: 22px 0 18px 0;
  color: white;
  position: relative;
  z-index: 100;
  border: 1.5px solid var(--highlight);
  border-top: none;
  border-bottom: 2.5px solid #b0e0ff;
  box-sizing: border-box;
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

export const NavContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
  
  @media (max-width: 768px) {
    padding: 0 12px;
  }
`;

export const NavBrand = styled.h1`
  font-family: 'Segoe UI', 'Frutiger', 'Helvetica Neue', Arial, sans-serif;
  font-size: 2.3rem;
  margin: 0;
  color: #fff !important;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-shadow:
    0 1.5px 4px #b0e0ff44,
    0 1px 0 #fff,
    0 0 8px #7dc5ff33,
    0 0 2px #000,
    0 0 1.5px #000;
  filter: drop-shadow(0 1.5px 4px #b0e0ff33);
  position: relative;
  z-index: 2;
  background: none;
  -webkit-background-clip: unset;
  -webkit-text-fill-color: unset;
  background-clip: unset;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  @media (max-width: 480px) {
    font-size: 1.5rem;
  }
  &::after {
    content: '';
    display: block;
    height: 8px;
    width: 60%;
    margin: 0 auto;
    background: linear-gradient(90deg, #fff8 0%, #b0e0ff33 100%);
    border-radius: 50%;
    opacity: 0.6;
    filter: blur(1.5px);
    margin-top: -10px;
  }
`;

export const NavLinks = styled.div`
  display: flex;
  gap: 32px;
  align-items: center;
  @media (max-width: 768px) {
    gap: 18px;
  }
`;

export const NavLink = styled.a`
  color: #fff !important;
  text-decoration: none !important;
  font-family: 'Segoe UI', 'Frutiger', 'Helvetica Neue', Arial, sans-serif;
  padding: 9px 26px;
  border-radius: 22px;
  font-size: 1.12rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  margin: 0 2px;
  background: linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(180,210,255,0.13) 100%);
  box-shadow: 0 1.5px 8px #b0e0ff33;
  transition: all 0.22s cubic-bezier(.4,2,.6,1), box-shadow 0.18s;
  position: relative;
  z-index: 2;
  border: 1.2px solid transparent;
  text-shadow:
    0 1px 2px #b0e0ff44,
    0 0 2px #000,
    0 0 1.5px #000;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  &:hover, &:focus {
    background: linear-gradient(180deg, #fff 0%, #eafdff 100%);
    color: #fff !important;
    box-shadow: 0 2px 16px #7dc5ff99, 0 0 0 4px #3ec6ff88;
    border: 2.5px solid #3ec6ff;
    text-shadow:
      0 2px 8px #7dc5ff33,
      0 0 4px #000,
      0 0 2px #000;
    text-decoration: none !important;
  }
  &.active {
    background: linear-gradient(180deg, #fff 0%, #eafdff 100%);
    color: #fff !important;
    box-shadow: 0 2px 24px #7dc5ff44, 0 0 0 6px #3ec6ff99;
    border: 2.5px solid #3ec6ff;
    text-shadow:
      0 2px 12px #7dc5ff33,
      0 0 6px #000,
      0 0 3px #000;
    font-weight: 700;
    text-decoration: none !important;
  }
`;

export const WindowContainer = styled.div`
  max-width: 1200px;
  margin: 30px auto;
  padding: 0 16px;
  @apply .glass-bg;
  
  @media (max-width: 768px) {
    margin: 20px auto;
  }
  
  @media (max-width: 480px) {
    margin: 15px auto;
    padding: 0 10px;
  }
`;

export const WindowFrame = styled.div`
  background-color: var(--window);
  border-radius: 10px;
  box-shadow: 0 10px 25px var(--shadow);
  overflow: hidden;
  border: 1px solid var(--highlight);
`;

export const WindowTitleBar = styled.div`
  background: linear-gradient(to bottom, #CCCCCC, #A3A3A3);
  padding: 10px 15px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #999999;
`;

export const WindowButtons = styled.div`
  display: flex;
  gap: 8px;
  margin-right: 15px;
`;

interface WindowButtonProps {
  color: string;
}

export const WindowButton = styled.div<WindowButtonProps>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: ${props => props.color};
  border: 1px solid rgba(0, 0, 0, 0.1);
`;

export const WindowTitle = styled.div`
  flex: 1;
  text-align: center;
  font-weight: bold;
  color: #333;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.7);
`;

export const WindowContent = styled.div`
  padding: 20px;
  
  @media (max-width: 768px) {
    padding: 15px;
  }
  
  @media (max-width: 480px) {
    padding: 12px;
  }
`;

export const Sidebar = styled.div`
  background-color: var(--sidebar-bg);
  border-radius: 8px;
  padding: 15px;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  
  ul {
    list-style-type: none;
  }
  
  li {
    padding: 8px 10px;
    border-radius: 5px;
    margin-bottom: 5px;
    cursor: pointer;
    transition: background-color 0.2s ease;
    
    &:hover {
      background-color: rgba(255, 255, 255, 0.5);
    }
    
    &.active {
      background-color: var(--accent);
      color: white;
    }
  }
`;

export const FormContainer = styled(WindowFrame)`
  max-width: 500px;
  margin: 40px auto;
  
  @media (max-width: 768px) {
    margin: 30px auto;
  }
  
  @media (max-width: 480px) {
    margin: 20px auto;
  }
`;

export const FormTitle = styled.h2`
  text-align: center;
  margin-bottom: 20px;
  color: var(--primary);
  
  @media (max-width: 480px) {
    margin-bottom: 15px;
    font-size: 1.5rem;
  }
`;

export const FormGroup = styled.div`
  margin-bottom: 20px;
  
  @media (max-width: 480px) {
    margin-bottom: 15px;
  }
`;

export const FormLabel = styled.label`
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  
  @media (max-width: 480px) {
    font-size: 0.9rem;
    margin-bottom: 4px;
  }
`;

export const ErrorMessage = styled.div`
  color: #FF3B30;
  font-size: 14px;
  margin-top: 5px;
  padding: 8px;
  background-color: rgba(255, 59, 48, 0.1);
  border-radius: 4px;
  
  @media (max-width: 480px) {
    font-size: 13px;
    padding: 6px;
  }
`;

export const SuccessMessage = styled.div`
  color: #34C759;
  font-size: 14px;
  margin-top: 10px;
  padding: 10px;
  background-color: rgba(52, 199, 89, 0.1);
  border-radius: 8px;
  
  @media (max-width: 480px) {
    font-size: 13px;
    padding: 8px;
    margin-top: 8px;
  }
`;

export const ProfileHeader = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
  align-items: center;
  
  @media (max-width: 768px) {
    gap: 15px;
    margin-bottom: 20px;
  }
  
  @media (max-width: 480px) {
    flex-direction: column;
    text-align: center;
    gap: 10px;
  }
`;

export const ProfileImage = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background-color: #DDDDDD;
  border: 2px solid var(--accent);
  overflow: hidden;
  box-shadow: 0 4px 8px var(--shadow);
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  @media (max-width: 768px) {
    width: 100px;
    height: 100px;
  }
`;

export const ProfileInfo = styled.div`
  flex: 1;
  
  h2 {
    font-size: 1.8rem;
    margin-bottom: 10px;
    
    @media (max-width: 768px) {
      font-size: 1.5rem;
      margin-bottom: 8px;
    }
  }
  
  p {
    color: #555555;
    margin-bottom: 10px;
  }
`;

export const TabContainer = styled.div`
  width: 100%;
`;

export const TabsHeader = styled.div`
  display: flex;
  border-bottom: 1px solid #DDDDDD;
  margin-bottom: 20px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  
  &::-webkit-scrollbar {
    height: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
  }
  
  @media (max-width: 480px) {
    margin-bottom: 15px;
  }
`;

interface TabProps {
  $active?: boolean;
}

export const Tab = styled.button<TabProps>`
  padding: 10px 20px;
  background: none;
  border: none;
  border-bottom: 2px solid ${props => props.$active ? 'var(--accent)' : 'transparent'};
  color: ${props => props.$active ? 'var(--accent)' : 'var(--text)'};
  font-weight: ${props => props.$active ? 'bold' : 'normal'};
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: none;
  
  &:hover {
    color: var(--accent);
    background: none;
  }
  
  @media (max-width: 480px) {
    padding: 8px 15px;
    font-size: 0.9rem;
    flex-shrink: 0;
  }
`;

export const TabContent = styled.div`
  width: 100%;
`;

export const Divider = styled.hr`
  border: none;
  height: 1px;
  background: linear-gradient(to right, transparent, rgba(0, 0, 0, 0.1), transparent);
  margin: 20px 0;
`;

export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-top: 20px;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 15px;
  }
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 12px;
  }
`;

interface CardProps {
  $gradient?: boolean;
}

export const Card = styled.div<CardProps>`
  background: ${props => props.$gradient ? 'linear-gradient(to bottom, #F5F9FF, #E4EFF7)' : 'white'};
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 4px 8px var(--shadow);
  height: 100%;
  
  @media (max-width: 480px) {
    padding: 12px;
  }
`;

const BackgroundOptions = styled.div`
  display: flex;
  gap: 8px;
`;

interface BackgroundOptionProps {
  bg: string;
  $selected: boolean;
}

const BackgroundOption = styled.div<BackgroundOptionProps>`
  width: 30px;
  height: 30px;
  border-radius: 5px;
  background: ${props => props.bg};
  cursor: pointer;
  border: ${props => props.$selected ? '2px solid var(--accent)' : '1px solid var(--highlight)'};
  box-shadow: ${props => props.$selected ? '0 0 5px var(--accent)' : 'none'};
  transition: transform 0.2s ease;
  
  &:hover {
    transform: scale(1.1);
  }
`; 