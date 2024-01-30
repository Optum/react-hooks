import {ApiResponseBase} from '../../types';

export type UnboxApiResponse<F extends any[]> = {
  [P in keyof F]: F[P] extends ApiResponseBase<any> ? Exclude<F[P]['result'], undefined> : F[P];
};
