import { QUERY_LABELS, QUERY_NAMES, SORT_BY } from '#/constants';
import { ParamsL5ValidationError } from '#/errors/ParamsL5ValidationError';
import {
  msgInvalidKey,
  msgInvalidSortBy,
  msgMustBeEither,
  msgMustBeObject,
  msgNoRemaining,
  msgNoValue,
  msgNoValues,
} from '#/messages';
import type { TGenerator, TLogger, TPathPipe, TResult, ToEnum } from '#/types';
import { isNonEmptyString, isObject, typeName, unwrap } from '#/utils';

export type TSortBy = ToEnum<typeof SORT_BY>;

export type TOrderBySortByValue = TSortBy | true | null | undefined;

export type TOrderBySortBy<TTShape> = Readonly<
  Partial<Record<NoInfer<TPathPipe<TTShape>>, TOrderBySortByValue>>
>;

export interface TOrderBySortByOptions {
  readonly defaultSortBy?: TSortBy;
  readonly logger?: TLogger;
}

export interface TOrderBySortByResult {
  [QUERY_NAMES.OBY]: string | undefined;
  [QUERY_NAMES.SBY]: string | undefined;
}

type TParsedOrderSortEntry = readonly [key: string, sortBy: TSortBy];

const EMPTY_RESULT: TOrderBySortByResult = {
  [QUERY_NAMES.OBY]: undefined,
  [QUERY_NAMES.SBY]: undefined,
};
const SORT_BY_VALUES: readonly unknown[] = Object.values(SORT_BY);

function isSortByValue(value: unknown): value is TSortBy {
  return SORT_BY_VALUES.includes(value);
}

function buildOrderBySortByResult(
  entries: ReadonlyMap<string, TSortBy>,
): TOrderBySortByResult {
  if (!entries.size) {
    return { ...EMPTY_RESULT };
  }

  const orderBy: string[] = [];
  const sortedBy: TSortBy[] = [];

  for (const [key, value] of entries) {
    orderBy.push(key);
    sortedBy.push(value);
  }

  return {
    [QUERY_NAMES.OBY]: orderBy.join(';'),
    [QUERY_NAMES.SBY]: sortedBy.join(';'),
  };
}

/**
 * Formats object-based sorting columns and directions into paired `orderBy` and `sortedBy` parameters.
 *
 * @remarks
 * Top-level non-object inputs (excluding `null` and `undefined`) produce a validation error.
 * Individual entries with `null`, `undefined`, invalid keys, or invalid sort directions are safely filtered out.
 * Pass `true` as a column's value to use `options.defaultSortBy` (defaults to `'asc'`).
 *
 * @example
 * ```typescript
 * OrderBySortBy.build({ created_at: 'desc', name: 'asc' });
 * // => { orderBy: "created_at;name", sortedBy: "desc;asc" }
 * ```
 */
export class OrderBySortBy {
  static safe<TShape extends object = Record<string, unknown>>(
    value?: TOrderBySortBy<TShape> | null,
    options?: TOrderBySortByOptions,
  ): TResult<TOrderBySortByResult> {
    const log = options?.logger;
    if (value === undefined || value === null) {
      log?.info(msgNoValue(QUERY_LABELS.OBY));
      return { data: { ...EMPTY_RESULT }, success: true };
    }

    if (!isObject(value)) {
      const message = msgMustBeObject(QUERY_LABELS.OBY, typeName(value));
      log?.error(message);
      return {
        error: ParamsL5ValidationError.fromField(
          QUERY_NAMES.OBY,
          message,
          value,
        ),
        success: false,
      };
    }

    const entries = Object.entries(value);
    if (!entries.length) {
      log?.info(msgNoValues(QUERY_LABELS.OBY));
      return { data: { ...EMPTY_RESULT }, success: true };
    }

    const defaultSortBy = OrderBySortBy.#resolveDefaultSortBy(
      options?.defaultSortBy,
      log,
    );

    const parsedEntries = new Map<string, TSortBy>();
    for (const [index, entry] of entries.entries()) {
      const parsed = OrderBySortBy.#parseEntry(entry, index, {
        defaultSortBy,
        log,
      });
      if (parsed) {
        const [key, sortBy] = parsed;
        parsedEntries.set(key, sortBy);
      }
    }

    if (!parsedEntries.size) {
      log?.info(msgNoRemaining(QUERY_LABELS.OBY));
      return { data: { ...EMPTY_RESULT }, success: true };
    }

    return {
      data: buildOrderBySortByResult(parsedEntries),
      success: true,
    };
  }

  static build<TShape extends object = Record<string, unknown>>(
    value?: TOrderBySortBy<TShape> | null,
    options?: TOrderBySortByOptions,
  ): TOrderBySortByResult {
    return unwrap(OrderBySortBy.safe(value, options));
  }

  static #resolveDefaultSortBy(
    defaultSortBy?: TSortBy,
    log?: TLogger,
  ): TSortBy {
    if (defaultSortBy === undefined) {
      return SORT_BY.ASC;
    }
    if (!isSortByValue(defaultSortBy)) {
      log?.warn(
        msgMustBeEither(
          QUERY_LABELS.OBY,
          SORT_BY.ASC,
          SORT_BY.DESC,
          String(defaultSortBy),
        ),
      );
      return SORT_BY.ASC;
    }
    return defaultSortBy;
  }

  static #parseEntry(
    [key, rawValue]: readonly [string, unknown],
    index: number,
    context: { readonly defaultSortBy: TSortBy; readonly log?: TLogger },
  ): TParsedOrderSortEntry | undefined {
    const { defaultSortBy, log } = context;

    if (!isNonEmptyString(key)) {
      log?.warn(msgInvalidKey(QUERY_LABELS.OBY, typeName(key), index));
      return undefined;
    }

    if (rawValue === null || rawValue === undefined) {
      return undefined;
    }

    if (rawValue === true) {
      return [key.trim(), defaultSortBy];
    }

    if (!isSortByValue(rawValue)) {
      log?.warn(msgInvalidSortBy(QUERY_LABELS.OBY, rawValue, index));
      return undefined;
    }

    return [key.trim(), rawValue];
  }
}

OrderBySortBy satisfies TGenerator<
  TOrderBySortBy<Record<string, unknown>> | null | undefined,
  TOrderBySortByOptions,
  TOrderBySortByResult
>;
