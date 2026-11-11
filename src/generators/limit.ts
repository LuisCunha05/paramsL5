import { QUERY_LABELS } from '#/constants';
import { defaultLogger } from '#/logger';
import { msgMustBePositiveInteger, msgNoValue } from '#/messages';
import type { TLogger } from '#/types';
import { isNumber, typeName } from '#/utils';

export type TLimit = number;

export interface TLimitOptions {
  logger?: TLogger;
  defaultValue?: TLimit;
}

const MIN_LIMIT = 0;

/**
 * Formats the pagination limit (records per page) into a query parameter string.
 *
 * @remarks
 * Fields are validated: `null`, `undefined`, and invalid shapes/types (negative numbers, decimals, non-numeric values) are filtered out safely.
 *
 * @param arg - Number of records to return (integer >= 0).
 * @param options - Optional settings including `defaultValue` and custom logger.
 * @returns String representation of the limit, or `undefined` if invalid.
 *
 * @example
 * ```typescript
 * limit(15); // => "15"
 * ```
 */
export function limit(
  arg?: TLimit,
  options: TLimitOptions = {},
): string | undefined {
  const log = options.logger ?? defaultLogger;
  const val = arg ?? options.defaultValue;
  if (val === undefined) {
    log?.info(msgNoValue(QUERY_LABELS.LMT));
    return undefined;
  }

  if (!isInputValid(val)) {
    log?.error(msgMustBePositiveInteger(QUERY_LABELS.LMT, typeName(val), true));
    return undefined;
  }

  return String(val);
}

function predicate(value: number) {
  return Number.isInteger(value) && value >= MIN_LIMIT;
}

function isInputValid(arg?: number): arg is number {
  return isNumber(arg, predicate);
}
