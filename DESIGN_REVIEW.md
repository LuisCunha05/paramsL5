# Architecture & Design Review: `params-l5`

This document details the architectural evaluation, technical critiques, and an actionable roadmap for evolving `params-l5` into a production-grade, tier-1 TypeScript library on par with industry benchmarks (such as Kysely, Zod, and TanStack).

---

## 1. Scorecard

| Area                         | Grade  | Summary                                                                                                                                       |
| :--------------------------- | :----: | :-------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tooling & Infrastructure** | **A+** | Modern bundler (`tsdown`/Rolldown), `oxlint`, `oxfmt`, `publint`, `@arethetypeswrong`, dual ESM/CJS exports.                                  |
| **Domain Research**          | **A+** | Exemplary documentation in `reference/` detailing Laravel `l5-repository` mechanics, delimiters, and SQL quirks.                              |
| **Test Suite**               | **A**  | 157 passing tests covering valid and edge-case inputs.                                                                                        |
| **API Ergonomics & DX**      | **C**  | Over-reliance on positional tuple arrays (`[['name', 'John', 'like']]`); missing structured object or fluent builder syntax.                  |
| **Runtime & Error Handling** | **D**  | Emits `console.error` by default; silently drops invalid query parameters; couples plain result object with methods.                          |
| **Type Engineering**         | **B-** | Advanced recursive types and `NoInfer`, but breaks on array relations (`Post[]`), lacks value-type correlation, and contains inconsistencies. |

---

## 2. Actionable Roadmap & Checklist

### Priority 0: Critical Runtime & Error Handling (Safety)

- [ ] **Purge Default `console.error`**
  - **Issue**: `defaultLogger` logs directly to `console.error`, polluting server logs and unit test outputs.
  - **Action**: Make logging strictly opt-in (`{ logging: false }` or no-op by default). A library should never write to standard error without explicit user request.
  - **File**: `src/logger.ts`, `src/generators/*.ts`
- [ ] **Address Silent Data Degradation**
  - **Issue**: When input validation fails (e.g. `limit(-5)`), the library silently returns `undefined`. The HTTP request proceeds without the parameter, risking massive unpaginated queries or missing filters.
  - **Action**: Decide on an error strategy:
    - **Option A (Recommended)**: Throw a custom `ParamsL5ValidationError` when arguments are invalid.
    - **Option B (Functional)**: Return a Result type: `{ success: true, data: string } | { success: false, errors: ValidationError[] }`.
    - **Option C (Permissive)**: Provide a `strict: false` configuration to allow dropping invalid fields without logging.
- [ ] **Delimiter Collision Protection (L5 Protocol Security)**
  - **Issue**: Values containing colons (`:`) or semicolons (`;`) corrupt Laravel's `explode(';', $search)` and `explode(':', $field)` parsing.
  - **Action**: Validate and reject or warn if search keys or values contain reserved delimiters (`;`, `:`, `,`).
  - **File**: `src/generators/search.ts`

### Priority 1: Architectural Deduplication & Cleanup

- [ ] **Create a Unified List Generator Factory**
  - **Issue**: `filter.ts`, `include.ts`, `with.ts`, and `with-count.ts` duplicate the exact same array-checking, string-filtering, deduplicating, and joining logic.
  - **Action**: Replace the four files with a generic higher-order generator:
    ```typescript
    function createListGenerator(
      paramKey: string,
      delimiter: ';' | ',',
      label: string,
    ) {
      return (items, options) => {
        /* unified logic */
      };
    }
    ```
  - **Benefit**: Removes ~200 lines of boilerplate, reduces bundle size by ~30–40%.
- [ ] **Unify `paramsL5` and `createClient`**
  - **Issue**: `paramsL5()` and `createClient()` maintain two duplicate parameter collection routines, and `paramsL5()` cannot accept options or logging configuration.
  - **Action**: Implement `paramsL5(input, options)` as a direct invocation of `createClient(options)(input)`.
- [ ] **Remove or Connect Dead Code in `src/utils.ts`**
  - **Issue**: `encodeSearchParam` and `decodeSearchParam` are exported in `src/utils.ts` but never called anywhere in the package.
  - **Action**: Either connect them to `query.ts` if custom RFC3986 encoding is required, or delete them to trim bundle footprint.

### Priority 2: Type System Hardening

- [ ] **Fix Array Traversal in `TPath`**
  - **Issue**: `NonObject` includes `readonly unknown[]`, preventing `TPath` from traversing 1-to-many relationships (e.g., `User.posts: Post[]` cannot generate `'posts.title'`).
  - **Action**: Unwrap array element types using an infer check (`TSource[K] extends readonly (infer TInner)[] ? TInner : TSource[K]`).
  - **File**: `src/types.ts`
- [ ] **Fix Cross-Table Order By Types**
  - **Issue**: `orderBySortBy` uses `TPath`, which rejects Laravel's cross-table join syntax (`table|column`, `table:fk|column`).
  - **Action**: Change `TOrderBySortByValue` to use `TPathPipe<TTShape>`.
  - **File**: `src/generators/order-sort.ts`
- [ ] **Correlate Search Field Values with Schema Types**
  - **Issue**: `TSearchItem` allows any `TBaseValue` regardless of the schema field type (e.g. string allowed for a number field).
  - **Action**: Correlate key and value:
    ```typescript
    type TSearchItem<TShape> = {
      [K in TPath<TShape>]: [K, ValueAtPath<TShape, K>, TCondition?];
    }[TPath<TShape>];
    ```
- [ ] **Limit Recursion Depth in `TPath`**
  - **Action**: Add a recursion counter tuple to prevent compiler stack overflows on self-referential models (e.g., `User -> Post -> User`).

### Priority 3: API Ergonomics & DX Evolution

- [ ] **Implement Structured Object Query Syntax**
  - **Issue**: Positional tuples `[['name', 'John', 'like']]` have poor autocomplete and readability.
  - **Action**: Support an object-first query syntax alongside tuples:
    ```typescript
    paramsL5<User>({
      search: {
        name: { like: 'John' },
        age: { gte: 18 },
        status: { in: ['active', 'pending'] },
      },
      orderBy: { created_at: 'desc' },
      filter: ['id', 'name', 'status'],
    });
    ```
- [ ] **Add Native `toString()` & Symbol Coercion**
  - **Issue**: Result object cannot be used directly in string templates (evaluates to `[object Object]`).
  - **Action**: Implement `.toString()` and `[Symbol.toPrimitive](hint)` so `` `${params}` `` automatically returns the compiled query string.
- [ ] **Fix Return Type Signature**
  - **Issue**: `toParams()` is typed as `() => string | undefined`, even though `query()` always returns a string (`""` when empty).
  - **Action**: Update `toParams: () => string`.

---

## 3. In-Depth Technical Analysis

### 3.1 Positional Tuples vs Object Syntax

Positional tuples require the developer to remember index positions:

- `[0]`: Field name
- `[1]`: Search value
- `[2]`: Condition (optional)

When building complex queries with 10+ filters:

```typescript
// Current syntax: nested bracket noise
search: [
  ['status', 'active', CONDITIONS.EQ],
  ['role', ['admin', 'manager'], CONDITIONS.IN],
  ['created_at', ['2026-01-01', '2026-12-31'], CONDITIONS.BTW],
]

// Target industry-standard syntax:
search: {
  status: 'active', // default condition = EQ
  role: { in: ['admin', 'manager'] },
  created_at: { between: ['2026-01-01', '2026-12-31'] },
}
```

### 3.2 The `NonObject` Array Trap in `TPath`

In `src/types.ts`:

```typescript
export type NonObject =
  | readonly unknown[] // <-- Causes recursive traversal to halt on arrays
  | Date
  | Function
  | Blob;
```

If an entity model has child collections:

```typescript
interface Post {
  id: string;
  title: string;
}

interface User {
  id: string;
  posts: Post[];
}
```

`TPath<User>` produces `"id" | "posts"`. It is impossible to type `"posts.title"`, which breaks type safety for eager-loaded nested relationships.

**Fix**:

```typescript
type Unwrap<T> = T extends readonly (infer U)[] ? U : T;

export type TPath<
  TSource,
  Depth extends unknown[] = [],
> = Depth['length'] extends 5
  ? never
  : TSource extends object
    ? {
        [K in Keys<TSource>]: Unwrap<TSource[K]> extends NonObject
          ? K
          : Unwrap<TSource[K]> extends object
            ? K | `${K}.${TPath<Unwrap<TSource[K]>, [...Depth, 1]>}`
            : K;
      }[Keys<TSource>]
    : never;
```

### 3.3 Delimiter Collisions in Search Values

Laravel's `l5-repository` executes:

```php
$search = explode(';', $request->get('search'));
foreach ($search as $field) {
    [$name, $value] = explode(':', $field);
}
```

If a query contains:

```typescript
search: [['title', 'Alpha: Part 1; Special Edition']];
```

`params-l5` emits `title:Alpha: Part 1; Special Edition`. Once received and decoded by Laravel, `explode(';')` splits this into `["title:Alpha: Part 1", " Special Edition"]`, causing SQL syntax exceptions or unhandled server 500s. The library must validate against unescaped `;` and `:` in values.

---

## 4. Benchmark Reference: Ideal Target Architecture

```typescript
import { createL5Client } from 'params-l5';

// 1. Configured client instance
const l5 = createL5Client({
  defaults: { limit: 15, sortBy: 'desc' },
  strict: true, // Throws on invalid input instead of silent drops
});

// 2. Type-safe query generation with object syntax & auto-coercion
const query = l5.query<User>({
  select: ['id', 'name', 'email'],
  include: ['posts', 'profile'],
  where: {
    status: 'active',
    age: { gte: 18 },
  },
  orderBy: { created_at: 'desc' },
  page: 1,
});

// 3. String template coercion
const url = `https://api.example.com/users?${query}`;
```
