# Testing Guidelines and Examples

This document outlines the standard structure, naming conventions, and patterns used for writing tests in this project. Use this as a reference or provide it to AI to ensure consistency across the test suite.

## 1. Imports and Setup

Use `vitest` for the testing framework.

```typescript
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
```

## 2. Global Test Variables

Instead of declaring variables inside every test, define `input`, `result`, and `expected` variables at the top of the file to be reused across all tests in that suite. Clear them in a `beforeEach` block to ensure test isolation.

```typescript
// biome-ignore lint/suspicious/noExplicitAny: Used to avoid many ts-expected-errors in the tests
let input: any;
let result: string | undefined;
let expected: string | undefined;

beforeEach(() => {
  input = undefined;
  result = undefined;
  expected = undefined;
});
```

## 3. Mocking Dependencies

Use `vi.spyOn` to mock global functions (e.g., `console.error`) or imported dependencies. Ensure that all mocks are cleared in an `afterEach` hook to avoid side effects bleeding into other tests.

```typescript
const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

afterEach(() => {
  vi.clearAllMocks();
});
```

## 4. Test Organizing and Structure

Organize tests logically using `describe` blocks. Use nested `describe` blocks to group related test cases by category (e.g., "formatting", "validations and edge cases", "logging").

### General Test Case Structure

Each individual `test` should ideally contain exactly **one** `expect` assertion. Follow the **Arrange-Act-Assert** pattern, separating variable assignment, function execution, and verification.

1. **Arrange**: Set the `input` and `expected` values.
2. **Act**: Call the function and assign it to `result`.
3. **Assert**: Run your `expect` on the `result`.

```typescript
describe("someFunction function", () => {
  describe("formatting", () => {
    test("should set someFunction to a parameter", () => {
      input = 7;
      expected = "someValue";

      result = someFunction(input);

      expect(result).toBe(expected);
    });
  });
});
```

### Edge Cases and Validations

Test for boundary conditions and invalid inputs explicitly.

```typescript
describe("someFunction function", () => {
  describe("validations and edge cases", () => {
    test("should return undefined if called Infinity number", () => {
      input = Infinity;
      result = someFunction(input);

      expect(result).toBeUndefined();
    });
  });
});
```

### Testing Logs and Side Effects

When testing side effects (like logs), you often do not need to assign the function call to `result`. Just call the function with the `input` and assert that the mocked function was called correctly.

```typescript
describe("someFunction function", () => {
  describe("someFunction logging", () => {
    test("should log error if argument is a negative number", () => {
      input = -1; // Provide the input

      someFunction(input); // Act on the input

      // Assert on the mocked function
      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining("some log message"),
      );
    });
  });
});
```

## 5. Using Constants

Whenever asserting on formatted strings that include URL encoded characters, specific conditions, or other shared values, use the constants defined in `src/constants.ts` (e.g., `CONDITIONS`, `URL_ENCODED_CHARS` as `URC`) rather than hardcoding the raw strings. This ensures consistency and prevents test failures if the underlying values change.

```typescript
import { CONDITIONS, URL_ENCODED_CHARS as URC } from "@/constants";

// Example of using constants in assertions
describe("formatting", () => {
  test("should format a valid key-value pair with a specific condition", () => {
    input = [["age", 18, CONDITIONS.GTE]];

    // Use URC constants for URL formatting characters
    expected = `search=age${URC.COLON}18&searchFields=age${URC.COLON}${URC.GREATER_THAN}${URC.EQUALS}`;

    result = search(input);

    expect(result).toBe(expected);
  });
});
```
