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
          [TKey in Keys<TSource>]: TUnwrapField<TSource[TKey]> extends NonObject
            ? TKey
            : TUnwrapField<TSource[TKey]> extends object
              ?
                  | TKey
                  // oxlint-disable-next-line no-magic-numbers
                  | `${TKey}.${TPath<TUnwrapField<TSource[TKey]>, [...TDepth, 1]>}`
              : TKey;
        }[Keys<TSource>]
      : never;

type TElementType<TType> = TType extends readonly (infer TInt)[]
  ? TElementType<TInt>
  : TType;

type TUnwrapField<TType> = Exclude<TElementType<TType>, null | undefined>;

export type TPathPipe<TSource> = TSource extends NonObject
  ? never
  : TSource extends object
    ? {
        [TKeys in Keys<TSource>]: TUnwrapField<TSource[TKeys]> extends Date
          ? TKeys
          : TUnwrapField<TSource[TKeys]> extends NonObject
            ? never
            : TUnwrapField<TSource[TKeys]> extends object
              ?
                  | TKeys
                  | `${TKeys}|${Keys<TUnwrapField<TSource[TKeys]>>}`
                  | `${TKeys}:${string}|${Keys<TUnwrapField<TSource[TKeys]>>}`
              : TKeys;
      }[Keys<TSource>]
    : never;

export type TPathValue<
  TSource,
  TPathKey extends string,
> = TPathKey extends `${infer THead}.${infer TRest}`
  ? THead extends keyof Exclude<TSource, null | undefined>
    ? TPathValue<TElementType<Exclude<TSource, null | undefined>[THead]>, TRest>
    : never
  : TPathKey extends keyof Exclude<TSource, null | undefined>
    ? Exclude<TSource, null | undefined>[TPathKey]
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

type TNonNeverKeys<TObj> = {
  [TKey in keyof TObj]: [TObj[TKey]] extends [never] ? never : TKey;
}[keyof TObj];

export type OnlyOneKey<TObj> = {
  [Keep in TNonNeverKeys<TObj>]: Record<Keep, TObj[Keep]> &
    Partial<
      Record<Exclude<keyof TObj, Keep>, 'Error: Max one search type per key'>
    >;
}[TNonNeverKeys<TObj>];
