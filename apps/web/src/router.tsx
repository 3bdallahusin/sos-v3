import React from 'react';
import {
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
  Outlet
} from '@tanstack/react-router';
import { AppShell } from './components/shell/AppShell.js';
import { HomePage } from './pages/HomePage.js';
import { LibraryPage } from './pages/LibraryPage.js';
import { LearningPage } from './pages/LearningPage.js';
import { TrackingPage } from './pages/TrackingPage.js';
import { CalendarPage } from './pages/CalendarPage.js';
import { ProfilePage } from './pages/ProfilePage.js';
import { SettingsPage } from './pages/SettingsPage.js';

// Root route hosting the persistent global App Shell
const rootRoute = createRootRoute({
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
  notFoundComponent: () => (
    <div
      className="flex-1 h-full min-h-[400px] flex flex-col items-center justify-center p-8 bg-[#080808] text-center select-none"
      data-testid="not-found-page"
    >
      <div className="w-12 h-12 rounded-2xl bg-[#111113] border border-[#27272A] flex items-center justify-center text-[#71717A] mb-3 shadow-sm">
        <span className="font-mono text-sm text-[#A1A1AA]">404</span>
      </div>
      <h2 className="text-base font-semibold text-[#FAFAFA] mb-1">Page Not Found</h2>
      <p className="text-xs text-[#71717A] max-w-sm mb-4">
        The destination you navigated to does not exist or has been moved.
      </p>
      <a
        href="/"
        className="h-8 px-3.5 rounded-lg bg-[#EDEDED] hover:bg-white text-[#0A0A0A] font-medium text-xs transition-colors inline-flex items-center gap-1.5 shadow-sm"
      >
        Return to Home
      </a>
    </div>
  )
});

// The primary navigation destination routes
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/home',
  beforeLoad: () => {
    throw redirect({ to: '/' });
  }
});

const libraryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/library',
  component: LibraryPage
});

const learningRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/learning',
  validateSearch: (search: Record<string, unknown>) => search,
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
  homeRoute,
  libraryRoute,
  learningRoute,
  trackingRoute,
  calendarRoute,
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
