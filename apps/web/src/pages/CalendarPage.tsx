import React from 'react';
import { Calendar } from 'lucide-react';
import { PlaceholderView } from './PlaceholderView.js';

export const CalendarPage: React.FC = () => {
  return (
    <PlaceholderView
      phase="Phase 06 Target"
      title="Academic Calendar"
      description="Study scheduling, milestone deadlines, review queues, and linked study materials."
      icon={Calendar}
      tags={['Review Queues', 'Milestones', 'Exam Deadlines', 'Study Schedules']}
    />
  );
};
