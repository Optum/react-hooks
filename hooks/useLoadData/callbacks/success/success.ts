export function success<T>(onSuccess?: (data: T) => void) {
  return (err?: unknown, res?: T) => {
    if (res) {
      onSuccess?.(res);
    }
  };
}
