import {useEffect, useState, useMemo} from 'react';
import {ApiResponse, RetryResponse, ApiResponseBase, OptionalDependency, DependencyBase, Promisable} from '../../types';

import {FetchData, NotUndefined} from './types';

function isApiResponseBase(arg: any): arg is ApiResponseBase<unknown> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const keys = Object.keys(arg || {});

  return keys.includes('isInProgress') && keys.includes('isError') && keys.includes('result') && keys.includes('error');
}

function isDependencyBase(arg: any): arg is DependencyBase<unknown> {
  return isApiResponseBase(arg);
}

function isRetryResponse(arg: any): arg is RetryResponse {
  return isApiResponseBase(arg) && Object.keys(arg).includes('retry') && Object.keys(arg).includes('isMaxRetry');
}

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

/*
  isPromise determines a promise by checking whether or not it is an instanceof 
  native promise (preferred) or whether it has a then method.
*/
function isPromise<T>(promisable: Promisable<T>): promisable is Promise<T> {
  return (
    promisable instanceof Promise ||
    (promisable && typeof promisable === 'object' && 'then' in promisable && typeof promisable.then === 'function')
  );
}

export interface LoadDataConfig {
  fetchWhenDepsChange?: boolean;
  maxRetryCount?: number;
}

interface NormalizedLoadDataArgs<T extends NotUndefined, Deps extends any[]> {
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

function isOptionalDependency(arg: any): arg is OptionalDependency {
  return isDependencyBase(arg) && !!arg.optional;
}

function correctOptionalDependencies<Deps extends any[]>(args?: readonly [...Deps]) {
  return (args || []).map((arg: unknown) => {
    if (isOptionalDependency(arg) && arg.isError) {
      return {
        isInProgress: false,
        isError: false,
        error: undefined,
        result: null
      };
    }
    return arg;
  });
}

function checkArgsAreLoaded<Deps extends any[]>(args?: readonly [...Deps]) {
  return (args || [])
    .map((arg: unknown) => {
      if (isApiResponseBase(arg)) {
        return !(arg.isInProgress || arg.isError);
      }
      return true;
    })
    .reduce((prev, curr) => prev && curr, true);
}

function normalizeArgumentOverloads<T extends NotUndefined, Deps extends any[]>(
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

export function useLoadData<T extends NotUndefined, Deps extends any[]>(
  fetchData: FetchData<T, Deps>,
  config?: LoadDataConfig
): RetryResponse<T>;

export function useLoadData<T extends NotUndefined, Deps extends any[]>(
  fetchData: FetchData<T, Deps>,
  fetchDataArgs: readonly [...Deps],
  config?: LoadDataConfig
): RetryResponse<T>;

export function useLoadData<T extends NotUndefined, Deps extends any[]>(
  fetchData: FetchData<T, Deps>,
  fetchDataArgs: readonly [...Deps],
  onComplete: (err: unknown, res?: T) => void,
  config?: LoadDataConfig
): RetryResponse<T>;

export function useLoadData<T extends NotUndefined, Deps extends any[]>(
  fetchData: FetchData<T, Deps>,
  fetchDataArgs: readonly [...Deps],
  data?: T,
  config?: LoadDataConfig
): RetryResponse<T>;

export function useLoadData<T extends NotUndefined, Deps extends any[]>(
  fetchData: FetchData<T, Deps>,
  fetchDataArgs: readonly [...Deps],
  onComplete: (err: unknown, res?: T) => void,
  data?: T,
  config?: LoadDataConfig
): RetryResponse<T>;

export function useLoadData<T extends NotUndefined, Deps extends any[]>(
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

  // eslint-disable-next-line @typescript-eslint/promise-function-async
  const initialPromise = useMemo(() => {
    const correctedArgs = correctOptionalDependencies(fetchDataArgs);
    // initialPromise should NOT be defined in the following scenarios:
    // 1. data is passed, in which case fetchData should never be invoked
    // 2. dependencies are not ready initially, so we cannot proceed with calling fetchData
    // 3. we are attempting to retry calling fetchData, and we do not want initialPromise to interfere
    //    with re-invoking fetchData
    // 4. we are attempting to refetch data due to dependencies changing, and we do not want initialPromise
    //    to interfere with re-invoking fetchData
    if (!data && counter < 1 && checkArgsAreLoaded(correctedArgs) && !localFetchWhenDepsChange) {
      try {
        return {
          res: fetchData(...((correctedArgs.map(unboxApiResponse) || []) as Parameters<typeof fetchData>)),
          error: undefined
        };
      } catch (e) {
        return {
          res: undefined,
          error: e
        };
      }
    } else {
      return {res: undefined, error: undefined};
    }
  }, [counter, localFetchWhenDepsChange]);

  const initialPromiseRes = initialPromise.res;
  const nonPromiseResult = isPromise(initialPromiseRes) ? undefined : initialPromiseRes;
  const initialData = data || nonPromiseResult;

  // Initialize our pending data to one of three possible states:
  // 1. If initial data was supplied or if the fetchData function returned a non-Promise value,
  //    then our initial state will be already "resolved" (not in-progress and not error, we already have the result)
  // 2. If initial data was not supplied and fetchData returned a Promise, then our initial state is in-progress
  // 3. If initial data was not supplied and fetchData threw a *synchronous* (non-Promise) exception,
  //    then our initial state is "rejected" (not in-progress and already has an error value)
  const initialDataResolved =
    initialData &&
    ({
      isInProgress: false,
      isError: false,
      result: initialData,
      error: undefined
    } as const);
  const initialDataRejected =
    initialPromise.error !== undefined &&
    ({
      isInProgress: false,
      isError: true,
      result: undefined,
      error: initialPromise.error
    } as const);
  const initialDataPending = {
    isInProgress: true,
    isError: false,
    result: undefined,
    error: undefined
  } as const;

  const [pendingData, setPendingData] = useState<ApiResponse<T>>(
    initialDataResolved || initialDataRejected || initialDataPending
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
    fetchDataArgs?.forEach((arg: unknown) => {
      if (isRetryResponse(arg) && arg.isError && !arg.isMaxRetry) {
        arg.retry();
      }
    });
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
        const correctedArgs = correctOptionalDependencies(fetchDataArgs);
        const unboxedArgs = correctedArgs.map(unboxApiResponse);

        const fetchedData =
          initialPromise.res === undefined
            ? await fetchData(...((unboxedArgs || []) as Parameters<typeof fetchData>))
            : await initialPromise.res;

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
    const correctedArgs = correctOptionalDependencies(fetchDataArgs);
    const argsAreLoaded = checkArgsAreLoaded(correctedArgs);

    const argsHaveErrors = (correctedArgs || [])
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
