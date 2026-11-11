import { QUERY_NAMES } from '#s/constants';
import type { BaseValue, ToEnum } from '#s/types';

const NON_EMPTY_STRING_LEN = 0;
const HEX_ENCODING = 16;
const START_CHAR = 0;
export function isNonEmptyString(value: unknown): value is string {
  return (
    typeof value === 'string' && value.trim().length > NON_EMPTY_STRING_LEN
  );
}

export function isNumber(
  arg: unknown,
  predicate?: (value: number) => boolean,
): arg is number {
  if (typeof arg !== 'number' || Number.isNaN(arg) || !Number.isFinite(arg)) {
    return false;
  }

  return predicate ? predicate(arg) : true;
}

export function isBaseValue(arg: unknown): arg is BaseValue {
  return !(
    typeof arg !== 'boolean' &&
    !isNumber(arg) &&
    !isNonEmptyString(arg)
  );
}

export function typeName(arg?: unknown): string {
  if (Array.isArray(arg)) {
    return 'Array';
  }
  if (arg === null) {
    return 'null';
  }
  if (Number.isNaN(arg)) {
    return 'NaN';
  }
  return typeof arg;
}

/**
 * Docs [#link](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent#description)
 */
export function encodeSearchParam(str: string) {
  return encodeURIComponent(str)
    .replaceAll(
      /[!'\(\)*]/gv,
      (char) =>
        `%${char.codePointAt(START_CHAR)?.toString(HEX_ENCODING).toUpperCase()}`,
    )
    .replaceAll('%20', '+');
}

export function decodeSearchParam(str: string) {
  try {
    return decodeURIComponent(str.replaceAll('+', '%20'));
  } catch (error: unknown) {
    console.error(
      `    [ParamsL5]: Malformed URL. ${error instanceof URIError ? error.message : error}`,
    );
    return str.replaceAll('+', ' ');
  }
}

export function isArray(value: unknown): value is readonly unknown[] {
  return Array.isArray(value);
}

export type TQueryKeys = ToEnum<typeof QUERY_NAMES>;
export type TParamsStrings = Record<TQueryKeys, string | undefined>;
export function assertQueryKey(val: unknown): val is TQueryKeys {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return Object.values(QUERY_NAMES).includes(val as TQueryKeys);
}

export function toParams(arg: Partial<TParamsStrings>): string {
  const params = new URLSearchParams();

  Object.keys(arg)
    .toSorted()
    .forEach((key) => {
      if (!assertQueryKey(key)) {
        return;
      }
      const val = arg[key];
      if (val) {
        params.append(key, val);
      }
    });

  return params.toString();
}
