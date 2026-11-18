# params-l5

A type-safe TypeScript/JavaScript utility package to generate query strings for Laravel's [l5-repository](https://github.com/andersao/l5-repository) package.

`params-l5` builds, validates, and URL-encodes `l5-repository` parameters with zero runtime dependencies, full ESM/CJS support, and optional schema-level TypeScript inference.

## Installation

```bash
npm install params-l5
# or
yarn add params-l5
# or
pnpm add params-l5
```

Requires Node.js `>=20.0.0`.

## Features

- **Search**: Object-based field queries with conditions (`eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `in`, `like`, `ilike`, `btw`) and shorthand equality.
- **SearchFields**: Optional `searchFields` generation (`includeSearchFields: true`) with delimiter collision checks.
- **SearchJoin**: Logical operator (`and` | `or`) across search fields.
- **Filter**: Limit returned columns (`filter=id;name`).
- **Include**: Request related resources (`include=profile,posts`).
- **With / WithCount**: Eager-load relations (`with=author;comments.author`) and relation counts (`withCount=comments;likes`).
- **OrderBy / SortBy**: Object-based multi-column sorting (`orderBy` & `sortedBy`), including `l5-repository` relation pipe syntax (`posts|title`, `posts:user_id|title`).
- **Limit & Page**: Integer pagination controls with configurable defaults.
- **Strict or Permissive Validation**: Throws/returns `ParamsL5ValidationError` with structured `issues` by default (`strict: true`), or drops invalid entries and falls back to defaults (`strict: false`).

## Quick Start

```typescript
import { ParamsL5, SEARCH_JOIN, SORT_BY } from 'params-l5';

const params = ParamsL5.build({
  search: {
    name: { like: 'John' },
    age: { gte: 18 },
    status: { in: ['active', 'pending'] },
  },
  includeSearchFields: true,
  searchJoin: SEARCH_JOIN.AND,
  filter: ['id', 'name', 'age', 'status'],
  include: ['profile', 'posts'],
  with: ['profile'],
  withCount: ['posts'],
  orderBySortBy: { created_at: SORT_BY.DESC },
  limit: 15,
  page: 2,
});

console.log(params.toParams());
// => "filter=id%3Bname%3Bage%3Bstatus&include=profile%2Cposts&limit=15&orderBy=created_at&page=2&search=name%3AJohn%3Bage%3A18%3Bstatus%3Aactive%2Cpending&searchFields=name%3Alike%3Bage%3A%3E%3D%3Bstatus%3Ain&searchJoin=and&sortedBy=desc&with=profile&withCount=posts"

// Also supports template literal / String() coercion:
const url = `https://api.example.com/users?${params}`;
```

## Type-Safe Model Queries (`ParamsL5.for<T>()`)

Pass your model/DTO type to `ParamsL5.for<T>()` (or `client.for<T>()`) for compile-time validation of field paths, relation pipes, search operator/value compatibility, and duplicate path detection:

```typescript
import { ParamsL5 } from 'params-l5';

interface User {
  id: string;
  name: string;
  age: number;
  profile?: { city: string } | null;
  posts: { title: string }[];
}

const userParams = ParamsL5.for<User>({
  defaultOptions: { limit: 20 },
});

const query = userParams.build({
  filter: ['id', 'name', 'profile.city'],
  include: ['profile', 'posts'],
  search: {
    name: { like: 'Alice' },
    age: { btw: [18, 65] },
    'profile.city': 'NYC',
  },
  orderBySortBy: {
    'posts|title': 'asc',
    name: 'desc',
  },
});
```

## Reusable Client & Options

Instantiate `new ParamsL5(options)` to share defaults, validation mode, and logging across requests:

```typescript
import { CONDITIONS, ParamsL5, SEARCH_JOIN, SORT_BY } from 'params-l5';

const client = new ParamsL5({
  defaultOptions: {
    limit: 25,
    page: 1,
    sortBy: SORT_BY.DESC,
    searchJoin: SEARCH_JOIN.AND,
    searchCondition: CONDITIONS.LIKE,
    includeSearchFields: true,
  },
  strict: true, // default; set to false to ignore invalid entries and use fallbacks
  logging: {
    logLevel: { error: true, warn: true, info: false },
  },
});

const params = client.build({
  search: { name: 'John' },
  orderBySortBy: { created_at: true }, // uses defaultOptions.sortBy ('desc')
});
```

## Safe Mode (`safe()`) & Error Handling

Use `.safe()` instead of `.build()` to receive a discriminated union result (`{ success: true, data } | { success: false, error }`) without throwing:

```typescript
import { ParamsL5, ParamsL5ValidationError } from 'params-l5';

const result = ParamsL5.safe({ limit: -5, page: 0 });

if (!result.success) {
  // result.error is ParamsL5ValidationError
  console.error(result.error.message);
  console.error(result.error.issues);
}

// Or catch when using build():
try {
  ParamsL5.build({ limit: -5 });
} catch (err) {
  if (err instanceof ParamsL5ValidationError) {
    console.error(err.issues);
  }
}
```

## Standalone Generators

Each parameter generator can also be used independently with `.build()` / `.safe()`, alongside `query()` to compile raw parameter objects:

- `Filter`, `Include`, `With`, `WithCount`
- `Search`, `SearchJoin`
- `OrderBySortBy`
- `Limit`, `Page`
- `query`

```typescript
import { Filter, Limit, query } from 'params-l5';

const { filter } = Filter.build(['id', 'name']);
const { limit } = Limit.build(10);

query({ filter, limit }); // => "filter=id%3Bname&limit=10"
```

## Constants

- **`CONDITIONS`**: `EQ` (`'='`), `NEQ` (`'!='`), `GT` (`'>'`), `GTE` (`'>='`), `LT` (`'<'`), `LTE` (`'<='`), `IN` (`'in'`), `LIKE` (`'like'`), `ILIKE` (`'ilike'`), `BTW` (`'between'`)
- **`SEARCH_JOIN`**: `AND` (`'and'`), `OR` (`'or'`)
- **`SORT_BY`**: `ASC` (`'asc'`), `DESC` (`'desc'`)

## Development

- `pnpm test` - Run tests with Vitest
- `pnpm build` - Type-check and build CJS/ESM bundles & declarations
- `pnpm lint` - Run `oxlint`
- `pnpm fmt:check` - Verify formatting with `oxfmt` (`pnpm fmt` to format)

## License

MIT
