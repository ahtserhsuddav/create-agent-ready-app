import { getErrorMessage, getErrorStatus } from '#/shared/error/messages'
import type { ErrorCode, ErrorResponse } from '#/shared/error/types'

// Throw an AppError for any expected failure (not signed in, not found, already exists…). Its status comes from its
// code, and details maps field names to messages so forms can show them next to the fields.
/** @public */
export class AppError extends Error {
  readonly code: ErrorCode
  readonly status: number
  readonly details?: Record<string, string>

  constructor(code: ErrorCode, message = getErrorMessage(code), details?: Record<string, string>) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.status = getErrorStatus(code)
    this.details = details
  }

  toResponse(): ErrorResponse {
    return {
      success: false,
      status: this.status,
      code: this.code,
      message: this.message,
      details: this.details,
    }
  }
}
