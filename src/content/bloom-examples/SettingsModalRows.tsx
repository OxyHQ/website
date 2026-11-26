import { useState } from 'react';
import { GroupedSection, GroupedSectionItem } from '@oxy.so/bloom/grouped-section';
import {
  SettingsSection,
  SettingsSelect,
  SettingsValueField,
} from '@oxy.so/bloom/settings-modal/rows';

export default function SettingsModalRowsExample() {
  const [notifications, setNotifications] = useState<'all' | 'mentions' | 'none'>('all');
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <SettingsSection label="General">
        <GroupedSection separator="line">
          <GroupedSectionItem
            title="Notifications"
            wrapControl
            rightElement={
              <SettingsSelect
                label="Notifications"
                value={notifications}
                onChange={setNotifications}
                items={[
                  { value: 'all', label: 'All messages' },
                  { value: 'mentions', label: 'Mentions only' },
                  { value: 'none', label: 'Off' },
                ]}
              />
            }
          />
          <GroupedSectionItem
            title="Language"
            wrapControl
            rightElement={<SettingsValueField>English</SettingsValueField>}
          />
        </GroupedSection>
      </SettingsSection>
    </div>
  );
}
