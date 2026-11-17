import type { ParamsL5ValidationError } from '#/errors/ParamsL5ValidationError';

import type { CONDITIONS } from './constants';

export type TBaseValue = string | number | boolean;

export type ToEnum<TObj> = TObj[keyof TObj];

export type TResult<TReturn, TError = ParamsL5ValidationError> =
  | { readonly success: true; readonly data: TReturn }
  | { readonly success: false; readonly error: TError };

export interface TGenerator<TValue, TOptions, TReturn> {
  safe: (value?: TValue, options?: TOptions) => TResult<TReturn>;
  build: (value?: TValue, options?: TOptions) => TReturn;
}

export interface TLogger {
  info: (...args: readonly unknown[]) => void;
  warn: (...args: readonly unknown[]) => void;
  error: (...args: readonly unknown[]) => void;
}

export type Keys<TObj> = Extract<keyof TObj, string>;
export type NonObject =
  | Date
  // oxlint-disable-next-line typescript/ban-types typescript/no-unsafe-function-type
  | Function
  | Blob
  | FormData
  | File;

export type TPath<
  TSource,
  TDepth extends unknown[] = [],
  // oxlint-disable-next-line no-magic-numbers
> = TDepth['length'] extends 5
  ? never
  : TSource extends NonObject
    ? never
    : TSource extends object
      ? {
          [TKey in Keys<TSource>]: TElementType<TSource[TKey]> extends NonObject
            ? TKey
            : TElementType<TSource[TKey]> extends object
              ?
                  | TKey
                  // oxlint-disable-next-line no-magic-numbers
                  | `${TKey}.${TPath<TElementType<TSource[TKey]>, [...TDepth, 1]>}`
              : TKey;
        }[Keys<TSource>]
      : never;

type TElementType<TType> = TType extends readonly (infer TInt)[]
  ? TElementType<TInt>
  : TType;

export type TPathPipe<TSource> = TSource extends NonObject
  ? never
  : TSource extends object
    ? {
        [TKeys in Keys<TSource>]: TElementType<TSource[TKeys]> extends NonObject
          ? never
          : TElementType<TSource[TKeys]> extends object
            ?
                | TKeys
                | `${TKeys}|${Keys<TElementType<TSource[TKeys]>>}`
                | `${TKeys}:${string}|${Keys<TElementType<TSource[TKeys]>>}`
            : TKeys;
      }[Keys<TSource>]
    : never;

export type TNoDuplicates<
  TTuple extends readonly unknown[],
  TSeen = never,
> = TTuple extends readonly [infer THead, ...infer TTail]
  ? THead extends TSeen
    ? [
        `Error: Duplicate path '${Extract<THead, string | number>}'`,
        ...TNoDuplicates<TTail, TSeen>,
      ]
    : [THead, ...TNoDuplicates<TTail, TSeen | THead>]
  : [];

export type TNoDuplicateKeys<
  TTuple extends readonly unknown[],
  TSeen = never,
> = TTuple extends readonly [infer THead, ...infer TTail]
  ? THead extends readonly [infer TKey, ...unknown[]]
    ? TKey extends TSeen
      ? [
          `Error: Duplicate key '${Extract<TKey, string | number>}'`,
          ...TNoDuplicateKeys<TTail, TSeen>,
        ]
      : [THead, ...TNoDuplicateKeys<TTail, TSeen | TKey>]
    : [THead, ...TNoDuplicateKeys<TTail, TSeen>]
  : [];

export type TValidateFlatArray<TArray> = TArray extends readonly unknown[]
  ? readonly [...TNoDuplicates<TArray>] extends TArray
    ? TArray
    : TNoDuplicates<TArray>
  : TArray;

export type TValidateKeyTupleArray<TArray> = TArray extends readonly unknown[]
  ? readonly [...TNoDuplicateKeys<TArray>] extends TArray
    ? TArray
    : TNoDuplicateKeys<TArray>
  : TArray;

export type TConditionObj = typeof CONDITIONS;
export type TConditionKeys = keyof TConditionObj;

export type OnlyOneKey<TObj> = {
  [Keep in keyof TObj]: Record<Keep, TObj[Keep]> &
    Partial<
      Record<Exclude<keyof TObj, Keep>, 'Erro: Max one search type per key'>
    >;
}[keyof TObj];
