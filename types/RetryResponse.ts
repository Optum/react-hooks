import {FailedApiResponse, PendingApiResponse, SuccessfulApiResponse} from './ApiResponse';

export interface RetryProperties {
  retry: () => void;
  isMaxRetry: boolean;
}

export type PendingRetryResponse<T = unknown> = PendingApiResponse<T> & RetryProperties;

export type SuccessfulRetryResponse<T = unknown> = SuccessfulApiResponse<T> & RetryProperties;

export type FailedRetryResponse<T = unknown> = FailedApiResponse<T> & RetryProperties;

export type RetryResponse<T = unknown> = PendingRetryResponse<T> | SuccessfulRetryResponse<T> | FailedRetryResponse<T>;
