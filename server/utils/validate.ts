import { z } from 'zod'

/**
 * Thrown by {@link validate} when an input fails a zod schema.
 * Carries the raw zod issues so the error handler can serialize them.
 */
export class ValidationError extends Error {
  public readonly issues: z.ZodIssue[]

  constructor(issues: z.ZodIssue[], message = 'Validation failed') {
    super(message)
    this.name = 'ValidationError'
    this.issues = issues
  }
}

/**
 * Parse untrusted data against a zod schema. Returns the fully typed,
 * validated value on success. Throws a {@link ValidationError} carrying
 * the structured issues on failure — the express error-handling middleware
 * in `server/index.ts` catches it and returns an HTTP 400.
 */
export function validate<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data)
  if (!result.success) {
    throw new ValidationError(result.error.issues)
  }
  return result.data
}
