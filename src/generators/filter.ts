import { QUERY_LABELS, QUERY_NAMES } from '#/constants';
import { defaultLogger } from '#/logger';
import {
  msgMustBeString,
  msgNoRemaining,
  msgNoValues,
  msgNotArray,
} from '#/messages';
import type { TLogger, TPath } from '#/types';
import { isArray, isNonEmptyString, typeName } from '#/utils';

export type TFilter<TTShape> = readonly NoInfer<TPath<TTShape>>[];

export interface TFilterOptions {
  readonly logger?: TLogger;
}

export interface TFilterResult {
  [QUERY_NAMES.FLT]: string | undefined;
}

const EMPTY_RESULT = {
  [QUERY_NAMES.FLT]: undefined,
} as const;

/**
 * Formats database columns to retrieve into a semicolon-separated string (`filter=id;name`).
 *
 * @remarks
 * Fields are automatically validated: `null`, `undefined`, and invalid shapes are filtered out safely.
 *
 * @param arg - Array of column field names.
 * @param options - Optional settings including custom logger.
 * @returns An object `{ filter }` containing a semicolon-separated string of unique column names, or `undefined`.
 *
 * @example
 * ```typescript
 * filter(['id', 'name', 'email']); // => { filter: "id;name;email" }
 * ```
 */
export function filter<TShape extends object = Record<string, unknown>>(
  arg: TFilter<TShape> = [],
  options: TFilterOptions = {},
): TFilterResult {
  const log = options.logger ?? defaultLogger;
  if (!isArray(arg)) {
    log?.error(msgNotArray(QUERY_LABELS.FLT, typeName(arg)));
    return EMPTY_RESULT;
  }

  if (!arg.length) {
    log?.info(msgNoValues(QUERY_LABELS.FLT));
    return EMPTY_RESULT;
  }

  const filteredValues = arg.filter((item) => {
    if (!isNonEmptyString(item)) {
      log?.info(msgMustBeString(QUERY_LABELS.FLT, typeName(item)));
      return false;
    }
    return true;
  });

  if (!filteredValues.length) {
    log?.info(msgNoRemaining(QUERY_LABELS.FLT));
    return EMPTY_RESULT;
  }

  const uniqueValues = [...new Set(filteredValues)];

  if (!uniqueValues.length) {
    return EMPTY_RESULT;
  }

  return {
    [QUERY_NAMES.FLT]: uniqueValues.join(';'),
  };
}
