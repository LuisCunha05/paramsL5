import { CONDITIONS } from '@/constants';
import type { BaseValue, ILogger } from '@/types';
import { isArray, isBaseValue, isNonEmptyString, typeName } from '@/utils';

export type TCondition = (typeof CONDITIONS)[keyof typeof CONDITIONS];

export type TSearchValue = BaseValue | null | undefined;
type BetweenTuple<TValue> = [TValue, TValue];

export type TSearchIn = readonly [
  string,
  (string | number)[],
  Extract<TCondition, 'in'>,
];

export type TSearchBetween = readonly [
  string,
  BetweenTuple<string> | BetweenTuple<number>,
  Extract<TCondition, 'between'>,
];

export type TSearchEqual = readonly [string, TSearchValue];

export type TSearchRegular = readonly [
  string,
  TSearchValue,
  Exclude<TCondition, 'in' | 'between'> | undefined,
];

export type TSearchItem =
  | TSearchRegular
  | TSearchIn
  | TSearchBetween
  | TSearchEqual;

export type TSearch = readonly TSearchItem[];

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

export function search(
  arg: TSearch = [],
  options: TSearchOptions = {},
): TSearchResult {
  const log = options.logger ?? console;
  if (!isArray(arg)) {
    log?.error(
      `Search: keys must have a type of array, got ${typeName(arg)} instead`,
    );
    return EMPTY_RESULT;
  }

  if (!arg.length) {
    log?.info('Search: no values given');
    return EMPTY_RESULT;
  }

  const filteredValues = arg.reduce<[string, [BaseValue, TCondition]][]>(
    (result, item, index) => {
      if (!isArray(item)) {
        log?.warn(
          `Search: must have a type of array, got ${typeName(item)} instead`,
        );
        return result;
      }

      if (item.length < TUPLE_SIZE) {
        log?.warn(
          `Search: must have a key-value array, but got length ${item.length} at index ${index} instead`,
        );
        return result;
      }

      const [key, value, condition] = item;
      if (!isNonEmptyString(key)) {
        log?.warn(
          `Search: must have keys as non-empty strings, but got ${typeName(key)} at index ${index} instead`,
        );
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
          log?.warn(
            `Search: ignoring array value because of missing condition, expected 'in' or 'between'`,
          );
          return result;
        }

        if (condition !== CONDITIONS.BTW && condition !== CONDITIONS.IN) {
          log?.warn(
            `Search: ignoring array value because got an array value for condition that is not 'in' or 'between' in index ${index}`,
          );
          return result;
        }

        if (condition === CONDITIONS.BTW && value.length !== TUPLE_SIZE) {
          log?.warn(
            `Search: ignoring array value because expected array with size 2 for condition 'between', but got ${(value as unknown[]).length} instead in index ${index}`,
          );
          return result;
        }
        if (!value.every((val) => isBaseValue(val))) {
          return result;
        }

        finalValue = value.join(',');
      } else {
        if (!isBaseValue(value)) {
          log?.info(
            `Search: ignoring value because of incorrect type, expected BaseValue but got ${typeName(value)} instead`,
          );
          return result;
        }
        finalValue = value;
      }

      if (
        condition !== undefined &&
        !Object.values(CONDITIONS).includes(condition)
      ) {
        log?.warn(
          `Search: ignoring value for condition because it didn't match possible values, got ${value}`,
        );
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
    log?.info('Search: no values remaining to parse');
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

  const searchResult = searchAndFields.search.join(';');
  const fieldsResult = searchAndFields.fields.join(';');
  return {
    search: searchResult,
    searchFields: fieldsResult,
  };
}
