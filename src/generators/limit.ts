import { QUERY_LABELS, QUERY_NAMES } from '#/constants';
import { defaultLogger } from '#/logger';
import { msgMustBePositiveInteger, msgNoValue } from '#/messages';
import type { TLogger } from '#/types';
import { isNumber, typeName } from '#/utils';

export type TLimit = number;

export interface TLimitOptions {
  logger?: TLogger;
  defaultValue?: TLimit;
}

export interface TLimitResult {
  [QUERY_NAMES.LMT]: string | undefined;
}

const EMPTY_RESULT = {
  [QUERY_NAMES.LMT]: undefined,
} as const;

const MIN_LIMIT = 0;

/**
 * Formats the pagination limit (records per page) into a query parameter string.
 *
 * @remarks
 * Fields are validated: `null`, `undefined`, and invalid shapes/types (negative numbers, decimals, non-numeric values) are filtered out safely.
 *
 * @param arg - Number of records to return (integer >= 0).
 * @param options - Optional settings including `defaultValue` and custom logger.
 * @returns An object `{ limit }` containing the string representation of the limit, or `undefined` if invalid.
 *
 * @example
 * ```typescript
 * limit(15); // => { limit: "15" }
 * ```
 */
export function limit(arg?: TLimit, options: TLimitOptions = {}): TLimitResult {
  const log = options.logger ?? defaultLogger;
  const val = arg ?? options.defaultValue;
  if (val === undefined) {
    log?.info(msgNoValue(QUERY_LABELS.LMT));
    return EMPTY_RESULT;
  }

  if (!isInputValid(val)) {
    log?.error(msgMustBePositiveInteger(QUERY_LABELS.LMT, typeName(val), true));
    return EMPTY_RESULT;
  }

  return {
    [QUERY_NAMES.LMT]: String(val),
  };
}

function predicate(value: number) {
  return Number.isInteger(value) && value >= MIN_LIMIT;
}

function isInputValid(arg?: number): arg is number {
  return isNumber(arg, predicate);
}
