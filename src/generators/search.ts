import { CONDITIONS, QUERY_LABELS } from '#s/constants';
import { defaultLogger } from '#s/logger';
import {
  msgInvalidBaseValue,
  msgInvalidBetweenSize,
  msgInvalidCondition,
  msgInvalidConditionArray,
  msgInvalidKey,
  msgItemNotArray,
  msgItemNotKeyValue,
  msgMissingConditionArray,
  msgNoRemaining,
  msgNoValues,
  msgNotArray,
} from '#s/messages';
import type { BaseValue, ILogger, Path, ToEnum } from '#s/types';
import { isArray, isBaseValue, isNonEmptyString, typeName } from '#s/utils';

export type TCondition = ToEnum<typeof CONDITIONS>;

export type TSearchValue = BaseValue | null | undefined;
type BetweenTuple<TValue> = [TValue, TValue];

export type TSearchIn<TTShape> = readonly [
  NoInfer<Path<TTShape>>,
  (string | number)[],
  Extract<TCondition, 'in'>,
];

export type TSearchBetween<TTShape> = readonly [
  NoInfer<Path<TTShape>>,
  BetweenTuple<string> | BetweenTuple<number>,
  Extract<TCondition, 'between'>,
];

export type TSearchEqual<TTShape> = readonly [
  NoInfer<Path<TTShape>>,
  TSearchValue,
];

export type TSearchRegular<TTShape> = readonly [
  NoInfer<Path<TTShape>>,
  TSearchValue,
  Exclude<TCondition, 'in' | 'between'> | undefined,
];

export type TSearchItem<TTShape> =
  | TSearchRegular<TTShape>
  | TSearchIn<TTShape>
  | TSearchBetween<TTShape>
  | TSearchEqual<TTShape>;

export type TSearch<TTShape> = readonly TSearchItem<TTShape>[];

interface TSearchOptions {
  defaultCondition?: TCondition;
  logger?: ILogger;
}

export interface TSearchResult {
  search: string | undefined;
  searchFields: string | undefined;
}

const EMPTY_RESULT = { search: undefined, searchFields: undefined } as const;
const TUPLE_SIZE = 2;

export function search<TShape extends object = Record<string, unknown>>(
  arg: TSearch<TShape> = [],
  options: TSearchOptions = {},
): TSearchResult {
  const log = options.logger ?? defaultLogger;
  if (!isArray(arg)) {
    log?.error(msgNotArray(QUERY_LABELS.SRC, typeName(arg)));
    return EMPTY_RESULT;
  }

  if (!arg.length) {
    log?.info(msgNoValues(QUERY_LABELS.SRC));
    return EMPTY_RESULT;
  }

  const filteredValues = arg.reduce<[Path<TShape>, [BaseValue, TCondition]][]>(
    (result, item, index) => {
      if (!isArray(item)) {
        log?.warn(msgItemNotArray(QUERY_LABELS.SRC, typeName(item)));
        return result;
      }

      if (item.length < TUPLE_SIZE) {
        log?.warn(msgItemNotKeyValue(QUERY_LABELS.SRC, item.length, index));
        return result;
      }

      const [key, value, condition] = item;
      if (!isNonEmptyString(key)) {
        log?.warn(msgInvalidKey(QUERY_LABELS.SRC, typeName(key), index));
        return result;
      }

      if (value === null || value === undefined) {
        return result;
      }

      let finalValue: BaseValue;

      if (isArray(value)) {
        if (!value.length) {
          return result;
        }
        if (!condition) {
          log?.warn(msgMissingConditionArray(QUERY_LABELS.SRC));
          return result;
        }

        if (condition !== CONDITIONS.BTW && condition !== CONDITIONS.IN) {
          log?.warn(msgInvalidConditionArray(QUERY_LABELS.SRC, index));
          return result;
        }

        if (condition === CONDITIONS.BTW && value.length !== TUPLE_SIZE) {
          log?.warn(
            msgInvalidBetweenSize(
              QUERY_LABELS.SRC,
              (value as unknown[]).length,
              index,
            ),
          );
          return result;
        }
        if (!value.every((val) => isBaseValue(val))) {
          return result;
        }

        finalValue = value.join(',');
      } else {
        if (!isBaseValue(value)) {
          log?.info(msgInvalidBaseValue(QUERY_LABELS.SRC, typeName(value)));
          return result;
        }
        finalValue = value;
      }

      if (
        condition !== undefined &&
        !Object.values(CONDITIONS).includes(condition)
      ) {
        log?.warn(msgInvalidCondition(QUERY_LABELS.SRC, value));
        return result;
      }

      result.push([
        key,
        [finalValue, condition ?? options.defaultCondition ?? CONDITIONS.EQ],
      ]);

      return result;
    },
    [],
  );

  if (!filteredValues.length) {
    log?.info(msgNoRemaining(QUERY_LABELS.SRC));
    return EMPTY_RESULT;
  }

  const deduplicatedValues = [...new Map(filteredValues)];

  const searchAndFields = deduplicatedValues.reduce(
    (result, [key, [value, condition]]) => {
      const newValue = typeof value === 'string' ? value.trim() : value;

      result.search.push(`${key}:${newValue}`);
      result.fields.push(`${key}:${condition}`);

      return result;
    },
    { fields: [] as string[], search: [] as string[] },
  );

  if (!searchAndFields.search.length) {
    return EMPTY_RESULT;
  }

  return {
    search: searchAndFields.search.join(';'),
    searchFields: searchAndFields.fields.join(';'),
  };
}
