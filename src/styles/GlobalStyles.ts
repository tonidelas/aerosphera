import { createGlobalStyle } from 'styled-components';

const GlobalStyles = createGlobalStyle`
  /* Font is now imported in index.html */

  :root {
    /* Frutiger Aero color palette */
    --primary: #1D6BA7; /* Aqua blue */
    --secondary: #52A5D8; /* Lighter blue */
    --accent: #0D9EFF; /* Bright blue */
    --background: #E2E8F0; /* Light gray blue */
    --window: #F5F5F7; /* Window background */
    --text: #333333; /* Dark text */
    --text-light: #FFFFFF; /* Light text */
    --shadow: rgba(0, 0, 0, 0.3);
    --highlight: rgba(255, 255, 255, 0.7);
    --glass: rgba(230, 240, 255, 0.5);
    --button-gradient-start: #FEFEFE;
    --button-gradient-end: #E5E5E5;
    --button-border: #AAAAAA;
    --sidebar-bg: #D1DEE9;
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Lucida Grande', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background-color: var(--background);
    color: var(--text);
    line-height: 1.6;
    background-image: linear-gradient(to bottom, #BADFFF, #E2E8F0);
    background-attachment: fixed;
    background-size: cover;
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: 'Lucida Grande', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    color: var(--text);
    margin-bottom: 1rem;
    font-weight: normal;
  }

  a {
    text-decoration: none;
    color: var(--primary);
    transition: color 0.3s ease;
    
    &:hover {
      color: var(--accent);
    }
  }

  button {
    font-family: 'Lucida Grande', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: linear-gradient(to bottom, var(--button-gradient-start), var(--button-gradient-end));
    color: var(--text);
    border: 1px solid var(--button-border);
    padding: 8px 16px;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 1px 2px var(--shadow);
    
    &:hover {
      background: linear-gradient(to bottom, var(--button-gradient-end), var(--button-gradient-start));
    }
    
    &:active {
      box-shadow: inset 0 1px 3px var(--shadow);
    }
    
    &:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
  }

  input, textarea {
    font-family: 'Lucida Grande', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background-color: #FFFFFF;
    border: 1px solid var(--button-border);
    padding: 10px;
    border-radius: 8px;
    color: var(--text);
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
    
    &:focus {
      outline: none;
      border-color: var(--accent);
      box-shadow: 0 0 5px var(--accent);
    }
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 16px;
  }
`;

export default GlobalStyles; 