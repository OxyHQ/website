import { COLOR_PRESET_REGISTRY, useBloomTheme, useTheme } from '@oxy.so/bloom/theme';
import { useAccountColorSave, useAuth } from '@oxy.so/services/ui/client';
import {
  Select,
  SelectContent,
  SelectIcon,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectTrigger,
  SelectValue,
} from '@oxy.so/bloom/select';
import { toast } from '@oxy.so/bloom/toast';
import {
  SegmentedControl,
  SegmentedControlItem,
  SegmentedControlItemText,
} from '@oxy.so/bloom/segmented-control';
import { getPresetVars } from '@oxy.so/bloom/design-tokens';
import type { AppColorName } from '../../theme';
import { AnimatedTitle } from '../ui/AnimatedTitle';

export default function SettingsAppearance() {
  const { colorPreset: currentPreset, setMode } = useBloomTheme();
  const { isAuthenticated } = useAuth();
  // The mode on screen: a `system` mode still resolves to one of the two.
  const previewMode = useTheme().isDark ? 'dark' : 'light';

  return (
    <div className="container py-16 lg:py-24">
      <div className="mx-auto max-w-2xl">
        {/* Page header */}
        <AnimatedTitle as="h1" className="text-heading-responsive-md">
          Settings
        </AnimatedTitle>
        <p className="mt-3 text-base text-muted-foreground">
          Customize the look and feel of the website.
        </p>

        {/* Appearance section */}
        <section className="mt-12">
          <h2 className="text-lg font-semibold text-foreground">Appearance</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose your preferred theme mode and account color.
          </p>

          {/* Mode toggle: the choice is Bloom's segmented control; the two
              thumbnails under it show the current accent in each mode. */}
          <div className="mt-8">
            <h3 className="text-sm font-medium text-foreground">Theme</h3>
            <div className="mt-3 flex">
              <SegmentedControl
                label="Theme"
                type="radio"
                value={previewMode}
                onValueChange={setMode}
              >
                <SegmentedControlItem value="light">
                  <SegmentedControlItemText>Light</SegmentedControlItemText>
                </SegmentedControlItem>
                <SegmentedControlItem value="dark">
                  <SegmentedControlItemText>Dark</SegmentedControlItemText>
                </SegmentedControlItem>
              </SegmentedControl>
            </div>
            <div className="mt-4 flex gap-3" aria-hidden="true">
              {(['light', 'dark'] as const).map((mode) => (
                <div
                  key={mode}
                  className="aspect-[4/3] w-full max-w-[200px] overflow-hidden rounded-xl border border-border"
                >
                  <ThemePreview preset={currentPreset} mode={mode} />
                </div>
              ))}
            </div>
          </div>

          {/* Account colour: the one every Oxy app wears. */}
          <div className="mt-10">
            <h3 className="text-sm font-medium text-foreground">Account color</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Your account color, shared by every Oxy app.
            </p>
            <div className="mt-3 max-w-xs">
              {isAuthenticated ? (
                <AccountColorSelect />
              ) : (
                <p className="text-sm text-muted-foreground">Sign in to choose your color.</p>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function AccountColorSelect() {
  const { colors, value, saveColor, saving } = useAccountColorSave();
  const items = COLOR_PRESET_REGISTRY.filter(({ name }) => colors.includes(name));

  return (
    <Select
      value={value}
      disabled={saving}
      onValueChange={(name) => {
        const item = items.find((item) => item.name === name);
        if (!item) return;
        saveColor(item.name).catch(() => toast.error('Could not save your color.'));
      }}
    >
      <SelectTrigger label="Account color">
        <SelectValue>
          {(selected) => {
            const key =
              typeof selected === 'object' && selected !== null && 'value' in selected
                ? selected.value
                : selected;
            return items.find((item) => item.name === key)?.displayName ?? String(key);
          }}
        </SelectValue>
        <SelectIcon />
      </SelectTrigger>
      <SelectContent
        label="Account color"
        items={items}
        valueExtractor={(item) => item.name}
        renderItem={(item) => (
          <SelectItem value={item.name} label={item.displayName}>
            <SelectItemIndicator />
            <SelectItemText>{item.displayName}</SelectItemText>
          </SelectItem>
        )}
      />
    </Select>
  );
}

/* ── Theme preview thumbnails ── */

function ThemePreview({ preset, mode }: { preset: AppColorName; mode: 'light' | 'dark' }) {
  const tokens = getPresetVars(preset, mode);
  return (
    <div
      className="flex h-full w-full flex-col p-2.5"
      style={{ backgroundColor: tokens['--background'] }}
    >
      <div
        className="flex items-center gap-1.5 rounded-md p-1.5 shadow-sm"
        style={{ backgroundColor: tokens['--card'] }}
      >
        <div className="h-1.5 w-6 rounded-full" style={{ backgroundColor: tokens['--primary'] }} />
        <div className="h-1.5 w-4 rounded-full" style={{ backgroundColor: tokens['--muted'] }} />
        <div
          className="ml-auto h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: tokens['--secondary'] }}
        />
      </div>
      <div className="mt-2 flex flex-1 gap-1.5">
        <div className="w-1/3 rounded-md p-1.5" style={{ backgroundColor: tokens['--surface'] }}>
          <div
            className="h-1 w-full rounded-full"
            style={{ backgroundColor: tokens['--muted-foreground'] }}
          />
          <div
            className="mt-1 h-1 w-3/4 rounded-full"
            style={{ backgroundColor: tokens['--border'] }}
          />
        </div>
        <div
          className="flex-1 rounded-md p-1.5 shadow-sm"
          style={{ backgroundColor: tokens['--card'] }}
        >
          <div
            className="h-1 w-3/4 rounded-full"
            style={{ backgroundColor: tokens['--foreground'] }}
          />
          <div
            className="mt-1 h-1 w-1/2 rounded-full"
            style={{ backgroundColor: tokens['--muted-foreground'] }}
          />
          <div
            className="mt-2 h-3 w-full rounded"
            style={{ backgroundColor: tokens['--primary-subtle'] }}
          />
        </div>
      </div>
    </div>
  );
}
