import {
  BloomPreferencesProvider,
  useHapticsSettingRow,
  useVideoAutoplaySettingRow,
} from '@oxy.so/bloom/preferences';
import { SettingsGeneralPage } from '@oxy.so/bloom/settings-modal';

function PreferencesSettings() {
  const haptics = useHapticsSettingRow();
  const autoplay = useVideoAutoplaySettingRow();
  return (
    <SettingsGeneralPage
      sections={[
        { key: 'interaction', label: 'Interaction', rows: [haptics] },
        { key: 'media', label: 'Media', rows: [autoplay] },
      ]}
    />
  );
}

// An app's BloomProvider mounts the preferences with the theme's storage; this
// page's theme provider does not, so the example holds them for the session.
export default function PreferencesExample() {
  return (
    <div className="w-full max-w-lg text-foreground">
      <BloomPreferencesProvider>
        <PreferencesSettings />
      </BloomPreferencesProvider>
    </div>
  );
}
