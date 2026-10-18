import { useState } from 'react';
import { SubscriptionPlans } from '@oxy.so/bloom/subscription-plans';

export default function SubscriptionPlansExample() {
  const [plan, setPlan] = useState('personal');
  return (
    <div className="w-full max-w-lg text-foreground">
      <SubscriptionPlans
        productName="Example workspace"
        selectorLabel="Example plans"
        value={plan}
        onValueChange={setPlan}
        plans={[
          {
            id: 'personal',
            label: 'Personal',
            price: { amount: 8, currency: 'USD', suffix: '/ month' },
            benefits: [{ id: 'projects', title: 'Five projects' }],
          },
          {
            id: 'team',
            label: 'Team',
            price: { amount: 20, currency: 'USD', suffix: '/ month' },
            benefits: [
              { id: 'projects', title: 'Unlimited projects' },
              { id: 'sharing', title: 'Shared workspaces' },
            ],
          },
        ]}
      />
    </div>
  );
}
