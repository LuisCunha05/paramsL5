import { QUERY_NAMES } from '#/constants';
import type { TBaseValue, TLogger, ToEnum, TResult } from '#/types';

import { ParamsL5ValidationError } from './errors/ParamsL5ValidationError';
import {
  msgMustBeString,
  msgNoRemaining,
  msgNotArray,
  msgNoValues,
} from './messages';

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

export function isBaseValue(arg: unknown): arg is TBaseValue {
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
export function assertQueryKey(val: string): val is TQueryKeys {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const kind = val as TQueryKeys;
  switch (kind) {
    case QUERY_NAMES.FLT:
    case QUERY_NAMES.INC:
    case QUERY_NAMES.LMT:
    case QUERY_NAMES.OBY:
    case QUERY_NAMES.PAG:
    case QUERY_NAMES.SBY:
    case QUERY_NAMES.SFI:
    case QUERY_NAMES.SJO:
    case QUERY_NAMES.SRC:
    case QUERY_NAMES.WTC:
    case QUERY_NAMES.WTH: {
      return true;
    }

    default: {
      kind satisfies never;
      return false;
    }
  }
}

export function unwrap<TType>(result: TResult<TType>): TType {
  if (!result.success) {
    throw result.error;
  }
  return result.data;
}

export function filterWithDelimeter<TLabel extends TQueryKeys>(
  label: TLabel,
  delimiter: ':' | ';' | ',',
  value?: unknown,
  logger?: TLogger,
): TResult<Record<TLabel, string | undefined>> {
  const log = logger;
  if (!isArray(value)) {
    const message = msgNotArray(label, typeName(value));
    log?.error(message);
    return {
      error: ParamsL5ValidationError.fromField(label, message, value),
      success: false,
    };
  }

  if (!value.length) {
    const message = msgNoValues(label);
    log?.info(message);
    return {
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion
      data: { [label]: undefined } as Record<TLabel, undefined>,
      success: true,
    };
  }

  const filteredValues = value.filter((item) => {
    if (!isNonEmptyString(item)) {
      log?.info(msgMustBeString(label, typeName(item)));
      return false;
    }
    return true;
  });

  if (!filteredValues.length) {
    const message = msgNoRemaining(label);
    log?.info(message);
    return {
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion
      data: { [label]: undefined } as Record<TLabel, undefined>,
      success: true,
    };
  }

  const uniqueValues = [...new Set(filteredValues)];

  if (!uniqueValues.length) {
    return {
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion
      data: { [label]: undefined } as Record<TLabel, undefined>,
      success: true,
    };
  }

  return {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    data: {
      [label]: uniqueValues.join(delimiter),
    } as Record<TLabel, string>,
    success: true,
  };
}
