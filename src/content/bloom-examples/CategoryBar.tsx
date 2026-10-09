import { useState } from 'react'
import { RiAddLine } from '@oxy.so/bloom/icons/RiAddLine'
import { CategoryBar } from '@oxy.so/bloom/category-bar'

export default function CategoryBarExample() {
  const [value,setValue]=useState("all")
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <CategoryBar accessibilityLabel="Browse categories" items={[{key:"all",label:"All",icon:RiAddLine},{key:"design",label:"Design",icon:RiAddLine},{key:"music",label:"Music",icon:RiAddLine}]} value={value} onValueChange={setValue} />
    </div>
  )
}
