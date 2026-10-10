import { useState } from 'react';
import { WizardFooter } from '@oxy.so/bloom/wizard';

export default function WizardExample() {
  const [step, setStep] = useState(0);
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <WizardFooter onNext={() => setStep(step + 1)} nextLabel={step ? 'Done' : 'Continue'} />
    </div>
  );
}
