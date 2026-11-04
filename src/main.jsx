import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './theme';
import { MonitoringProvider } from './data/MonitoringContext';
import App from './App';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <MonitoringProvider>
          <App />
        </MonitoringProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
);
