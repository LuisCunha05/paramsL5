import { QUERY_LABELS } from '#s/constants';
import { defaultLogger } from '#s/logger';
import { MESSAGES } from '#s/messages';
import type { BaseValue, ILogger, Path } from '#s/types';
import { isArray, isBaseValue, isNonEmptyString, typeName } from '#s/utils';

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
  const log = options.logger ?? defaultLogger;
  if (!isArray(arg)) {
    log?.error(MESSAGES.notArray(QUERY_LABELS.SCR, typeName(arg)));
    return undefined;
  }

  if (!arg.length) {
    log?.info(MESSAGES.noValues(QUERY_LABELS.SCR));
    return undefined;
  }

  const filteredValues = arg.filter((item, index) => {
    if (!isArray(item)) {
      log?.warn(MESSAGES.itemNotArray(QUERY_LABELS.SCR, typeName(item)));
      return false;
    }

    if (item.length !== KEY_VALUE_LENGTH) {
      log?.warn(
        MESSAGES.itemNotKeyValue(QUERY_LABELS.SCR, item.length, index),
      );
      return false;
    }

    const [key, value] = item;

    if (!isNonEmptyString(key)) {
      log?.warn(MESSAGES.invalidKey(QUERY_LABELS.SCR, typeName(key), index));
      return false;
    }

    if (!isBaseValue(value)) {
      log?.info(
        MESSAGES.invalidValueAtIndex(QUERY_LABELS.SCR, typeName(value), index),
      );
      return false;
    }

    return true;
  });

  if (!filteredValues.length) {
    log?.info(MESSAGES.noRemaining(QUERY_LABELS.SCR));
    return undefined;
  }

  const deduplicatedValues = [...new Map(filteredValues)];

  let stringParams = '';
  deduplicatedValues.forEach(([key, value]) => {
    stringParams += `&${key}=${value}`;
  });

  return stringParams.slice(CRITERIA_START_INDEX);
}
