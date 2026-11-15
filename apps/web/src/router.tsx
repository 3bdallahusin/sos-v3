import React from 'react';
import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet
} from '@tanstack/react-router';
import { AppShell } from './components/shell/AppShell.js';
import { HomePage } from './pages/HomePage.js';
import { LibraryPage } from './pages/LibraryPage.js';
import { LearningPage } from './pages/LearningPage.js';
import { TrackingPage } from './pages/TrackingPage.js';
import { CalendarPage } from './pages/CalendarPage.js';
import { CommunityPage } from './pages/CommunityPage.js';
import { ProfilePage } from './pages/ProfilePage.js';
import { SettingsPage } from './pages/SettingsPage.js';

// Root route hosting the persistent global App Shell
const rootRoute = createRootRoute({
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  )
});

// The eight primary navigation destination routes
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage
});

const libraryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/library',
  component: LibraryPage
});

const learningRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/learning',
  component: LearningPage
});

const trackingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tracking',
  component: TrackingPage
});

const calendarRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/calendar',
  component: CalendarPage
});

const communityRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/community',
  component: CommunityPage
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile',
  component: ProfilePage
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: SettingsPage
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  libraryRoute,
  learningRoute,
  trackingRoute,
  calendarRoute,
  communityRoute,
  profileRoute,
  settingsRoute
]);

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent'
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
