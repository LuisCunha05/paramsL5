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
        ? TKeys | `${TKeys}.${Path<TSource[TKeys]>}`
        : TKeys
    : never
  : never;

export type NoDuplicates<
  TTuple extends readonly unknown[],
  TSeen = never,
> = TTuple extends readonly [infer THead, ...infer TTail]
  ? THead extends TSeen
    ? [
        `Error: Duplicate path '${Extract<THead, string | number>}'`,
        ...NoDuplicates<TTail, TSeen>,
      ]
    : [THead, ...NoDuplicates<TTail, TSeen | THead>]
  : [];

export type NoDuplicateKeys<
  TTuple extends readonly unknown[],
  TSeen = never,
> = TTuple extends readonly [infer THead, ...infer TTail]
  ? THead extends readonly [infer TKey, ...unknown[]]
    ? TKey extends TSeen
      ? [
          `Error: Duplicate key '${Extract<TKey, string | number>}'`,
          ...NoDuplicateKeys<TTail, TSeen>,
        ]
      : [THead, ...NoDuplicateKeys<TTail, TSeen | TKey>]
    : [THead, ...NoDuplicateKeys<TTail, TSeen>]
  : [];

export type ValidateFlatArray<T> = T extends readonly unknown[]
  ? readonly [...NoDuplicates<T>] extends T
    ? T
    : NoDuplicates<T>
  : T;

export type ValidateKeyTupleArray<T> = T extends readonly unknown[]
  ? readonly [...NoDuplicateKeys<T>] extends T
    ? T
    : NoDuplicateKeys<T>
  : T;

export function uniquePaths<TShape>() {
  return <const TPaths extends readonly Path<TShape>[]>(
    paths: readonly [...NoDuplicates<TPaths>] extends TPaths
      ? TPaths
      : NoDuplicates<TPaths>,
  ): TPaths =>
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    paths as unknown as TPaths;
}
