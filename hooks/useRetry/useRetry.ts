import {RetryResponse} from '../../types';

export function useRetry(...apis: RetryResponse[]) {
  function retry() {
    apis.forEach((api) => {
      if (api.isError && !api.isMaxRetry) {
        api.retry();
      }
    });
  }

  return {
    retry,
    isMaxRetry: apis.reduce((soFar, api) => soFar || api.isMaxRetry, false)
  };
}
