export function complete<T>(onSuccess?: (data: T) => void, onError?: (error: unknown) => void) {
  return (err?: unknown, res?: T) => {
    if (err) {
      onError?.(err);
    } else if (res) {
      onSuccess?.(res);
    }
  };
}
