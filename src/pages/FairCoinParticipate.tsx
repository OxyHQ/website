import ParticipationShell from '../components/faircoin/participation/ParticipationShell';
import { ParticipationExplanation } from '../components/faircoin/participation/ParticipationExplanation';
import ParticipationForm from '../components/faircoin/participation/ParticipationForm';

export default function FairCoinParticipatePage() {
  return (
    <ParticipationShell page="participate">
      <ParticipationExplanation page="participate" />
      <ParticipationForm />
    </ParticipationShell>
  );
}
