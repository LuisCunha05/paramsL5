import type { ILogger, Path } from '@/types';
import { isArray, isNonEmptyString, typeName } from '@/utils';

export type TWith<TTShape> = readonly Path<TTShape>[];
export interface TWithOptions {
  logger?: ILogger;
}

export function withRel<TShape extends object>(
  arg: TWith<TShape> = [],
  options: TWithOptions = {},
): string | undefined {
  const log = options.logger ?? console;
  if (!isArray(arg)) {
    log?.error(`With: argument must be an array, got ${typeName(arg)} instead`);
    return undefined;
  }

  if (!arg.length) {
    log?.info('With: no values given');
    return undefined;
  }

  const filteredValues = arg.filter((item) => {
    if (!isNonEmptyString(item)) {
      log?.warn(`With: value must be a string, got ${typeName(item)} instead`);
      return false;
    }
    return true;
  });

  if (!filteredValues.length) {
    log?.info('With: no values remaining to parse');
    return undefined;
  }

  const uniqueValues = [...new Set(filteredValues)];

  if (!uniqueValues.length) {
    log?.info('With: no values remaining to parse');
    return undefined;
  }

  return uniqueValues.join(';');
}
