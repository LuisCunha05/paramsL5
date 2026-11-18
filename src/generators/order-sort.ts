import { QUERY_LABELS, QUERY_NAMES, SORT_BY } from '#/constants';
import {
  ParamsL5ValidationError,
  type TValidationIssue,
} from '#/errors/ParamsL5ValidationError';
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
  readonly strict?: boolean;
}

export interface TOrderBySortByResult {
  [QUERY_NAMES.OBY]: string | undefined;
  [QUERY_NAMES.SBY]: string | undefined;
}

type TParsedOrderSortEntry = readonly [key: string, sortBy: TSortBy];

interface OrderSortParseContext {
  readonly defaultSortBy: TSortBy;
  readonly issues: TValidationIssue[];
  readonly log?: TLogger;
  readonly strict: boolean;
}

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

function recordOrderSortIssue(
  context: {
    readonly issues: TValidationIssue[];
    readonly log?: TLogger;
    readonly strict: boolean;
  },
  field: string,
  message: string,
  value: unknown,
): void {
  if (context.strict) {
    context.log?.error(message);
    context.issues.push({ field, message, value });
  } else {
    context.log?.warn(message);
  }
}

/**
 * Formats object-based sorting columns and directions into paired `orderBy` and `sortedBy` parameters.
 *
 * @remarks
 * Under strict mode (default), top-level non-object inputs and invalid entries/options produce a `ParamsL5ValidationError`.
 * `null` and `undefined` entry values are safely skipped. Pass `true` as a column's value to use `options.defaultSortBy` (defaults to `'asc'`).
 * Set `options.strict` to `false` to drop invalid entries and fall back to defaults without throwing.
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
    const strict = options?.strict ?? true;

    if (value === undefined || value === null) {
      log?.info(msgNoValue(QUERY_LABELS.OBY));
      return { data: { ...EMPTY_RESULT }, success: true };
    }

    if (!isObject(value)) {
      const message = msgMustBeObject(QUERY_LABELS.OBY, typeName(value));
      log?.error(message);
      if (!strict) {
        return { data: { ...EMPTY_RESULT }, success: true };
      }
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

    const issues: TValidationIssue[] = [];
    const defaultSortBy = OrderBySortBy.#resolveDefaultSortBy(
      options?.defaultSortBy,
      { issues, log, strict },
    );

    const parsedEntries = new Map<string, TSortBy>();
    for (const [index, entry] of entries.entries()) {
      const parsed = OrderBySortBy.#parseEntry(entry, index, {
        defaultSortBy,
        issues,
        log,
        strict,
      });
      if (parsed) {
        const [key, sortBy] = parsed;
        parsedEntries.set(key, sortBy);
      }
    }

    if (issues.length) {
      return {
        error: ParamsL5ValidationError.fromIssues(issues),
        success: false,
      };
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
    defaultSortBy: TSortBy | undefined,
    context: {
      readonly issues: TValidationIssue[];
      readonly log?: TLogger;
      readonly strict: boolean;
    },
  ): TSortBy {
    if (defaultSortBy === undefined) {
      return SORT_BY.ASC;
    }
    if (!isSortByValue(defaultSortBy)) {
      recordOrderSortIssue(
        context,
        `${QUERY_NAMES.OBY}.defaultSortBy`,
        msgMustBeEither(
          QUERY_LABELS.OBY,
          SORT_BY.ASC,
          SORT_BY.DESC,
          String(defaultSortBy),
        ),
        defaultSortBy,
      );
      return SORT_BY.ASC;
    }
    return defaultSortBy;
  }

  static #parseEntry(
    [key, rawValue]: readonly [string, unknown],
    index: number,
    context: OrderSortParseContext,
  ): TParsedOrderSortEntry | undefined {
    const { defaultSortBy } = context;

    if (!isNonEmptyString(key)) {
      recordOrderSortIssue(
        context,
        `${QUERY_NAMES.OBY}[${index}]`,
        msgInvalidKey(QUERY_LABELS.OBY, typeName(key), index),
        key,
      );
      return undefined;
    }

    if (rawValue === null || rawValue === undefined) {
      return undefined;
    }

    const trimmedKey = key.trim();

    if (rawValue === true) {
      return [trimmedKey, defaultSortBy];
    }

    if (!isSortByValue(rawValue)) {
      recordOrderSortIssue(
        context,
        `${QUERY_NAMES.OBY}.${trimmedKey}`,
        msgInvalidSortBy(QUERY_LABELS.OBY, rawValue, index),
        rawValue,
      );
      return undefined;
    }

    return [trimmedKey, rawValue];
  }
}

OrderBySortBy satisfies TGenerator<
  TOrderBySortBy<Record<string, unknown>> | null | undefined,
  TOrderBySortByOptions,
  TOrderBySortByResult
>;
