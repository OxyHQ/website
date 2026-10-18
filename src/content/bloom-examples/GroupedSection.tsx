import { useState } from 'react';
import { GroupedSection, GroupedSectionItem } from '@oxy.so/bloom/grouped-section';
import { Switch } from '@oxy.so/bloom/switch';

export default function GroupedSectionExample() {
  const [notifications, setNotifications] = useState(true);
  return (
    <div className="w-full max-w-lg text-foreground">
      <GroupedSection title="Preferences" footer="Changes apply to this preview.">
        <GroupedSectionItem title="Language" value="English" />
        <GroupedSectionItem
          title="Notifications"
          rightElement={
            <Switch
              checked={notifications}
              onCheckedChange={setNotifications}
              accessibilityLabel="Notifications"
            />
          }
        />
      </GroupedSection>
    </div>
  );
}
