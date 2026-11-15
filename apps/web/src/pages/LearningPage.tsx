import React from 'react';
import { BookOpen } from 'lucide-react';
import { PlaceholderView } from './PlaceholderView.js';

export const LearningPage: React.FC = () => {
  return (
    <PlaceholderView
      phase="Phase 04 Target"
      title="Learning Workspace"
      description="Eight unified study tools sharing a tiered lifecycle and contextual docked canvas toolbar."
      icon={BookOpen}
      tags={[
        'Notes',
        'PDF Reader',
        'Slides',
        'Videos',
        'Audios',
        'Browser',
        'Flashcards (FSRS)',
        'Quiz | Exam'
      ]}
    />
  );
};
