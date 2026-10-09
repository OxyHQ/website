import { Item } from '@oxy.so/bloom/item'

export default function ItemExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <Item title="Project update" subtitle="Your latest changes are ready." />
    </div>
  )
}
