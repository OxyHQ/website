import ParticipationShell from '../components/faircoin/participation/ParticipationShell';
import { useState } from 'react';
import PilotStory from '../components/faircoin/participation/PilotStory';

export default function FairCoinPilotPage() {
  const [darkHeader, setDarkHeader] = useState(false);
  return (
    <ParticipationShell page="pilot" darkHeader={darkHeader}>
      <PilotStory onToneChange={setDarkHeader} />
    </ParticipationShell>
  );
}
