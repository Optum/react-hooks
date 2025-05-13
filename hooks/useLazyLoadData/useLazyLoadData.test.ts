import {renderHook} from '@testing-library/react';
import {expect, describe} from '@jest/globals';

import {useLazyLoadData} from './useLazyLoadData';

const fetchData = jest.fn(async () => Promise.resolve('result'));
const fetchDep = jest.fn(async () => Promise.resolve('dep'));
const callback = jest.fn();

describe('useLazyLoadData', () => {
  it('should only invoke fetchData when returned function is invoked', async () => {
    const renderedHook = renderHook(() => useLazyLoadData(fetchData));
    const lazyFetchData = renderedHook.result.current;
    expect(fetchData).toHaveBeenCalledTimes(0);
    await lazyFetchData();
    expect(fetchData).toHaveBeenCalledTimes(1);
  });

  it('should invoke fetchData once when passed no args', async () => {
    const renderedHook = renderHook(() => useLazyLoadData(fetchData));
    const lazyFetchData = renderedHook.result.current;
    const res1 = await lazyFetchData();
    const res2 = await lazyFetchData();

    expect(res1).toBe('result');
    expect(res2).toBe('result');
    expect(fetchData).toHaveBeenCalledTimes(1);
  });

  it('should distribute the same promise to immediate subsequent calls', async () => {
    const renderedHook = renderHook(() => useLazyLoadData(fetchData));
    const lazyFetchData = renderedHook.result.current;

    const promise1 = lazyFetchData();
    const promise2 = lazyFetchData();

    const res1 = await promise1;
    const res2 = await promise2;

    expect(res1).toBe('result');
    expect(res2).toBe('result');

    expect(fetchData).toHaveBeenCalledTimes(1);
  });

  it('should return non-promise after having already resolved fetchData', async () => {
    const renderedHook = renderHook(() => useLazyLoadData(fetchData));
    const lazyFetchData = renderedHook.result.current;
    const promise1 = lazyFetchData();
    expect(promise1).toBeInstanceOf(Promise);
    await promise1;

    const res2 = lazyFetchData();
    expect(res2).not.toBeInstanceOf(Promise);
    expect(res2).toBe('result');
    expect(fetchData).toHaveBeenCalledTimes(1);
  });

  it('should re-invoke fetchData when cache is overridden', async () => {
    const renderedHook = renderHook(() => useLazyLoadData(fetchData));
    const lazyFetchData = renderedHook.result.current;
    const res1 = await lazyFetchData();
    const res2 = await lazyFetchData(true);

    expect(res1).toBe('result');
    expect(res2).toBe('result');
    expect(fetchData).toHaveBeenCalledTimes(2);
  });

  it('should not invoke fetchData when passed initialData', () => {
    const renderedHook = renderHook(() => useLazyLoadData(fetchData, [], 'cache'));
    const lazyFetchData = renderedHook.result.current;

    const res1 = lazyFetchData();
    expect(res1).not.toBeInstanceOf(Promise);
    expect(res1).toBe('cache');
    expect(fetchData).not.toHaveBeenCalled();
  });

  it('should pass result of dependency and args into fetchData', async () => {
    const renderedHook = renderHook(() => useLazyLoadData(fetchData, [fetchDep]));
    const lazyFetchData = renderedHook.result.current as any;

    await lazyFetchData(false, 'arg');
    expect(fetchDep).toHaveBeenCalledTimes(1);
    expect(fetchData).toHaveBeenCalledTimes(1);
    expect(fetchData).toHaveBeenCalledWith(['dep'], 'arg');
  });

  it('should re-invoke fetchData once for each time a different arg is passed', async () => {
    const renderedHook = renderHook(() => useLazyLoadData(fetchData, ((arg: any) => arg) as any));
    const lazyFetchData = renderedHook.result.current as any;
    const res1arg1 = await lazyFetchData(false, 'arg1');
    const res2arg1 = lazyFetchData(false, 'arg1');
    expect(res2arg1).not.toBeInstanceOf(Promise);
    expect(res1arg1).toBe('result');
    expect(fetchData).toHaveBeenCalledTimes(1);
    expect(fetchData).toHaveBeenCalledWith([], 'arg1');

    const res1arg2 = await lazyFetchData(false, 'arg2');
    const res2arg2 = lazyFetchData(false, 'arg2');

    expect(res2arg2).not.toBeInstanceOf(Promise);
    expect(res1arg2).toBe('result');
    expect(fetchData).toHaveBeenCalledTimes(2);
    expect(fetchData).toHaveBeenCalledWith([], 'arg2');

    const res3arg1 = lazyFetchData(false, 'arg1');
    expect(res3arg1).not.toBeInstanceOf(Promise);
    expect(fetchData).toHaveBeenCalledTimes(2);
  });

  it('should invoke callback with result data upon fetchData resolving', async () => {
    const renderedHook = renderHook(() => useLazyLoadData(fetchData, [], undefined, callback));
    const lazyFetchData = renderedHook.result.current as any;
    await lazyFetchData();

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('result');
  });

  it('should invoke callback with result data and provided args upon fetchData resolving', async () => {
    const renderedHook = renderHook(() => useLazyLoadData(fetchData, [], undefined, callback));
    const lazyFetchData = renderedHook.result.current as any;
    await lazyFetchData(false, 'arg1', 'arg2');

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('result', 'arg1', 'arg2');
  });

  it('should utilize provided cacheMap when applicable', async () => {
    const initialData = {
      arg1: 'res1',
      arg2: 'res2'
    };

    const renderedHook = renderHook(() =>
      useLazyLoadData(fetchData, ((arg: any) => arg) as any, [], initialData, callback)
    );
    const lazyFetchData = renderedHook.result.current as any;
    const res1 = lazyFetchData(false, 'arg1');
    const res2 = lazyFetchData(false, 'arg2');
    expect(res1).not.toBeInstanceOf(Promise);
    expect(res1).toBe('res1');

    expect(res2).not.toBeInstanceOf(Promise);
    expect(res2).toBe('res2');
    expect(fetchData).toHaveBeenCalledTimes(0);

    const res3 = lazyFetchData(false, 'arg3');
    expect(res3).toBeInstanceOf(Promise);

    await expect(res3).resolves.toBe('result');

    const cachedRes3 = lazyFetchData(false, 'arg3');
    expect(cachedRes3).not.toBeInstanceOf(Promise);
    expect(cachedRes3).toBe('result');
    expect(fetchData).toHaveBeenCalledTimes(1);
  });

  it('should not reuse error promises', async () => {
    const getFailThenSuccess = jest
      .fn()
      .mockImplementationOnce(async () => Promise.reject(Error()))
      .mockImplementationOnce(async () => Promise.resolve('result'));

    const renderedHook = renderHook(() => useLazyLoadData(getFailThenSuccess));
    const lazyFetchData = renderedHook.result.current as any;

    let result;

    try {
      result = await lazyFetchData();
    } catch (error) {
      result = 'error';
    }

    expect(result).toBe('error');
    expect(getFailThenSuccess).toHaveBeenCalledTimes(1);

    result = await lazyFetchData();

    expect(result).toBe('result');
    expect(getFailThenSuccess).toHaveBeenCalledTimes(2);
  });

  it('should invoke callback any time returned data changes', async () => {
    const renderedHook = renderHook(() => useLazyLoadData(fetchData, [], 'data', callback));
    const lazyFetchData = renderedHook.result.current as any;
    await lazyFetchData();

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('data');

    lazyFetchData();
    expect(callback).toHaveBeenCalledTimes(1);

    await lazyFetchData(true);
    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenCalledWith('result');

    lazyFetchData();
    expect(callback).toHaveBeenCalledTimes(2);
  });
});
