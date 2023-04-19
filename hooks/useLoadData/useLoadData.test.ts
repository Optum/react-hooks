import {useState} from 'react';
import {renderHook, act} from '@testing-library/react-hooks';
import {expect, describe} from '@jest/globals';

import {useLoadData} from './useLoadData';

const successResult = 'data';
const getSuccess = jest.fn(async () => Promise.resolve(successResult));
const getFail = jest.fn(async () => Promise.reject(Error()));
const onComplete = jest.fn();

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

const successfuResponse = {
  isInProgress: false,
  isError: false,
  error: undefined,
  result: 'data'
};

describe('useLoadData', () => {
  it('should fetchData and set result when no data provided', async () => {
    const {result, waitFor} = renderHook(() => useLoadData(getSuccess));
    expect(result.current.isInProgress).toBe(true);
    await waitFor(() => result.current.isInProgress === false);
    expect(result.current.result).toBe(successResult);
  });

  it('should update to error response once fetchData fails', async () => {
    const {result, waitFor} = renderHook(() => useLoadData(getFail));
    await waitFor(() => result.current.isInProgress === false);
    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBeDefined();
  });

  it('should initate to successful respone when provided with data without invoking fetchData', () => {
    const {result} = renderHook(() => useLoadData(getSuccess, [], successResult));
    expect(result.current.result).toBe(successResult);
    expect(getSuccess).not.toHaveBeenCalled();
  });

  it('should update to error response when provided with error dep without invoking fetchData', async () => {
    const {result, waitFor} = renderHook(() => useLoadData(getSuccess, [errorResponse]));
    await waitFor(() => result.current.isInProgress === false);
    expect(result.current.isError).toBe(true);
    expect(getSuccess).not.toHaveBeenCalled();
  });

  it('should update to error response when dep updates to error', async () => {
    const {result, waitFor} = renderHook(() => {
      const [dep, setDep] = useState<any>(pendingResponse);
      const loadedData = useLoadData(getSuccess, [dep]);
      return {loadedData, setDep};
    });
    act(() => result.current.setDep(errorResponse));
    await waitFor(() => result.current.loadedData.isInProgress === false);

    expect(result.current.loadedData.isError).toBe(true);
  });

  it('should invoke fetchData when dep are ready and update result with data', async () => {
    const {result, waitFor} = renderHook(() => {
      const [dep, setDep] = useState<any>(pendingResponse);
      const loadedData = useLoadData(getSuccess, [dep]);

      return {loadedData, setDep};
    });
    act(() => result.current.setDep({...successfuResponse, result: 'dep'}));

    expect(getSuccess).toHaveBeenCalledWith('dep');
    await waitFor(() => result.current.loadedData.isInProgress === false);
    expect(result.current.loadedData.result).toBe('data');
  });

  it('should invoke fetchData when dep are not loaded responses', async () => {
    const {result, waitFor} = renderHook(() => useLoadData(getSuccess, ['dep']));
    await waitFor(() => result.current.isInProgress === false);
    expect(getSuccess).toHaveBeenCalledWith('dep');
  });

  it('should invoke fetchData when deps are regular and loaded responses', async () => {
    const loadedDep = {...successfuResponse, result: 'dep1'};
    const {result, waitFor} = renderHook(() => useLoadData(getSuccess, [loadedDep, 'dep2']));
    await waitFor(() => result.current.isInProgress === false);
    expect(getSuccess).toHaveBeenCalledWith('dep1', 'dep2');
  });

  it('should not invoke fetchData when deps are success and error response', async () => {
    const {result, waitFor} = renderHook(() => useLoadData(getSuccess, [errorResponse, successfuResponse]));
    await waitFor(() => result.current.isInProgress === false);
    expect(getSuccess).not.toHaveBeenCalled();
    expect(result.current.isError).toBe(true);
  });

  it('should call on onComplete when fetchData resolves with result', async () => {
    const {result, waitFor} = renderHook(() => useLoadData(getSuccess, ['dep'], onComplete));
    await waitFor(() => result.current.isInProgress === false);
    expect(result.current.result).toBe(successResult);
    expect(getSuccess).toHaveBeenCalledWith('dep');
    expect(onComplete).toHaveBeenCalledWith(undefined, successResult);
  });

  it('should call on onComplete when fetchData resolves with error', async () => {
    const {result, waitFor} = renderHook(() => useLoadData(getFail, ['dep'], onComplete));
    await waitFor(() => result.current.isInProgress === false);
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
    const {result, waitFor} = renderHook(() => {
      const [dep, setDep] = useState<any>({...successfuResponse, result: 'dep1'});
      const loadedData = useLoadData(getSuccess, [dep], {fetchWhenDepsChange: false});

      return {loadedData, setDep};
    });
    await waitFor(() => result.current.loadedData.isInProgress === false);
    expect(getSuccess).toHaveBeenCalledWith('dep1');
    act(() => result.current.setDep({...successfuResponse, result: 'dep2'}));
    await waitFor(() => result.current.loadedData.isInProgress === false);
    expect(getSuccess).toHaveBeenCalledTimes(1);
  });

  it('should  allow retry calls up to number of times described in config', async () => {
    const {result, waitFor} = renderHook(() => useLoadData(getFail, {maxRetryCount: 1}));
    await waitFor(() => result.current.isInProgress === false);
    expect(result.current.isError).toBe(true);
    act(() => result.current.retry());
    await waitFor(() => result.current.isInProgress === false);
    expect(result.current.isError).toBe(true);
    expect(getFail).toHaveBeenCalledTimes(2);
    expect(result.current.isMaxRetry).toBe(true);
  });
});
