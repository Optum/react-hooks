import {useState, useMemo} from 'react';
import {renderHook, act, waitFor} from '@testing-library/react';
import {expect, describe} from '@jest/globals';

import {useLoadData} from './useLoadData';

const successResult = 'data';
const getSuccess = jest.fn(async () => Promise.resolve(successResult));
const getNull = jest.fn(async () => Promise.resolve(null));
const getFail = jest.fn(async () => Promise.reject(Error()));
const onComplete = jest.fn();
const getNonPromise = jest.fn(() => successResult);

const pendingResponse = {
  isInProgress: true,
  isError: false,
  result: undefined,
  error: undefined
};

const errorResponse = {
  isInProgress: false,
  isError: true,
  error: 'error',
  result: undefined
};

const successfulResponse = {
  isInProgress: false,
  isError: false,
  error: undefined,
  result: 'data'
};

const optionalDepWithError = {
  ...errorResponse,
  optional: true
};
const pendingOptionalDep = {
  ...pendingResponse,
  optional: true
};

describe('useLoadData', () => {
  it('should fetchData and set result when no data provided', async () => {
    const {result} = renderHook(() => useLoadData(getSuccess));
    expect(result.current.isInProgress).toBe(true);
    await waitFor(() => expect(result.current.isInProgress).toBe(false));
    expect(result.current.result).toBe(successResult);
  });

  it('should update to error response once fetchData fails', async () => {
    const {result} = renderHook(() => useLoadData(getFail));
    await waitFor(() => expect(result.current.isInProgress).toBe(false));
    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBeDefined();
  });

  it('should initiate to successful response when provided with data without invoking fetchData', () => {
    const {result} = renderHook(() => useLoadData(getSuccess, [], successResult));
    expect(result.current.result).toBe(successResult);
    expect(getSuccess).not.toHaveBeenCalled();
  });

  it('should update to error response when provided with error dep without invoking fetchData', async () => {
    const {result} = renderHook(() => useLoadData(getSuccess, [errorResponse]));
    await waitFor(() => expect(result.current.isInProgress).toBe(false));
    expect(result.current.isError).toBe(true);
    expect(getSuccess).not.toHaveBeenCalled();
  });

  it('should update to error response when dep updates to error', async () => {
    const {result} = renderHook(() => {
      const [dep, setDep] = useState<any>(pendingResponse);
      const loadedData = useLoadData(getSuccess, [dep]);
      return {loadedData, setDep};
    });
    await act(() => result.current.setDep(errorResponse));
    await waitFor(() => expect(result.current.loadedData.isInProgress).toBe(false));

    expect(result.current.loadedData.isError).toBe(true);
  });

  it('should invoke fetchData when dep are ready and update result with data', async () => {
    const {result} = renderHook(() => {
      const [dep, setDep] = useState<any>(pendingResponse);
      const loadedData = useLoadData(getSuccess, [dep]);

      return {loadedData, setDep};
    });
    await act(() => result.current.setDep({...successfulResponse, result: 'dep'}));

    expect(getSuccess).toHaveBeenCalledWith('dep');
    await waitFor(() => expect(result.current.loadedData.isInProgress).toBe(false));
    expect(result.current.loadedData.result).toBe('data');
  });

  it('should invoke fetchData when dep are not loaded responses', async () => {
    const {result} = renderHook(() => useLoadData(getSuccess, ['dep']));
    await waitFor(() => expect(result.current.isInProgress).toBe(false));
    expect(getSuccess).toHaveBeenCalledWith('dep');
  });

  it('should invoke fetchData when deps are regular and loaded responses', async () => {
    const loadedDep = {...successfulResponse, result: 'dep1'};
    const {result} = renderHook(() => useLoadData(getSuccess, [loadedDep, 'dep2']));
    await waitFor(() => expect(result.current.isInProgress).toBe(false));
    expect(getSuccess).toHaveBeenCalledWith('dep1', 'dep2');
  });

  it('should not invoke fetchData when deps are success and error response', async () => {
    const {result} = renderHook(() => useLoadData(getSuccess, [errorResponse, successfulResponse]));
    await waitFor(() => expect(result.current.isInProgress).toBe(false));
    expect(getSuccess).not.toHaveBeenCalled();
    expect(result.current.isError).toBe(true);
  });

  it('should call on onComplete when fetchData resolves with result', async () => {
    const {result} = renderHook(() => useLoadData(getSuccess, ['dep'], onComplete));
    await waitFor(() => expect(result.current.isInProgress).toBe(false));
    expect(result.current.result).toBe(successResult);
    expect(getSuccess).toHaveBeenCalledWith('dep');
    expect(onComplete).toHaveBeenCalledWith(undefined, successResult);
  });

  it('should call on onComplete when fetchData resolves with error', async () => {
    const {result} = renderHook(() => useLoadData(getFail, ['dep'], onComplete));
    await waitFor(() => expect(result.current.isInProgress).toBe(false));
    expect(result.current.isError).toBe(true);
    expect(onComplete).toHaveBeenCalledWith(Error());
  });

  it('should call on onComplete when data is provided', () => {
    const {result} = renderHook(() => useLoadData(getSuccess, ['dep'], onComplete, 'data'));
    expect(result.current.result).toBe(successResult);
    expect(getSuccess).not.toHaveBeenCalled();
    expect(onComplete).toHaveBeenCalledWith(undefined, successResult);
  });

  it('should not re-invoke fetchData when deps change', async () => {
    const {result} = renderHook(() => {
      const [dep, setDep] = useState<any>({...successfulResponse, result: 'dep1'});
      const loadedData = useLoadData(getSuccess, [dep], {fetchWhenDepsChange: false});

      return {loadedData, setDep};
    });
    await waitFor(() => expect(result.current.loadedData.isInProgress).toBe(false));
    expect(getSuccess).toHaveBeenCalledWith('dep1');
    await act(() => result.current.setDep({...successfulResponse, result: 'dep2'}));
    await waitFor(() => expect(result.current.loadedData.isInProgress).toBe(false));
    expect(getSuccess).toHaveBeenCalledTimes(1);
  });

  it('should  allow retry calls up to number of times described in config', async () => {
    const {result} = renderHook(() => useLoadData(getFail, {maxRetryCount: 1}));
    await waitFor(() => expect(result.current.isInProgress).toBe(false));
    expect(result.current.isError).toBe(true);
    await act(() => result.current.retry());
    await waitFor(() => expect(result.current.isInProgress).toBe(false));
    expect(result.current.isError).toBe(true);
    expect(getFail).toHaveBeenCalledTimes(2);
    expect(result.current.isMaxRetry).toBe(true);
  });

  it('should immediately invoke non-promise fetchData', () => {
    const {result} = renderHook(() => useLoadData(getNonPromise));
    expect(result.current.isInProgress).toBe(false);
    expect(result.current.result).toBe(successResult);
    expect(getNonPromise).toHaveBeenCalledTimes(1);
  });

  it('should should immediately invoke fetchData when it returns nonPromises when non loaded dependencies are provided', () => {
    const {result} = renderHook(() => useLoadData(getNonPromise, ['dep']));
    expect(result.current.isInProgress).toBe(false);
    expect(result.current.result).toBe(successResult);
    expect(getNonPromise).toHaveBeenCalledWith('dep');
  });

  it('should invoke non-promise fetchData when dep are ready and update result with data', async () => {
    const {result} = renderHook(() => {
      const [loadedDep, setLoadedDep] = useState<any>(pendingResponse);
      const loadedData = useLoadData(getNonPromise, [loadedDep]);
      return {loadedData, setLoadedDep};
    });
    expect(result.current.loadedData.isInProgress).toBe(true);
    expect(getNonPromise).toHaveBeenCalledTimes(0);
    await act(() => result.current.setLoadedDep({...successfulResponse, result: 'dep'}));
    await waitFor(() => expect(result.current.loadedData.isInProgress).toBe(false));
    expect(getNonPromise).toHaveBeenCalledTimes(1);
    expect(getNonPromise).toHaveBeenCalledWith('dep');
    expect(result.current.loadedData.result).toBe(successResult);
  });

  it('should update to error response when deps are errors with non-promise fetchData', async () => {
    const {result} = renderHook(() => {
      const [loadedDep, setLoadedDep] = useState<any>(pendingResponse);
      const loadedData = useLoadData(getNonPromise, [loadedDep]);
      return {loadedData, setLoadedDep};
    });
    expect(result.current.loadedData.isInProgress).toBe(true);
    expect(getNonPromise).toHaveBeenCalledTimes(0);
    await act(() => result.current.setLoadedDep(errorResponse));
    await waitFor(() => expect(result.current.loadedData.isInProgress).toBe(false));
    expect(getNonPromise).toHaveBeenCalledTimes(0);
    expect(result.current.loadedData.isError).toBe(true);
  });

  it('should immediately invoke non-promise fetchData when deps are ready', () => {
    const {result} = renderHook(() => useLoadData(getNonPromise, [{...successfulResponse, result: 'dep'}]));
    expect(result.current.isInProgress).toBe(false);
    expect(result.current.result).toBe(successResult);
    expect(getNonPromise).toHaveBeenCalledTimes(1);
    expect(getNonPromise).toHaveBeenCalledWith('dep');
  });

  it('should successfully retry when fetchData fails once', async () => {
    let resolveSuccessfully: () => void;
    const getFailThenSuccess = jest
      .fn()
      .mockImplementationOnce(async () => Promise.reject(Error()))
      .mockImplementationOnce(
        async () =>
          new Promise((resolve) => {
            resolveSuccessfully = () => resolve(successResult);
          })
      );

    const {result} = renderHook(() => useLoadData(getFailThenSuccess));

    await waitFor(() => expect(result.current.isInProgress).toBe(false));
    expect(result.current.isError).toBe(true);
    await act(() => result.current.retry());
    expect(result.current.isInProgress).toBe(true);
    await act(() => resolveSuccessfully());
    await waitFor(() => expect(result.current.isInProgress).toBe(false));
    expect(result.current.result).toBe(successResult);
    expect(getFailThenSuccess).toHaveBeenCalledTimes(2);
  });

  it('should successfully retry dep chain after root dep fails once', async () => {
    let resolveSuccessfully: () => void;
    const getFailThenSuccess = jest
      .fn()
      .mockImplementationOnce(async () => Promise.reject(Error()))
      .mockImplementationOnce(
        async () =>
          new Promise((resolve) => {
            resolveSuccessfully = () => resolve(successResult);
          })
      );

    const {result} = renderHook(() => {
      const loadedRoot = useLoadData(getFailThenSuccess);
      const loadedData = useLoadData(getSuccess, [loadedRoot]);

      return {loadedRoot, loadedData};
    });

    await waitFor(() => expect(result.current.loadedRoot.isInProgress).toBe(false));
    expect(result.current.loadedRoot.isError).toBe(true);
    await waitFor(() => expect(result.current.loadedData.isInProgress).toBe(false));
    expect(result.current.loadedData.isError).toBe(true);
    await act(() => {
      result.current.loadedRoot.retry();
      result.current.loadedData.retry();
    });
    expect(result.current.loadedRoot.isInProgress).toBe(true);
    expect(result.current.loadedData.isInProgress).toBe(true);
    await act(() => resolveSuccessfully());
    await waitFor(() => expect(result.current.loadedRoot.isInProgress).toBe(false));
    expect(result.current.loadedRoot.isError).toBe(false);
    expect(result.current.loadedRoot.result).toBe(successResult);
    await waitFor(() => expect(result.current.loadedData.isInProgress).toBe(false));
    expect(result.current.loadedData.isError).toBe(false);
    expect(result.current.loadedData.result).toBe(successResult);
    expect(getFailThenSuccess).toHaveBeenCalledTimes(2);
    expect(getSuccess).toHaveBeenCalledTimes(1);
  });

  it('should not re-invoke fetchData when is error and fetchWhenDepsChange is active', async () => {
    const {result} = renderHook(() => {
      const [dep, setDep] = useState<any>({...successfulResponse, result: 'dep1'});
      const loadedData = useLoadData(getFail, [dep], {fetchWhenDepsChange: true});

      return {loadedData, setDep};
    });
    await waitFor(() => expect(result.current.loadedData.isInProgress).toBe(false));
    expect(getFail).toHaveBeenCalledWith('dep1');
    await act(() => result.current.setDep({...successfulResponse, result: 'dep2'}));
    expect(getFail).toHaveBeenCalledTimes(1);
  });

  it('should invoke non-promise fetchData when optional dep is error', () => {
    const {result} = renderHook(() => useLoadData(getNonPromise, [optionalDepWithError]));
    expect(result.current.isInProgress).toBe(false);
    expect(result.current.result).toBe(successResult);
    expect(getNonPromise).toHaveBeenCalledWith(null);
  });

  it('should invoke fetchData when optional dep errors', async () => {
    const {result} = renderHook(() => {
      const [dep, setDep] = useState<any>(pendingOptionalDep);
      const loadedData = useLoadData(getSuccess, [dep]);

      return {loadedData, setDep};
    });
    expect(result.current.loadedData.isInProgress).toBe(true);
    await act(() => result.current.setDep(optionalDepWithError));

    await waitFor(() => expect(result.current.loadedData.isInProgress).toBe(false));
    expect(getSuccess).toHaveBeenCalledWith(null);
    expect(getSuccess).toHaveBeenCalledTimes(1);
  });

  it('should invoke fetchData with falsy result when optional dep errors', async () => {
    const {result} = renderHook(() => {
      const [dep, setDep] = useState<any>(pendingOptionalDep);
      const loadedData = useLoadData(getNull, [dep]);

      return {loadedData, setDep};
    });
    expect(result.current.loadedData.isInProgress).toBe(true);
    await act(() => result.current.setDep(optionalDepWithError));

    await waitFor(() => expect(result.current.loadedData.isInProgress).toBe(false));
    expect(getNull).toHaveBeenCalledWith(null);
    expect(getNull).toHaveBeenCalledTimes(1);
  });

  it('should retry failed dep when invoking retry', async () => {
    const mockRetry = jest.fn();
    const {result} = renderHook(() => {
      const retryResponse = useMemo(
        () => ({
          ...errorResponse,
          retry: mockRetry,
          isMaxRetry: false
        }),
        []
      );
      return useLoadData(getSuccess, [retryResponse]);
    });
    await waitFor(() => expect(result.current.isInProgress).toBe(false));
    expect(result.current.isError).toBe(true);
    expect(getSuccess).toHaveBeenCalledTimes(0);
    await act(() => result.current.retry());
    await waitFor(() => expect(result.current.isInProgress).toBe(false));
    expect(getSuccess).toHaveBeenCalledTimes(0);
    expect(mockRetry).toHaveBeenCalledTimes(1);
  });

  it('should not retry success dep when invoking retry', async () => {
    const mockRetry = jest.fn();
    const {result} = renderHook(() => {
      const retryResponse = useMemo(
        () => ({
          ...successfulResponse,
          retry: mockRetry,
          isMaxRetry: false
        }),
        []
      );
      return useLoadData(getFail, [retryResponse]);
    });
    await waitFor(() => expect(result.current.isInProgress).toBe(false));
    expect(result.current.isError).toBe(true);
    expect(getFail).toHaveBeenCalledTimes(1);
    await act(() => result.current.retry());
    await waitFor(() => expect(result.current.isInProgress).toBe(false));
    expect(getFail).toHaveBeenCalledTimes(2);
    expect(mockRetry).toHaveBeenCalledTimes(0);
  });

  it('should set isError to true if the fetch data function throws a non-promise exception', () => {
    const {result} = renderHook(() => {
      return useLoadData(() => {
        // eslint-disable-next-line @typescript-eslint/no-throw-literal
        throw 'immediate failure';
      });
    });

    expect(result.current.isInProgress).toBe(false);
    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBe('immediate failure');
  });
});
