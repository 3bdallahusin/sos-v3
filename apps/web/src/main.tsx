import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { router } from './router.js';
import { useShellStore } from './stores/shell-store.js';
import { initializeOrResumeGuestWorkspace } from '@sos/persistence';
import './styles/globals.css';

const AppRoot: React.FC = () => {
  const { setWorkspace, setIsInitializing, loadInitialPreferences } = useShellStore();

  useEffect(() => {
    let mounted = true;

    async function bootstrapGuestWorkspace() {
      try {
        await loadInitialPreferences();
        const guestWorkspace = await initializeOrResumeGuestWorkspace();
        if (mounted) {
          setWorkspace(guestWorkspace);
        }
      } catch (error) {
        console.error('Failed to initialize local guest workspace:', error);
      } finally {
        if (mounted) {
          setIsInitializing(false);
        }
      }
    }

    bootstrapGuestWorkspace();

    return () => {
      mounted = false;
    };
  }, [setWorkspace, setIsInitializing, loadInitialPreferences]);

  return <RouterProvider router={router} />;
};

const rootElement = document.getElementById('root');
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <AppRoot />
    </React.StrictMode>
  );
}
