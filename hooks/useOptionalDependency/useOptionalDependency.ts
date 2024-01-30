import {useMemo} from 'react';
import {ApiResponse, OptionalDependency} from '../../types';

export function useOptionalDependency<T>(dep: ApiResponse<T>): OptionalDependency<T> {
  return useMemo(() => ({...dep, optional: true}), [dep]);
}
