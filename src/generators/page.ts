import { QUERY_LABELS, QUERY_NAMES } from '#/constants';
import { ParamsL5ValidationError } from '#/errors/ParamsL5ValidationError';
import { msgMustBePositiveInteger, msgNoValue } from '#/messages';
import type { TGenerator, TLogger, TResult } from '#/types';
import { isNumber, typeName, unwrap } from '#/utils';

export type TPage = number;

export interface TPageOptions {
  readonly logger?: TLogger;
  readonly strict?: boolean;
}

export interface TPageResult {
  [QUERY_NAMES.PAG]: string | undefined;
}

const MIN_PAGE = 0;
const DEFAULT_PAGE = 1;

/**
 * Formats the pagination page number into a query parameter string.
 *
 * @remarks
 * Fields are validated: `null`, `undefined`, and invalid shapes/types (numbers <= 0, decimals, non-numeric values) are handled safely.
 * Defaults to `'1'` when no page is given.
 *
 * @example
 * ```typescript
 * Page.build(2); // => { page: "2" }
 * ```
 */
export class Page {
  static safe(
    value?: TPage | null,
    options?: TPageOptions,
  ): TResult<TPageResult> {
    const log = options?.logger;
    const strict = options?.strict ?? true;
    if (value === undefined || value === null) {
      log?.info(msgNoValue(QUERY_LABELS.PAG));
      return {
        data: { [QUERY_NAMES.PAG]: String(DEFAULT_PAGE) },
        success: true,
      };
    }

    if (!Page.#isInputValid(value)) {
      const message = msgMustBePositiveInteger(
        QUERY_LABELS.PAG,
        typeName(value),
        false,
      );
      if (!strict) {
        log?.warn(message);
        return {
          data: { [QUERY_NAMES.PAG]: String(DEFAULT_PAGE) },
          success: true,
        };
      }
      log?.error(message);
      return {
        error: ParamsL5ValidationError.fromField(
          QUERY_NAMES.PAG,
          message,
          value,
        ),
        success: false,
      };
    }

    return {
      data: { [QUERY_NAMES.PAG]: String(value) },
      success: true,
    };
  }

  static build(value?: TPage | null, options?: TPageOptions): TPageResult {
    return unwrap(Page.safe(value, options));
  }

  static #isInputValid(arg?: number): arg is number {
    return isNumber(
      arg,
      (value) => Number.isInteger(value) && value > MIN_PAGE,
    );
  }
}

Page satisfies TGenerator<TPage | null | undefined, TPageOptions, TPageResult>;
