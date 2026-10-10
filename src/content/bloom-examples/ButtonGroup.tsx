import { useState } from 'react';
import { ButtonGroup, ButtonGroupItem } from '@oxy.so/bloom/button-group';

export default function ButtonGroupExample() {
  const [view, setView] = useState('List');
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <ButtonGroup>
        <ButtonGroupItem checked={view === 'List'} onPress={() => setView('List')}>
          List
        </ButtonGroupItem>
        <ButtonGroupItem checked={view === 'Grid'} onPress={() => setView('Grid')}>
          Grid
        </ButtonGroupItem>
      </ButtonGroup>
    </div>
  );
}
