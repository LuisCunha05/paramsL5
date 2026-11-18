const NO_VALUES = 'no values given';
const NO_VALUE = 'no value given';
const NO_REMAINING = 'no values remaining to parse';
const ARG_MUST_BE_ARRAY = 'argument must be an array';
const TYPE_ARRAY = 'must have a type of array';
const NON_EMPTY_STRING_KEYS = 'must have keys as non-empty strings';
const VALUE_MUST_BE_STRING = 'value must be a string';
const VALUE_MUST_BE_OBJECT = 'value must be a object';
const IGNORING_ARRAY = 'ignoring array value: ';
const IGNORING_VALUE = 'ignoring value: ';
const EXPECTED_IN_BETWEEN = "expected 'in' or 'between'";
const BUT_GOT = ', but got ';

function gotInstead(type: string | number) {
  return `, got ${type} instead`;
}

function atIndexInstead(index: number) {
  return ` at index ${index} instead`;
}

// Generic collection / argument lifecycle
export function msgNoValues(label: string) {
  return `${label}: ${NO_VALUES}`;
}

export function msgNoValue(label: string) {
  return `${label}: ${NO_VALUE}`;
}

export function msgNoRemaining(label: string) {
  return `${label}: ${NO_REMAINING}`;
}

export function msgNotArray(label: string, got: string) {
  return `${label}: ${ARG_MUST_BE_ARRAY}${gotInstead(got)}`;
}

export function msgItemNotArray(label: string, got: string) {
  return `${label}: ${TYPE_ARRAY}${gotInstead(got)}`;
}

// Key-value tuple validations
export function msgItemNotKeyValue(
  label: string,
  length: number,
  index: number,
) {
  return `${label}: must have a key-value array${BUT_GOT}length ${length}${atIndexInstead(index)}`;
}

export function msgInvalidKey(label: string, got: string, index: number) {
  return `${label}: ${NON_EMPTY_STRING_KEYS}${BUT_GOT}${got}${atIndexInstead(index)}`;
}

// Value validations
export function msgMustBeString(label: string, got: string) {
  return `${label}: ${VALUE_MUST_BE_STRING}${gotInstead(got)}`;
}

export function msgMustBeObject(label: string, got: string) {
  return `${label}: ${VALUE_MUST_BE_OBJECT}${gotInstead(got)}`;
}

export function msgMustBePositiveInteger(
  label: string,
  got: string,
  allowZero = false,
) {
  return `${label}: must be a positive integer${allowZero ? ' or zero' : ''}${gotInstead(got)}`;
}

// Generator-specific messages & conditions
export function msgMustBeEither(
  label: string,
  valA: string,
  valB: string,
  got: string,
) {
  return `${label}: must be either "${valA}" or "${valB}", got "${got}" instead`;
}

export function msgInvalidSortBy(label: string, got: unknown, index: number) {
  return `${label}: must have a valid SORT_BY value${BUT_GOT}${got}${atIndexInstead(index)}`;
}

// Standardized ignoring messages (Search)
export function msgMissingConditionArray(label: string) {
  return `${label}: ${IGNORING_ARRAY}missing condition, ${EXPECTED_IN_BETWEEN}`;
}

export function msgInvalidConditionArray(label: string, index: number) {
  return `${label}: ${IGNORING_ARRAY}invalid condition, ${EXPECTED_IN_BETWEEN} at index ${index}`;
}

export function msgInvalidBetweenSize(
  label: string,
  length: number,
  index: number,
) {
  return `${label}: ${IGNORING_ARRAY}expected 2 elements for 'between', got ${length}${atIndexInstead(index)}`;
}

export function msgInvalidBaseValue(label: string, got: string) {
  return `${label}: ${IGNORING_VALUE}expected BaseValue${gotInstead(got)}`;
}

export function msgInvalidCondition(label: string, got: unknown) {
  return `${label}: ${IGNORING_VALUE}invalid condition value, got ${got}`;
}

export function msgInvalidValueAtIndex(
  label: string,
  got: string,
  index: number,
) {
  return `${label}: ${IGNORING_VALUE}expected BaseValue, got ${got}${atIndexInstead(index)}`;
}

export function msgReservedDelimiter(
  label: string,
  target: 'key' | 'value',
  delimiters: string,
) {
  return `${label}: ${target} must not contain reserved delimiters (${delimiters})`;
}
