import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './i18n';
import './index.css';
import './lib/firebase'; // Import Firebase initialization
import OwnerChatPage from './pages/OwnerChatPage';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);