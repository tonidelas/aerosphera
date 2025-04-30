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
`;

export const Dock = styled.div`
  background: rgba(200, 220, 255, 0.5);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  box-shadow: 0 4px 20px var(--shadow);
  padding: 15px;
  display: flex;
  justify-content: center;
  gap: 15px;
  margin: 0 auto;
  max-width: 80%;
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
    border-radius: 16px 16px 0 0;
    pointer-events: none;
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
  background: linear-gradient(to bottom, #7DC5FF, #4A8AF4);
  color: white;
  padding: 15px 0;
  box-shadow: 0 2px 10px var(--shadow);
  border-bottom: 1px solid var(--highlight);
`;

export const NavContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
`;

export const NavBrand = styled.h1`
  font-family: 'Lucida Grande', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  font-size: 24px;
  margin: 0;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
`;

export const NavLinks = styled.div`
  display: flex;
  gap: 20px;
`;

export const NavLink = styled.a`
  color: white;
  font-family: 'Lucida Grande', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  padding: 5px 10px;
  border-radius: 8px;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }
`;

export const WindowContainer = styled.div`
  max-width: 1200px;
  margin: 30px auto;
  padding: 0 16px;
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
`;

export const FormTitle = styled.h2`
  text-align: center;
  margin-bottom: 20px;
  color: var(--primary);
`;

export const FormGroup = styled.div`
  margin-bottom: 20px;
`;

export const FormLabel = styled.label`
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
`;

export const ErrorMessage = styled.div`
  color: #FF3B30;
  font-size: 14px;
  margin-top: 5px;
`;

export const SuccessMessage = styled.div`
  color: #34C759;
  font-size: 14px;
  margin-top: 10px;
  padding: 10px;
  background-color: rgba(52, 199, 89, 0.1);
  border-radius: 8px;
`;

export const ProfileHeader = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
  align-items: center;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

export const ProfileImage = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 60px;
  background-color: var(--secondary);
  overflow: hidden;
  box-shadow: 0 2px 10px var(--shadow);
  border: 3px solid white;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

export const ProfileInfo = styled.div`
  flex: 1;
`;

export const TabContainer = styled.div`
  margin-bottom: 20px;
`;

export const TabsHeader = styled.div`
  display: flex;
  gap: 5px;
  margin-bottom: -1px;
`;

interface TabProps {
  $active?: boolean;
}

export const Tab = styled.div<TabProps>`
  padding: 10px 15px;
  background: ${props => props.$active 
    ? 'linear-gradient(to bottom, #FFF, #F5F5F7)' 
    : 'linear-gradient(to bottom, #E5E5E5, #D1D1D1)'};
  border: 1px solid #CCCCCC;
  border-bottom: ${props => props.$active ? 'none' : '1px solid #CCCCCC'};
  border-radius: 8px 8px 0 0;
  cursor: pointer;
  color: ${props => props.$active ? 'var(--primary)' : '#666'};
  font-weight: ${props => props.$active ? 'bold' : 'normal'};
  position: relative;
  z-index: ${props => props.$active ? '1' : '0'};
  
  &:hover {
    background: linear-gradient(to bottom, #FFF, #F5F5F7);
  }
`;

export const TabContent = styled.div`
  background-color: #FFF;
  border: 1px solid #CCCCCC;
  border-radius: 0 8px 8px 8px;
  padding: 20px;
`;

export const Divider = styled.hr`
  border: none;
  height: 1px;
  background: linear-gradient(to right, transparent, rgba(0, 0, 0, 0.1), transparent);
  margin: 20px 0;
`;

export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  margin-top: 20px;
`;

interface CardProps {
  $gradient?: boolean;
}

export const Card = styled.div<CardProps>`
  background: ${props => props.$gradient 
    ? 'linear-gradient(135deg, #F5F7FA, #E4EDF7)' 
    : 'white'};
  border-radius: 10px;
  box-shadow: 0 3px 10px var(--shadow);
  padding: 15px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px var(--shadow);
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