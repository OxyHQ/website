import { SettingsListGroup, SettingsListItem } from '@oxy.so/bloom/settings-list';

export default function SettingsListExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <SettingsListGroup>
        <SettingsListItem title="Notifications" />
        <SettingsListItem title="Appearance" />
        <SettingsListItem title="Language" />
      </SettingsListGroup>
    </div>
  );
}
