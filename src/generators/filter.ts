import type { ILogger } from '@/types';
import { isArray, isNonEmptyString, typeName } from '@/utils';

export type TFilter = readonly string[];

export interface TFilterOptions {
  logger?: ILogger;
}

export function filter(
  arg: TFilter = [],
  options: TFilterOptions = {},
): string | undefined {
  const log = options.logger ?? console;
  if (!isArray(arg)) {
    log?.error(
      `Filter: argument must be an array, got ${typeName(arg)} instead`,
    );
    return undefined;
  }

  if (!arg.length) {
    log?.info('Filter: no values given');
    return undefined;
  }

  const filteredValues = arg.filter((item) => {
    if (!isNonEmptyString(item)) {
      log?.info(
        `Filter: include value must be a string, got ${typeName(item)} instead`,
      );
      return false;
    }
    return true;
  });

  if (!filteredValues.length) {
    log?.info('Filter: no values remaining to parse');
    return undefined;
  }

  const uniqueValues = [...new Set(filteredValues)];

  if (!uniqueValues.length) {
    return undefined;
  }

  return uniqueValues.join(';');
}
