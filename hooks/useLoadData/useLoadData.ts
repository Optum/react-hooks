import {useEffect, useState, useMemo} from 'react';
import {ApiResponse, ApiResponseBase, RetryResponse} from '../../types';

function isApiResponseBase(arg: any): arg is ApiResponseBase<unknown> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const keys = Object.keys(arg || {});

  return keys.includes('isInProgress') && keys.includes('isError') && keys.includes('result') && keys.includes('error');
}

type UnboxApiResponse<F extends any[]> = {
  [P in keyof F]: F[P] extends ApiResponseBase<any> ? NonNullable<F[P]['result']> : F[P];
};

function unboxApiResponse<T>(arg: ApiResponse<T> | T): T {
  if (isApiResponseBase(arg)) {
    if (!arg.isInProgress && !arg.isError) {
      return arg.result;
    } else {
      throw new Error('API response was not finished loading');
    }
  } else {
    return arg;
  }
}
type FetchData<T, Deps extends any[]> = (...args: readonly [...UnboxApiResponse<Deps>]) => Promise<T>;

interface LoadDataConfig {
  fetchWhenDepsChange?: boolean;
  maxRetryCount?: number;
}

interface NormalizedLoadDataArgs<T, Deps extends any[]> {
  config?: LoadDataConfig;
  fetchDataArgs?: readonly [...Deps];
  data?: T;
  onComplete?: (err: unknown, res?: T) => void;
}

function isConfig(arg: any): arg is LoadDataConfig {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const keys = Object.keys(arg || {});

  return keys.includes('fetchWhenDepsChange') || keys.includes('maxRetryCount') || keys.includes('data');
}

function normalizeArgumentOverloads<T, Deps extends any[]>(
  arg2?: unknown,
  arg3?: unknown,
  arg4?: unknown,
  arg5?: unknown
): NormalizedLoadDataArgs<T, Deps> {
  const args: NormalizedLoadDataArgs<T, Deps> = {};

  if (isConfig(arg2)) {
    args['config'] = arg2;
  } else if (Array.isArray(arg2)) {
    args['fetchDataArgs'] = arg2 as Deps;
  }

  if (isConfig(arg3)) {
    args['config'] = arg3;
  } else if (typeof arg3 === 'function') {
    args['onComplete'] = arg3 as (err: unknown, res?: T) => void;
  } else {
    args['data'] = arg3 as T;
  }

  if (isConfig(arg4)) {
    args['config'] = arg4;
  } else if (!args['data']) {
    args['data'] = arg4 as T;
  }

  if (isConfig(arg5)) {
    args['config'] = arg5;
  }

  return args;
}

export function useLoadData<T, Deps extends any[]>(
  fetchData: FetchData<T, Deps>,
  config?: LoadDataConfig
): RetryResponse<T>;

export function useLoadData<T, Deps extends any[]>(
  fetchData: FetchData<T, Deps>,
  fetchDataArgs: readonly [...Deps],
  config?: LoadDataConfig
): RetryResponse<T>;

export function useLoadData<T, Deps extends any[]>(
  fetchData: FetchData<T, Deps>,
  fetchDataArgs: readonly [...Deps],
  onComplete: (err: unknown, res?: T) => void,
  config?: LoadDataConfig
): RetryResponse<T>;

export function useLoadData<T, Deps extends any[]>(
  fetchData: FetchData<T, Deps>,
  fetchDataArgs: readonly [...Deps],
  data?: T,
  config?: LoadDataConfig
): RetryResponse<T>;

export function useLoadData<T, Deps extends any[]>(
  fetchData: FetchData<T, Deps>,
  fetchDataArgs: readonly [...Deps],
  onComplete: (err: unknown, res?: T) => void,
  data?: T,
  config?: LoadDataConfig
): RetryResponse<T>;

export function useLoadData<T, Deps extends any[]>(
  fetchData: FetchData<T, Deps>,
  arg2?: unknown,
  arg3?: unknown,
  arg4?: unknown,
  arg5?: unknown
) {
  const {fetchDataArgs, onComplete, config, data} = normalizeArgumentOverloads<T, Deps>(arg2, arg3, arg4, arg5);
  const {maxRetryCount = 2, fetchWhenDepsChange = false} = config || {};

  const [counter, setCounter] = useState(0);
  const [localFetchWhenDepsChange, setLocalFetchWhenDepsChange] = useState(false);

  const [pendingData, setPendingData] = useState<ApiResponse<T>>(
    data
      ? {
          isInProgress: false,
          isError: false,
          result: data,
          error: undefined
        }
      : {
          isInProgress: true,
          isError: false,
          result: undefined,
          error: undefined
        }
  );

  function retry() {
    if (counter < maxRetryCount) {
      setPendingData({
        isInProgress: true,
        isError: false,
        result: undefined,
        error: undefined
      });
      setCounter((prevCount) => prevCount + 1);
    }
  }

  useEffect(() => {
    if (data) {
      onComplete?.(undefined, data);
    }
  }, []);

  useEffect(() => {
    async function loadData() {
      setPendingData({
        isInProgress: true,
        isError: false,
        error: undefined,
        result: undefined
      });
      try {
        const unboxedArgs = fetchDataArgs?.map(unboxApiResponse);
        const fetchedData = await fetchData(...((unboxedArgs || []) as Parameters<typeof fetchData>));

        setPendingData({
          isInProgress: false,
          isError: false,
          error: undefined,
          result: fetchedData
        });

        onComplete?.(undefined, fetchedData);
      } catch (error) {
        setPendingData({
          isInProgress: false,
          isError: true,
          error,
          result: undefined
        });
        onComplete?.(error);
      }
    }

    const argsAreLoaded = (fetchDataArgs || [])
      .map((arg: unknown) => {
        if (isApiResponseBase(arg)) {
          return !(arg.isInProgress || arg.isError);
        }
        return true;
      })
      .reduce((prev, curr) => prev && curr, true);

    const argsHaveErrors = (fetchDataArgs || [])
      .map((arg: unknown) => {
        if (isApiResponseBase(arg)) {
          return arg.isError;
        }
        return false;
      })
      .reduce((prev, curr) => prev || curr, false);

    if (argsHaveErrors) {
      setPendingData({
        isInProgress: false,
        result: undefined,
        isError: true,
        error: undefined
      });
    } else if ((!pendingData.result || localFetchWhenDepsChange) && !pendingData.isError && argsAreLoaded) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      loadData();
    }
    setLocalFetchWhenDepsChange(fetchWhenDepsChange);
  }, [...(fetchDataArgs || []), counter]);

  return useMemo(() => {
    return {...pendingData, retry, isMaxRetry: counter > maxRetryCount - 1};
  }, [pendingData, counter]);
}
