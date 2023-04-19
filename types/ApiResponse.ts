export interface ApiResponseBase<T> {
  isInProgress: boolean;
  isError: boolean;
  error?: unknown;
  result?: T;
}

export interface PendingApiResponse<T> extends ApiResponseBase<T> {
  isInProgress: true;
  isError: false;
  error: undefined;
  result: undefined;
}

export interface SuccessfulApiResponse<T> extends ApiResponseBase<T> {
  isInProgress: false;
  isError: false;
  error: undefined;
  result: T;
}

export interface FailedApiResponse<T> extends ApiResponseBase<T> {
  isInProgress: false;
  isError: true;
  error: unknown;
  result: undefined;
}

export type ApiResponse<T> = PendingApiResponse<T> | SuccessfulApiResponse<T> | FailedApiResponse<T>;
