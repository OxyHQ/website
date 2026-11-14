import ParticipationShell from '../components/faircoin/participation/ParticipationShell';
import { ParticipationExplanation } from '../components/faircoin/participation/ParticipationExplanation';

export default function FairCoinPilotPage() {
  return (
    <ParticipationShell page="pilot">
      <ParticipationExplanation page="pilot" />
    </ParticipationShell>
  );
}
