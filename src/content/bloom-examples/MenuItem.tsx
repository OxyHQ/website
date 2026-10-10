import { MenuItemRow } from '@oxy.so/bloom/menu-item';

export default function MenuItemExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <MenuItemRow name="Garden bowl" price="$12.50" />
    </div>
  );
}
