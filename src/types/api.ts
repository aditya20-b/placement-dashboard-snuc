export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "VALIDATION_ERROR"
  | "SHEETS_ERROR"
  | "CACHE_ERROR"
  | "INTERNAL_ERROR";

export interface ApiResponse<T> {
  success: true;
  data: T;
  cached?: boolean;
  timestamp: string;
}

export interface ApiError {
  success: false;
  error: {
    code: ApiErrorCode;
    message: string;
  };
}
