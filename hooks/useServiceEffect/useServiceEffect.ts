import {useEffect} from 'react';
import {Promisable} from '../../types';

export function useServiceEffect<T>(
  isPending: boolean,
  service: () => Promisable<T>,
  onServiceCallResolved?: (response: T) => void,
  onServiceCallRejected?: (error: unknown) => void,
  onInitiateServiceCall?: () => void,
  dependencies: unknown[] = []
) {
  useEffect(() => {
    async function callService() {
      onInitiateServiceCall?.();

      try {
        const response = await service();
        onServiceCallResolved?.(response);
      } catch (error: unknown) {
        onServiceCallRejected?.(error);
      }
    }

    if (isPending) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      callService();
    }
  }, [isPending, ...dependencies]);
}
