import { config } from '@fortawesome/fontawesome-svg-core';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AppToaster } from './components/AppToaster';
import { ConfirmProvider } from './context/ConfirmContext';
import { ThemeProvider } from './context/ThemeContext';
import 'react-toastify/dist/ReactToastify.css';
import './styles/globals.css';
import './index.css';

config.autoAddCss = false;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <ConfirmProvider>
        <BrowserRouter>
          <App />
          <AppToaster />
        </BrowserRouter>
      </ConfirmProvider>
    </ThemeProvider>
  </StrictMode>,
);
