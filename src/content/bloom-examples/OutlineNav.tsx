import { OutlineNav } from '@oxy.so/bloom/outline-nav';

export default function OutlineNavExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <OutlineNav
        headings={[
          { id: 'overview', label: 'Overview', level: 2 },
          { id: 'usage', label: 'Usage', level: 2 },
          { id: 'props', label: 'Props', level: 2 },
        ]}
      />
    </div>
  );
}
