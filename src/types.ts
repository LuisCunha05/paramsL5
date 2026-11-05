export type BaseValue = string | number | boolean;

export interface ILogger {
  info: (...args: readonly unknown[]) => void;
  warn: (...args: readonly unknown[]) => void;
  error: (...args: readonly unknown[]) => void;
}

export type Keys<TObj> = Extract<keyof TObj, string>;
export type NonObject =
  | readonly unknown[]
  | Date
  // oxlint-disable-next-line typescript/ban-types typescript/no-unsafe-function-type
  | Function
  | Blob
  | FormData
  | File;

export type Path<
  TSource,
  TKeys extends Keys<TSource> = Keys<TSource>,
> = TSource extends object
  ? TKeys extends string
    ? TSource[TKeys] extends NonObject
      ? TKeys
      : TSource[TKeys] extends object
        ? `${TKeys}.${Path<TSource[TKeys]>}`
        : TKeys
    : never
  : never;
