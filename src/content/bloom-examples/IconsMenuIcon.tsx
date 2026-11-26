import { Button } from '@oxy.so/bloom/button';
import { MenuIcon } from '@oxy.so/bloom/icons/MenuIcon';

export default function IconsMenuIconExample() {
  return (
    <div className="flex w-full max-w-lg items-center gap-4 text-foreground">
      <Button iconOnly leadingIcon={MenuIcon} accessibilityLabel="Open menu" />
      <MenuIcon size={40} />
    </div>
  );
}
