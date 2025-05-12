import {Promisable} from '@optum/react-hooks';
import {useRef} from 'react';

type InvokedDeps<T extends any[]> = {
  // eslint-disable-next-line @typescript-eslint/ban-types
  [K in keyof T]: T[K] extends Function ? ReturnType<T[K]> : T[K];
};
type ResolvedDeps<T extends any[]> = {
  // eslint-disable-next-line @typescript-eslint/ban-types
  [K in keyof T]: T[K] extends Function ? Awaited<ReturnType<T[K]>> : T[K];
};

type ExcludeFirst<T extends any[]> = T extends [any, ...infer Rest] ? Rest : never;

interface NormalizeArgumentWithArgs<FetchData extends (...args: any[]) => Promisable<any>, T, Deps extends any[]> {
  getCacheKey: (...args: ExcludeFirst<Parameters<FetchData>>) => string;
  deps?: readonly [...Deps];
  initialDataMap?: Record<string, T | undefined>;
  callback?: (data: T, ...args: ExcludeFirst<Parameters<FetchData>>) => void;
  initialData: undefined;
}

interface NormalizeArgumentWithoutArgs<T, Deps extends any[]> {
  deps?: readonly [...Deps];
  initialData?: T;
  callback?: (data: T) => void;
  getCacheKey: undefined;
  initialDataMap: undefined;
}

type NormalizeArgumentOverloads<FetchData extends (...args: any[]) => Promisable<any>, T, Deps extends any[]> =
  | NormalizeArgumentWithArgs<FetchData, T, Deps>
  | NormalizeArgumentWithoutArgs<T, Deps>;

function normalizeArgumentOverloads<FetchData extends (...args: any[]) => Promisable<any>, T, Deps extends any[]>(
  arg2?: unknown,
  arg3?: unknown,
  arg4?: unknown,
  arg5?: unknown
): NormalizeArgumentOverloads<FetchData, T, Deps> {
  if (typeof arg2 === 'function') {
    return {
      getCacheKey: arg2,
      deps: arg3,
      initialDataMap: arg4,
      callback: arg5
    } as NormalizeArgumentWithArgs<FetchData, T, Deps>;
  }

  return {
    deps: arg2,
    initialData: arg3,
    callback: arg4
  } as NormalizeArgumentWithoutArgs<T, Deps>;
}

// first overload for NO args
export function useLazyLoadData<T, Deps extends any[]>(
  fetchData: (deps: readonly [...ResolvedDeps<Deps>]) => Promisable<T>,
  deps?: readonly [...Deps],
  initialData?: T,
  callback?: (data: T) => void
): (disableCache?: boolean) => Promisable<T>;

// second overload WITH args
export function useLazyLoadData<Args extends any[], T, Deps extends any[]>(
  fetchData: (deps: readonly [...ResolvedDeps<Deps>], ...args: readonly [...Args]) => Promisable<T>,
  getCacheKey: (...args: ExcludeFirst<Parameters<typeof fetchData>>) => string,
  deps?: readonly [...Deps],
  initialData?: Record<string, T | undefined>,
  callback?: (data: T, ...args: ExcludeFirst<Parameters<typeof fetchData>>) => void
): (disableCache?: boolean, ...args: readonly [...Args]) => Promisable<T>;

export function useLazyLoadData<Args extends any[], T, Deps extends any[]>(
  fetchData: (deps: readonly [...ResolvedDeps<Deps>], ...args: readonly [...Args]) => Promisable<T>,
  arg2?: unknown,
  arg3?: unknown,
  arg4?: unknown,
  arg5?: unknown
): (disableCache?: boolean, ...args: readonly [...Args]) => Promisable<T> {
  const {
    deps,
    callback,
    getCacheKey = () => 'default',
    initialData,
    initialDataMap
  } = normalizeArgumentOverloads<typeof fetchData, T, Deps>(arg2, arg3, arg4, arg5);
  /*
    Tracks whether data yielded from set of args as already been returned.
    Used to determine whether or not initialData needs to be passed into callback
  */
  const returnIndicators = useRef<Record<string, boolean>>({});
  const cache = useRef<Record<string, T | undefined>>(initialDataMap || {default: initialData});
  const promiseSingleton = useRef<Record<string, Promisable<T>>>({});
  // eslint-disable-next-line @typescript-eslint/promise-function-async
  return (disableCache = false, ...args) => {
    const key = getCacheKey(...(args as unknown as ExcludeFirst<Parameters<typeof fetchData>>));
    const cachedData = cache.current[key];
    const relevantPromise = promiseSingleton.current[key];
    const invokeCallback = !returnIndicators.current[key];
    returnIndicators.current[key] = true;

    async function handleFetchData() {
      const promisedDeps = deps?.map((dep: unknown) => {
        return typeof dep === 'function' ? (dep() as unknown) : dep;
      }) as InvokedDeps<Deps>;

      const promisedData = Promise.all(promisedDeps || []).then(async (resolvedDeps) => {
        return fetchData(resolvedDeps, ...args);
      });
      promiseSingleton.current[key] = promisedData;
      let data: T | undefined;
      try {
        data = await promisedData;
      } catch (error) {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete promiseSingleton.current[key];
        throw error;
      }
      cache.current[key] = data;
      callback?.(data, ...(args as unknown as ExcludeFirst<Parameters<typeof fetchData>>));
      return data;
    }

    if (disableCache) {
      return handleFetchData();
    }
    if (cachedData !== undefined && invokeCallback) {
      callback?.(cachedData, ...(args as unknown as ExcludeFirst<Parameters<typeof fetchData>>));
      return cachedData;
    }
    if (cachedData !== undefined) {
      return cachedData;
    }
    if (relevantPromise) {
      return relevantPromise;
    }

    return handleFetchData();
  };
}
