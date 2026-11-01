// Every expected failure has a code. The API returns the same ErrorResponse shape for all of them, so the UI can
// handle every error the same way (src/shared/lib/tanstack/query-client.ts).
export type ErrorCode =
  | 'VALIDATION'
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'UNSUPPORTED_MEDIA_TYPE'
  | 'RATE_LIMITED'
  | 'SERVER_ERROR'

export type ErrorResponse = {
  success: false
  status: number
  code: ErrorCode
  message: string
  // field name → message, for forms
  details?: Record<string, string>
}
