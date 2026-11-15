import React from 'react';
import { User } from 'lucide-react';
import { PlaceholderView } from './PlaceholderView.js';

export const ProfilePage: React.FC = () => {
  return (
    <PlaceholderView
      phase="Phase 08 Target"
      title="Student Profile"
      description="Academic identity, study achievements, and optional non-destructive account registration."
      icon={User}
      tags={['Academic Stats', 'Guest Identity', 'Optional Authentication', 'Non-Destructive Migration']}
    />
  );
};
