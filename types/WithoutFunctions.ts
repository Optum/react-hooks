type Exception = Array<any> | Date;

export type WithoutFunctions<T> = {
  // eslint-disable-next-line @typescript-eslint/ban-types
  [K in keyof T as T[K] extends Function ? (T[K] extends Exception ? K : never) : K]: T[K] extends
    | Record<string, any>
    | undefined
    ? T[K] extends Exception | undefined
      ? T[K]
      : WithoutFunctions<T[K]>
    : T[K];
};
