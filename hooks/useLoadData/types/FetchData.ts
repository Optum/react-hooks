import {Promisable} from '../../../types';

import {UnboxApiResponse} from './UnboxApiResponse';
import {NotUndefined} from './NotUndefined';

export type FetchData<T extends NotUndefined, Deps extends any[]> = (
  ...args: readonly [...UnboxApiResponse<Deps>]
) => Promisable<T>;
