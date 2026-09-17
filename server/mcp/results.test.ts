import { describe, expect, test } from 'bun:test'
import { z } from 'zod'
import { classifyError, ok, toolError, ToolError } from './results.js'
import { DomainError } from '../utils/domainError.js'

describe('tool results', () => {
  test('an object result is also structured content; an array is text only', () => {
    expect(ok({ a: 1 }).structuredContent).toEqual({ a: 1 })
    expect(ok([1, 2]).structuredContent).toBeUndefined()
  })

  test('an unexpected error never leaks its message, SQL or stack', () => {
    const logged: unknown[] = []
    const failure = Object.assign(new Error('Failed query: select * from secrets where token = $1\nparams: abc'), { stack: 'Error\n    at /srv/app/server/mcp.ts:10:5' })
    const body = classifyError(failure, (_ref, error) => logged.push(error))
    expect(body.error.code).toBe('internal_error')
    expect(body.error.retryable).toBe(true)
    expect(JSON.stringify(body)).not.toMatch(/select|secrets|mcp\.ts|params/)
    expect(body.error.reference).toMatch(/^[0-9a-f-]{36}$/)
    expect(logged).toEqual([failure])
  })

  test('a wrapped unique violation is a conflict', () => {
    const wrapped = Object.assign(new Error('Failed query: insert …'), { cause: { code: '23505', constraint_name: 'jobs_slug_unique' } })
    expect(classifyError(wrapped).error.code).toBe('conflict')
  })

  test('domain, tool and validation errors keep their safe messages and codes', () => {
    expect(classifyError(new DomainError('too_large', 'Too big')).error).toMatchObject({ code: 'request_too_large', message: 'Too big', retryable: false })
    expect(classifyError(new ToolError('not_found', 'Post not found')).error.code).toBe('not_found')
    const parsed = z.object({ n: z.number() }).safeParse({ n: 'x' })
    const validation = classifyError(parsed.error).error
    expect(validation.code).toBe('invalid_request')
    expect(validation.details).toEqual({ issues: [{ path: 'n', message: expect.any(String) }] })
  })

  test('an error result is flagged isError and carries the code in text and structure', () => {
    const result = toolError(new ToolError('conflict', 'Taken'))
    expect(result.isError).toBe(true)
    expect(result.content[0].text.startsWith('conflict: Taken')).toBe(true)
    expect((result.structuredContent as { error: { code: string } }).error.code).toBe('conflict')
  })
})
