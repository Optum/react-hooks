export interface DependencyBase<T> {
  isInProgress: boolean;
  isError: boolean;
  error?: unknown;
  result?: T | null;
  optional?: boolean;
}
export interface PendingOptionalDependency<T> extends DependencyBase<T> {
  isInProgress: true;
  isError: false;
  error: undefined;
  result: undefined;
  optional: true;
}

export interface SuccessfulOptionalDependency<T> extends DependencyBase<T> {
  isInProgress: false;
  isError: false;
  error: undefined;
  result: T | null;
  optional: true;
}

export interface FailedOptionalDependency<T> extends DependencyBase<T> {
  isInProgress: false;
  isError: true;
  error: unknown;
  result: undefined;
  optional: true;
}

export type OptionalDependency<T = unknown> =
  | PendingOptionalDependency<T>
  | SuccessfulOptionalDependency<T>
  | FailedOptionalDependency<T>;

export interface PendingRequiredDependency<T> extends DependencyBase<T> {
  isInProgress: true;
  isError: false;
  error: undefined;
  result: undefined;
  optional?: false;
}

export interface SuccessfulRequiredDependency<T> extends DependencyBase<T> {
  isInProgress: false;
  isError: false;
  error: undefined;
  result: T;
  optional?: false;
}

export interface FailedRequiredDependency<T> extends DependencyBase<T> {
  isInProgress: false;
  isError: true;
  error: unknown;
  result: undefined;
  optional?: false;
}

export type RequiredDependency<T = unknown> =
  | PendingRequiredDependency<T>
  | SuccessfulRequiredDependency<T>
  | FailedRequiredDependency<T>;

export type Dependency<T = unknown> = OptionalDependency<T> | RequiredDependency<T>;
