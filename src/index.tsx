import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import './styles/rich-editor.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { StyleSheetManager } from 'styled-components';

// A simple prop forwarding function that only forwards valid HTML attributes
const shouldForwardProp = (prop: string) => {
  // Don't forward props that start with $ - these are transient props in styled-components
  return !prop.startsWith('$');
};

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <StyleSheetManager shouldForwardProp={shouldForwardProp}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StyleSheetManager>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
