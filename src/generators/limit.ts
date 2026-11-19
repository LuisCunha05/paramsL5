import { QUERY_LABELS, QUERY_NAMES } from '#/constants';
import { ParamsL5ValidationError } from '#/errors/ParamsL5ValidationError';
import { msgMustBePositiveInteger, msgNoValue } from '#/messages';
import type { TGenerator, TLogger, TResult } from '#/types';
import { isNumber, typeName, unwrap } from '#/utils';

export type TLimit = number;

export interface TLimitOptions {
  readonly logger?: TLogger;
  readonly defaultValue?: TLimit;
  readonly strict?: boolean;
}

export interface TLimitResult {
  [QUERY_NAMES.LMT]: string | undefined;
}

const MIN_LIMIT = 0;
const DEFAULT_VALUE = '15';

/**
 * Formats the pagination limit (records per page) into a query parameter string.
 *
 * @remarks
 * Fields are validated: `null`, `undefined`, and invalid shapes/types (negative numbers, decimals, non-numeric values) are handled safely.
 * Falls back to `options.defaultValue` or `'15'` when no limit is given.
 *
 * @example
 * ```typescript
 * Limit.build(15); // => { limit: "15" }
 * ```
 */
export class Limit {
  static safe(
    value?: TLimit | null,
    options?: TLimitOptions,
  ): TResult<TLimitResult> {
    const log = options?.logger;
    const strict = options?.strict ?? true;
    const val = value ?? options?.defaultValue;
    if (val === undefined) {
      log?.info(msgNoValue(QUERY_LABELS.LMT));
      return {
        data: { [QUERY_NAMES.LMT]: DEFAULT_VALUE },
        success: true,
      };
    }

    if (!Limit.#isInputValid(val)) {
      const message = msgMustBePositiveInteger(
        QUERY_LABELS.LMT,
        typeName(val),
        true,
      );
      if (!strict) {
        log?.warn(message);
        const fallback =
          options?.defaultValue !== undefined &&
          Limit.#isInputValid(options.defaultValue)
            ? String(options.defaultValue)
            : DEFAULT_VALUE;
        return {
          data: { [QUERY_NAMES.LMT]: fallback },
          success: true,
        };
      }
      log?.error(message);
      return {
        error: ParamsL5ValidationError.fromField(QUERY_NAMES.LMT, message, val),
        success: false,
      };
    }

    return {
      data: { [QUERY_NAMES.LMT]: String(val) },
      success: true,
    };
  }

  static build(value?: TLimit | null, options?: TLimitOptions): TLimitResult {
    return unwrap(Limit.safe(value, options));
  }

  static #isInputValid(arg?: number): arg is number {
    return isNumber(
      arg,
      (value) => Number.isInteger(value) && value >= MIN_LIMIT,
    );
  }
}

Limit satisfies TGenerator<
  TLimit | null | undefined,
  TLimitOptions,
  TLimitResult
>;
