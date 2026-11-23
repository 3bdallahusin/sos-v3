import React, { useEffect } from 'react';
import { useTrackingStore } from '../stores/tracking-store.js';
import { useSettingsStore } from '../stores/settings-store.js';
import { TrackingHeroCard } from '../components/tracking/TrackingHeroCard.js';
import { TrackingTodaySessions } from '../components/tracking/TrackingTodaySessions.js';
import { AnnualActivityHeatmap } from '../components/tracking/AnnualActivityHeatmap.js';
import { AnnualMetricsSummaryCard } from '../components/tracking/AnnualMetricsSummaryCard.js';
import { TrackingAnalyticsSection } from '../components/tracking/TrackingAnalyticsSection.js';
import { SessionHistoryView } from '../components/tracking/SessionHistoryView.js';
import { NewSessionSetupModal } from '../components/tracking/NewSessionSetupModal.js';
import { LinkCalendarPlanModal } from '../components/tracking/LinkCalendarPlanModal.js';
import { EndSessionSummaryModal } from '../components/tracking/EndSessionSummaryModal.js';
import { SessionDetailsModal } from '../components/tracking/SessionDetailsModal.js';
import { EditSessionModal } from '../components/tracking/EditSessionModal.js';
import { AddManualSessionModal } from '../components/tracking/AddManualSessionModal.js';
import { DeleteSessionModal } from '../components/tracking/DeleteSessionModal.js';

export const TrackingPage: React.FC = () => {
  const {
    activeView,
    status,
    loadTrackingData,
    syncWithPomodoroInterval
  } = useTrackingStore();

  const focusTracking = useSettingsStore(
    (s) => s.settings.general.focusTracking
  );
  const loadSettings = useSettingsStore((s) => s.loadSettings);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    loadTrackingData();
  }, [loadTrackingData]);

  // Sync initial target and break duration from user settings when in idle state
  useEffect(() => {
    if (status === 'idle') {
      const focusMins = focusTracking.focusMinutes ?? (
        focusTracking.defaultPomodoroInterval ? parseInt(focusTracking.defaultPomodoroInterval, 10) : 50
      );
      const breakMins = focusTracking.breakMinutes ?? 10;
      syncWithPomodoroInterval(focusMins, breakMins);
    }
  }, [focusTracking.focusMinutes, focusTracking.breakMinutes, focusTracking.defaultPomodoroInterval, status, syncWithPomodoroInterval]);

  return (
    <div
      data-testid="tracking-view"
      className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4 md:px-8 md:py-6 flex flex-col items-center bg-[#080808] relative"
    >
      <h1 className="sr-only">Study Tracking</h1>
      <div className="w-[92%] max-w-[1360px] flex flex-col gap-6">
        {activeView === 'dashboard' ? (
          <>
            {/* ROW 1: 2/3 Left (Today's Sessions) vs 1/3 Right (Focus Timer) */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch w-full animate-tier-1">
              {/* Left 2/3: Today's Sessions */}
              <div className="lg:col-span-8 h-[340px]">
                <TrackingTodaySessions />
              </div>

              {/* Right 1/3: Focus Timer Hero Card */}
              <div className="lg:col-span-4 h-[340px]">
                <TrackingHeroCard />
              </div>
            </section>

            {/* ROW 2: 2/3 Annual Activity + 1/3 Unified 3-Metric Card */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch w-full animate-tier-2">
              {/* Left 2/3: Annual Activity Heatmap */}
              <div className="lg:col-span-8 flex flex-col">
                <AnnualActivityHeatmap />
              </div>

              {/* Right 1/3: Unified 3-Metric Card */}
              <div className="lg:col-span-4 flex flex-col">
                <AnnualMetricsSummaryCard />
              </div>
            </section>

            {/* ROW 3: Unified Single-Card 50% / 50% Analytics Tier */}
            <section className="w-full animate-tier-3">
              <TrackingAnalyticsSection />
            </section>
          </>
        ) : (
          /* Session History Full View */
          <section className="w-full animate-tier-2">
            <SessionHistoryView />
          </section>
        )}
      </div>

      {/* Centered Modals Over Central Workspace */}
      <NewSessionSetupModal />
      <LinkCalendarPlanModal />
      <EndSessionSummaryModal />
      <SessionDetailsModal />
      <EditSessionModal />
      <AddManualSessionModal />
      <DeleteSessionModal />
    </div>
  );
};
