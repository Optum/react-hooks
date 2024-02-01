import {renderHook, act, waitFor} from '@testing-library/react';
import {expect, describe} from '@jest/globals';

import {useRetry} from './useRetry';

describe('useRetry', () => {
  const mockPassedRetry = jest.fn();
  const mockFailedRetry = jest.fn();
  const mockMaxFailedRetry = jest.fn();

  it('should retry all failed apis', () => {
    const passedApi = {retry: mockPassedRetry, isError: false, isInProgress: false};
    const failedApi = {retry: mockFailedRetry, isError: true, isInProgress: false};

    const {result} = renderHook(() => useRetry(passedApi as any, failedApi as any));

    result.current.retry();

    expect(mockPassedRetry).not.toHaveBeenCalled();
    expect(mockFailedRetry).toHaveBeenCalled();
  });

  it('should handle max retry scenario properly', () => {
    const failedApi = {retry: mockFailedRetry, isError: true, isMaxRetry: false};
    const maxRetriedFailedApi = {retry: mockMaxFailedRetry, isError: true, isMaxRetry: true};

    const {result} = renderHook(() => useRetry(failedApi as any, maxRetriedFailedApi as any));
    result.current.retry();

    expect(mockFailedRetry).toHaveBeenCalled();
    expect(mockMaxFailedRetry).not.toHaveBeenCalled();
    expect(result.current.isMaxRetry).toBeTruthy();
  });

  it('should retry all instances of returned useLoadData', async () => {
    const getFailA = jest.fn(async () => Promise.reject(Error()));
    const getFailB = jest.fn(async () => Promise.reject(Error()));

    const {result} = renderHook(() => {
      const {useLoadData, retry} = useRetry();

      const loadedA = useLoadData(getFailA);
      const loadedB = useLoadData(getFailB);
      return {loadedA, loadedB, retry};
    });

    await waitFor(() => {
      expect(result.current.loadedA.isInProgress).toBe(false);
      expect(result.current.loadedB.isInProgress).toBe(false);
    });

    expect(result.current.loadedA.isError).toBe(true);
    expect(result.current.loadedB.isError).toBe(true);

    expect(getFailA).toHaveBeenCalledTimes(1);
    expect(getFailB).toHaveBeenCalledTimes(1);

    await act(() => result.current.retry());
    await waitFor(() => {
      expect(result.current.loadedA.isInProgress).toBe(false);
      expect(result.current.loadedB.isInProgress).toBe(false);
    });

    expect(result.current.loadedA.isError).toBe(true);
    expect(result.current.loadedB.isError).toBe(true);

    expect(getFailA).toHaveBeenCalledTimes(2);
    expect(getFailB).toHaveBeenCalledTimes(2);
  });

  it('should not continue retrying successfully retried deps', async () => {
    const getFailA = jest.fn(async () => Promise.reject(Error()));
    const getFailB = jest
      .fn()
      .mockImplementationOnce(async () => Promise.reject(Error()))
      .mockImplementationOnce(
        async () =>
          new Promise((resolve) => {
            resolve('data');
          })
      );

    const {result} = renderHook(() => {
      const {useLoadData, retry} = useRetry();

      const loadedA = useLoadData(getFailA);
      const loadedB = useLoadData(getFailB);
      return {loadedA, loadedB, retry};
    });

    await waitFor(() => {
      expect(result.current.loadedA.isInProgress).toBe(false);
      expect(result.current.loadedB.isInProgress).toBe(false);
    });

    expect(result.current.loadedA.isError).toBe(true);
    expect(result.current.loadedB.isError).toBe(true);

    expect(getFailA).toHaveBeenCalledTimes(1);
    expect(getFailB).toHaveBeenCalledTimes(1);

    await act(() => result.current.retry());
    await waitFor(() => {
      expect(result.current.loadedA.isInProgress).toBe(false);
      expect(result.current.loadedB.isInProgress).toBe(false);
    });

    expect(result.current.loadedA.isError).toBe(true);
    expect(result.current.loadedB.isError).toBe(false);
    expect(result.current.loadedB.result).toBe('data');

    expect(getFailA).toHaveBeenCalledTimes(2);
    expect(getFailB).toHaveBeenCalledTimes(2);

    await act(() => result.current.retry());

    await waitFor(() => {
      expect(result.current.loadedA.isInProgress).toBe(false);
    });

    expect(result.current.loadedA.isError).toBe(true);
    expect(getFailA).toHaveBeenCalledTimes(3);
    expect(getFailB).toHaveBeenCalledTimes(2);
  });

  it('should only retry number of times until any loadedObject is max retry', async () => {
    const getFailA = jest.fn(async () => Promise.reject(Error()));
    const getFailB = jest
      .fn()
      .mockImplementationOnce(async () => Promise.reject(Error()))
      .mockImplementationOnce(
        async () =>
          new Promise((resolve) => {
            resolve('data');
          })
      );

    const {result} = renderHook(() => {
      const {useLoadData, retry, isMaxRetry} = useRetry();

      const loadedA = useLoadData(getFailA, {maxRetryCount: 1});
      const loadedB = useLoadData(getFailB);
      return {loadedA, loadedB, retry, isMaxRetry};
    });

    await waitFor(() => {
      expect(result.current.loadedA.isInProgress).toBe(false);
      expect(result.current.loadedB.isInProgress).toBe(false);
    });

    expect(result.current.loadedA.isError).toBe(true);
    expect(result.current.loadedB.isError).toBe(true);

    expect(getFailA).toHaveBeenCalledTimes(1);
    expect(getFailB).toHaveBeenCalledTimes(1);

    await act(() => result.current.retry());
    await waitFor(() => {
      expect(result.current.loadedA.isInProgress).toBe(false);
      expect(result.current.loadedB.isInProgress).toBe(false);
    });
    expect(getFailA).toHaveBeenCalledTimes(2);
    expect(getFailB).toHaveBeenCalledTimes(2);
    expect(result.current.isMaxRetry).toBe(true);
  });
});
