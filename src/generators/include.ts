import type { ILogger } from '@/types';
import { isArray, isNonEmptyString, typeName } from '@/utils';

export type TInclude = readonly string[];

export interface TIncludeOptions {
  logger?: ILogger;
}

export function include(
  arg: TInclude = [],
  options: TIncludeOptions = {},
): string | undefined {
  const log = options.logger ?? console;
  if (!isArray(arg)) {
    log?.error(
      `Include: argument must be an array, got ${typeName(arg)} instead`,
    );
    return undefined;
  }

  if (!arg.length) {
    log?.info('Include: no values given');
    return undefined;
  }

  const filteredValues = arg.reduce<string[]>((result, item) => {
    if (!isNonEmptyString(item)) {
      log?.info(
        `Include: include value must be a string, got ${typeName(item)} instead`,
      );
      return result;
    }

    result.push(item);
    return result;
  }, []);

  if (!filteredValues.length) {
    log?.info('Include: no values remaining to parse');
    return undefined;
  }

  const uniqueValues = [...new Set(filteredValues)];

  return uniqueValues.join(',');
}
