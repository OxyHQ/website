import { SettingsCard, SettingsRow } from '@oxy.so/bloom/settings-modal/rows';

export default function SettingsModalRowsExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <SettingsCard>
        <SettingsRow label="Notifications" />
        <SettingsRow label="Language" />
      </SettingsCard>
    </div>
  );
}
