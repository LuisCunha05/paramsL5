const NO_VALUES = 'no values given';
const NO_VALUE = 'no value given';
const NO_REMAINING = 'no values remaining to parse';
const ARG_MUST_BE_ARRAY = 'argument must be an array';
const TYPE_ARRAY = 'must have a type of array';
const NON_EMPTY_STRING_KEYS = 'must have keys as non-empty strings';
const VALUE_MUST_BE_STRING = 'value must be a string';
const IGNORING_ARRAY = 'ignoring array value: ';
const IGNORING_VALUE = 'ignoring value: ';
const EXPECTED_IN_BETWEEN = "expected 'in' or 'between'";

const gotInstead = (type: string | number) => `, got ${type} instead`;
const atIndexInstead = (type: string | number, index: number) =>
  ` at index ${index} instead`;

export const MESSAGES = {
  // Generic collection / argument lifecycle
  noValues: (label: string) => `${label}: ${NO_VALUES}`,
  noValue: (label: string) => `${label}: ${NO_VALUE}`,
  noRemaining: (label: string) => `${label}: ${NO_REMAINING}`,
  notArray: (label: string, got: string) =>
    `${label}: ${ARG_MUST_BE_ARRAY}${gotInstead(got)}`,
  itemNotArray: (label: string, got: string) =>
    `${label}: ${TYPE_ARRAY}${gotInstead(got)}`,

  // Key-value tuple validations
  itemNotKeyValue: (label: string, length: number, index: number) =>
    `${label}: must have a key-value array, but got length ${length}${atIndexInstead(length, index)}`,
  invalidKey: (label: string, got: string, index: number) =>
    `${label}: ${NON_EMPTY_STRING_KEYS}, got ${got}${atIndexInstead(got, index)}`,

  // Value validations
  mustBeString: (label: string, got: string) =>
    `${label}: ${VALUE_MUST_BE_STRING}${gotInstead(got)}`,
  mustBePositiveInteger: (label: string, got: string, allowZero = false) =>
    `${label}: must be a positive integer${allowZero ? ' or zero' : ''}${gotInstead(got)}`,

  // Generator-specific messages & conditions
  mustBeEither: (label: string, valA: string, valB: string, got: string) =>
    `${label}: must be either "${valA}" or "${valB}", got "${got}" instead`,
  invalidSortBy: (label: string, got: unknown, index: number) =>
    `${label}: must have a valid SORT_BY value, but got ${got}${atIndexInstead(String(got), index)}`,

  // Standardized ignoring messages (Search / SearchCriteria)
  missingConditionArray: (label: string) =>
    `${label}: ${IGNORING_ARRAY}missing condition, ${EXPECTED_IN_BETWEEN}`,
  invalidConditionArray: (label: string, index: number) =>
    `${label}: ${IGNORING_ARRAY}invalid condition, ${EXPECTED_IN_BETWEEN} at index ${index}`,
  invalidBetweenSize: (label: string, length: number, index: number) =>
    `${label}: ${IGNORING_ARRAY}expected 2 elements for 'between', got ${length}${atIndexInstead(length, index)}`,
  invalidBaseValue: (label: string, got: string) =>
    `${label}: ${IGNORING_VALUE}expected BaseValue${gotInstead(got)}`,
  invalidCondition: (label: string, got: unknown) =>
    `${label}: ${IGNORING_VALUE}invalid condition value, got ${got}`,
  invalidValueAtIndex: (label: string, got: string, index: number) =>
    `${label}: ${IGNORING_VALUE}expected BaseValue, got ${got}${atIndexInstead(got, index)}`,
} as const;
