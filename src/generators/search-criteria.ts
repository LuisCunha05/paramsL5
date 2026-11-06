import type { BaseValue, ILogger, Path } from '@/types';
import { isArray, isBaseValue, isNonEmptyString, typeName } from '@/utils';

export type TCriteriaValue = BaseValue | null | undefined;
export type TSearchCriteria<TTShape> = readonly (readonly [
  NoInfer<Path<TTShape>>,
  TCriteriaValue,
])[];

export interface TSearchCriteriaOptions {
  logger?: ILogger;
}

const CRITERIA_START_INDEX = 1;
const KEY_VALUE_LENGTH = 2;

export function searchCriteria<TShape extends object = Record<string, unknown>>(
  arg: TSearchCriteria<TShape> = [],
  options: TSearchCriteriaOptions = {},
): string | undefined {
  const log = options.logger ?? console;
  if (!isArray(arg)) {
    log?.error(
      `SearchCriteria: keys must have a type of array, got ${typeName(arg)} instead`,
    );
    return undefined;
  }

  if (!arg.length) {
    log?.info(`SearchCriteria: no values given`);
    return undefined;
  }

  const filteredValues = arg.filter((item, index) => {
    if (!isArray(item)) {
      log?.warn(
        `SearchCriteria: must have a type of array, got ${typeName(item)} instead`,
      );
      return false;
    }

    if (item.length !== KEY_VALUE_LENGTH) {
      log?.warn(
        `SearchCriteria: must have a key-value array, but got length ${item.length} at index ${index} instead`,
      );
      return false;
    }

    const [key, value] = item;

    if (!isNonEmptyString(key)) {
      log?.warn(
        `SearchCriteria: must have keys as non-empty strings, but got ${typeName(key)} at index ${index} instead`,
      );
      return false;
    }

    if (!isBaseValue(value)) {
      log?.info(
        `SearchCriteria: ignoring invalid value, got ${typeName(value)} at index ${index} instead`,
      );
      return false;
    }

    return true;
  });

  if (!filteredValues.length) {
    log?.info('SearchCriteria: no values remaning to parse');
    return undefined;
  }

  const deduplicatedValues = [...new Map(filteredValues)];

  let result = '';

  deduplicatedValues.forEach(([key, value]) => {
    result += `&${key}=${value}`;
  });

  return result.slice(CRITERIA_START_INDEX);
}
