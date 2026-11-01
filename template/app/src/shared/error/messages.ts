import type { ErrorCode } from '#/shared/error/types'

// The default message and HTTP status for each error code. An AppError can pass a more specific message.
const errors: Record<ErrorCode, { status: number; message: string }> = {
  VALIDATION: { status: 422, message: 'Please check the highlighted fields.' },
  BAD_REQUEST: { status: 400, message: 'We could not read that request. Please check the data format.' },
  UNAUTHORIZED: { status: 401, message: 'Please sign in to continue.' },
  FORBIDDEN: { status: 403, message: 'You do not have permission to do that.' },
  NOT_FOUND: { status: 404, message: 'We could not find what you were looking for.' },
  CONFLICT: { status: 409, message: 'This record already exists.' },
  UNSUPPORTED_MEDIA_TYPE: { status: 415, message: 'That file type is not supported.' },
  RATE_LIMITED: { status: 429, message: 'Too many requests. Please wait a moment.' },
  SERVER_ERROR: { status: 500, message: 'Something went wrong on our side. Please try again later.' },
}

export const getErrorMessage = (code: ErrorCode) => errors[code].message
export const getErrorStatus = (code: ErrorCode) => errors[code].status
