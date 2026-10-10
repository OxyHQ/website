import { Announcement } from '@oxy.so/bloom/announcement';

export default function AnnouncementExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <Announcement
        title="A little more room to create"
        description="Explore what is new in your workspace."
      />
    </div>
  );
}
