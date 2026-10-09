import { useState } from 'react'
import { Pagination } from '@oxy.so/bloom/pagination'

export default function PaginationExample() {
  const [page,setPage]=useState(1)
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <Pagination page={page} totalPages={8} onChange={setPage} />
    </div>
  )
}
