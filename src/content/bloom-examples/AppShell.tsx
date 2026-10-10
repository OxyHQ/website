import { AppShellHeader } from '@oxy.so/bloom/app-shell';

export default function AppShellExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <AppShellHeader title="Your workspace" showMenu />
    </div>
  );
}
