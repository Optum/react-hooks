import {useRetry} from './useRetry';

describe('useRetry', () => {
  const mockPassedRetry = jest.fn();
  const mockFailedRetry = jest.fn();
  const mockMaxFailedRetry = jest.fn();

  it('should retry all failed apis', () => {
    const passedApi = {retry: mockPassedRetry, isError: false, isInProgress: false};
    const failedApi = {retry: mockFailedRetry, isError: true, isInProgress: false};

    const res = useRetry(passedApi as any, failedApi as any);

    res.retry();

    expect(mockPassedRetry).not.toHaveBeenCalled();
    expect(mockFailedRetry).toHaveBeenCalled();
  });

  it('should handle max retry scenario properly', () => {
    const failedApi = {retry: mockFailedRetry, isError: true, isMaxRetry: false};
    const maxRetriedfailedApi = {retry: mockMaxFailedRetry, isError: true, isMaxRetry: true};

    const res = useRetry(failedApi as any, maxRetriedfailedApi as any);

    res.retry();

    expect(mockFailedRetry).toHaveBeenCalled();
    expect(mockMaxFailedRetry).not.toHaveBeenCalled();
    expect(res.isMaxRetry).toBeTruthy();
  });
});
