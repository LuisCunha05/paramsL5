import { QUERY_LABELS, QUERY_NAMES, SEARCH_JOIN } from '#/constants';
import { ParamsL5ValidationError } from '#/errors/ParamsL5ValidationError';
import { msgMustBeEither, msgMustBeString, msgNoValue } from '#/messages';
import type { TGenerator, TLogger, ToEnum, TResult } from '#/types';
import { isNonEmptyString, typeName, unwrap } from '#/utils';

export type TSearchJoin = ToEnum<typeof SEARCH_JOIN>;
export interface TSearchJoinOptions {
  readonly logger?: TLogger;
  readonly defaultSearchJoin?: TSearchJoin;
  readonly strict?: boolean;
}

function isValidSearchJoin(val: unknown): val is TSearchJoin {
  return val === SEARCH_JOIN.AND || val === SEARCH_JOIN.OR;
}

export interface TSearchJoinResult {
  [QUERY_NAMES.SJO]: string | undefined;
}

/**
 * Formats the logical operator (`and` | `or`) that connects multiple search conditions.
 *
 * @remarks
 * Fields are validated: `null`, `undefined`, and values other than `'and'` or `'or'` are handled safely.
 *
 * @example
 * ```typescript
 * SearchJoin.build('and'); // => { searchJoin: "and" }
 * ```
 */
export class SearchJoin {
  static safe(
    value?: TSearchJoin | null,
    options?: TSearchJoinOptions,
  ): TResult<TSearchJoinResult> {
    const log = options?.logger;
    const strict = options?.strict ?? true;
    const val = value ?? options?.defaultSearchJoin;
    if (val === undefined) {
      log?.info(msgNoValue(QUERY_LABELS.SJO));
      return {
        data: { [QUERY_NAMES.SJO]: undefined },
        success: true,
      };
    }

    if (!isNonEmptyString(val)) {
      const message = msgMustBeString(QUERY_LABELS.SJO, typeName(val));
      if (!strict) {
        log?.warn(message);
        const fallback = isValidSearchJoin(options?.defaultSearchJoin)
          ? options.defaultSearchJoin
          : undefined;
        return {
          data: { [QUERY_NAMES.SJO]: fallback },
          success: true,
        };
      }
      log?.error(message);
      return {
        error: ParamsL5ValidationError.fromField(QUERY_NAMES.SJO, message, val),
        success: false,
      };
    }

    if (!isValidSearchJoin(val)) {
      const message = msgMustBeEither(
        QUERY_LABELS.SJO,
        SEARCH_JOIN.AND,
        SEARCH_JOIN.OR,
        val,
      );
      if (!strict) {
        log?.warn(message);
        const fallback = isValidSearchJoin(options?.defaultSearchJoin)
          ? options.defaultSearchJoin
          : undefined;
        return {
          data: { [QUERY_NAMES.SJO]: fallback },
          success: true,
        };
      }
      log?.error(message);
      return {
        error: ParamsL5ValidationError.fromField(QUERY_NAMES.SJO, message, val),
        success: false,
      };
    }
    return {
      data: { [QUERY_NAMES.SJO]: val },
      success: true,
    };
  }

  static build(
    value?: TSearchJoin | null,
    options?: TSearchJoinOptions,
  ): TSearchJoinResult {
    return unwrap(SearchJoin.safe(value, options));
  }
}

SearchJoin satisfies TGenerator<
  TSearchJoin | null | undefined,
  TSearchJoinOptions,
  TSearchJoinResult
>;
