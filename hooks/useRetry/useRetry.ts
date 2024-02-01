import {useState, useEffect} from 'react';
import {RetryResponse} from '../../types';

import {useLoadData as useOriginalLoadData, NotUndefined, FetchData} from '../useLoadData';

export function useRetry(...apis: RetryResponse[]) {
  const [retryCount, setRetryCount] = useState(0);
  const [isMaxRetry, setIsMaxRetry] = useState(false);

  function retry() {
    setRetryCount(retryCount + 1);
    apis.forEach((api) => {
      if (api.isError && !api.isMaxRetry) {
        api.retry();
      }
    });
  }

  const useLoadData: typeof useOriginalLoadData = <T extends NotUndefined, Deps extends any[]>(
    ...args: [FetchData<T, Deps>, ...any[]]
  ) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const loadedData = useOriginalLoadData<T, Deps>(...args);
    useEffect(() => {
      if (loadedData.isError && !loadedData.isMaxRetry) {
        loadedData.retry();
      }
    }, [retryCount]);

    useEffect(() => {
      if (loadedData.isMaxRetry) {
        setIsMaxRetry(true);
      }
    }, [loadedData]);

    return loadedData;
  };

  return {
    retry,
    isMaxRetry: apis.some((api) => api.isMaxRetry) || isMaxRetry,
    useLoadData
  };
}
