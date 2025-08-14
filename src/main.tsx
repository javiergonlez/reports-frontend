//---------------------------------------------------------------------------------------------------------------------------

import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';

import { createRoot } from 'react-dom/client';
import { MantineProvider } from '@mantine/core';

import { AppRouter } from './router';
import { AuthProvider } from './contexts/AuthContext';

//---------------------------------------------------------------------------------------------------------------------------

const rootElement: HTMLElement | null = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

const root = createRoot(rootElement);

root.render(
  <MantineProvider>
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  </MantineProvider>
);
