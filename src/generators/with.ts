import type { ILogger, TResult } from '@/types';
import { encodeSearchParam, isNonEmptyString, typeName } from '@/utils';

export type TWith = Array<string>;
export type TWithOptions = {
  logger?: ILogger;
};

export function withRel(
  arg: TWith = [],
  options: TWithOptions = {},
): TResult | undefined {
  const log = options.logger ?? console;
  if (!Array.isArray(arg)) {
    log?.error(`With: argument must be an array, got ${typeName(arg)} instead`);
    return;
  }

  if (!arg.length) {
    log?.info('With: no values given');
    return;
  }

  const filteredValues = arg.filter((item) => {
    if (!isNonEmptyString(item)) {
      log?.info(`With: value must be a string, got ${typeName(item)} instead`);
      return false;
    }
    return true;
  });

  if (!filteredValues.length) {
    log?.info('With: no values remaining to parse');
    return;
  }

  const uniqueValues = Array.from(new Set(filteredValues));

  const params = new URLSearchParams();
  params.set('with', uniqueValues.join(';'));

  const result = uniqueValues.join(';');

  return {
    raw: result,
    encoded: encodeSearchParam(result),
  };
}
