export function error<T>(onError?: (error: unknown) => void) {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  return (err?: unknown, res?: T) => {
    if (err) {
      onError?.(err);
    }
  };
}
