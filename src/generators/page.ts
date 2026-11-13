import { QUERY_LABELS, QUERY_NAMES } from '#/constants';
import { msgMustBePositiveInteger, msgNoValue } from '#/messages';
import type { TLogger } from '#/types';
import { isNumber, typeName } from '#/utils';

export type TPage = number;

export interface TPageOptions {
  logger?: TLogger;
}

export interface TPageResult {
  [QUERY_NAMES.PAG]: string | undefined;
}

const EMPTY_RESULT = {
  [QUERY_NAMES.PAG]: undefined,
} as const;

const MIN_PAGE = 0;
/**
 * Formats the pagination page number into a query parameter string.
 *
 * @remarks
 * Fields are validated: `null`, `undefined`, and invalid shapes/types (numbers <= 0, decimals, non-numeric values) are filtered out safely.
 *
 * @param arg - Page number to retrieve (integer >= 1).
 * @param options - Optional settings including custom logger.
 * @returns An object `{ page }` containing the string representation of the page number, or `undefined` if invalid.
 *
 * @example
 * ```typescript
 * page(2); // => { page: "2" }
 * ```
 */
export function page(arg?: TPage, options: TPageOptions = {}): TPageResult {
  const log = options.logger;

  if (arg === undefined) {
    log?.info(msgNoValue(QUERY_LABELS.PAG));
    return EMPTY_RESULT;
  }

  if (!isInputValid(arg)) {
    log?.error(
      msgMustBePositiveInteger(QUERY_LABELS.PAG, typeName(arg), false),
    );
    return EMPTY_RESULT;
  }

  return {
    [QUERY_NAMES.PAG]: String(arg),
  };
}

function predicate(value: number) {
  return Number.isInteger(value) && value > MIN_PAGE;
}

function isInputValid(arg?: number): arg is number {
  return isNumber(arg, predicate);
}
