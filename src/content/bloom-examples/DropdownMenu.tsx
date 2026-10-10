import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '@oxy.so/bloom/dropdown-menu';
import { Button } from '@oxy.so/bloom/button';

export default function DropdownMenuExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Open menu</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <div className="p-4">Your workspace actions</div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
