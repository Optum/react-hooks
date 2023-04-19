export function useCommonContext<T>(...contextHooks: (() => T)[]): T {
  const context = contextHooks.reduce((prev, useContext) => {
    try {
      return useContext();
    } catch {
      return prev;
    }
  }, undefined as T | undefined);

  if (!context) {
    throw new Error('contexts not available');
  }

  return context;
}
