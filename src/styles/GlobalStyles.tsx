import { createGlobalStyle } from 'styled-components';
import { Theme } from './theme';

interface GlobalStylesProps {
  theme: Theme;
}

export const GlobalStyles = createGlobalStyle<GlobalStylesProps>`
  html, body, #root { /* Assuming your app is rendered into a div with id 'root' */
    height: 100%;
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: ${props => props.theme.colors.background};
    color: ${props => props.theme.colors.text.primary};
    transition: background-color 0.3s ease, color 0.3s ease;
  }

  a {
    color: ${props => props.theme.colors.primary};
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }

  button {
    cursor: pointer;
    font-family: inherit;
  }

  input, textarea, select {
    font-family: inherit;
  }
`;