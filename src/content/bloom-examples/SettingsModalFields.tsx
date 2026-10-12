import { useState } from 'react';
import { SettingsTextField } from '@oxy.so/bloom/settings-modal/fields';

export default function SettingsModalFieldsExample() {
  const [name, setName] = useState('My workspace');
  return (
    <div className="w-full max-w-lg text-foreground">
      <SettingsTextField
        label="Workspace name"
        value={name}
        onCommit={setName}
        showSavedToast={false}
      />
    </div>
  );
}
