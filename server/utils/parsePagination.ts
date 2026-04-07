export function parsePagination(
  page: unknown,
  limit: unknown,
  maxLimit = 50,
): { pageNum: number; limitNum: number; skip: number } {
  const pageNum = Math.max(1, parseInt(String(page), 10) || 1)
  const limitNum = Math.min(maxLimit, Math.max(1, parseInt(String(limit), 10) || 20))
  return { pageNum, limitNum, skip: (pageNum - 1) * limitNum }
}
