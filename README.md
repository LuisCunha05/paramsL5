# params-l5

A robust TypeScript/JavaScript utility package to generate query strings for the [l5-repository](https://github.com/andersao/l5-repository) package in Laravel.

This package simplifies the process of constructing complex URL parameters, ensuring type safety and correct URL encoding out of the box.

## Installation

```bash
npm install params-l5
# or
yarn add params-l5
# or
pnpm add params-l5
```

## Features

- [x] **Search**: Search multiple fields with different conditions (`=`, `>=`, `<=`, `>`, `<`, `!=`, `in`, `like`, `ilike`, `between`).
- [x] **SearchFields**: Specify the condition for each searched field (opt-in via `includeSearchFields: true`).
- [x] **SearchJoin**: Specify `and` or `or` across multiple search parameters.
- [x] **Filter**: Limit the fields returned in the response.
- [x] **Include**: Request related entities in the response.
- [x] **With**: Define relations to be eager-loaded.
- [x] **OrderBy / SortBy**: Order results by a specific field in `asc` or `desc` order.
- [x] **Limit**: Restrict the number of returned results per page.
- [x] **Page**: Specify the pagination page to retrieve.

## Usage

```typescript
import { paramsL5, CONDITIONS, SORT_BY, SEARCH_JOIN } from 'params-l5';

const queryParams = paramsL5({
  search: [
    ['name', 'John', CONDITIONS.LIKE],
    ['age', 18, CONDITIONS.GTE],
    ['status', ['active', 'pending'], CONDITIONS.IN],
  ],
  includeSearchFields: true,
  searchJoin: SEARCH_JOIN.AND,
  filter: ['id', 'name', 'age', 'status'],
  include: ['profile', 'posts'],
  orderBySortBy: [['created_at', SORT_BY.DESC]],
  limit: 15,
  page: 2,
});

// Access the compiled raw query string:
console.log(queryParams.toParams());

// Example Output representation (URL Encoded):
// filter=id%3Bname%3Bage%3Bstatus&include=profile%2Cposts&limit=15&orderBy=created_at&page=2&search=name%3AJohn%3Bage%3A18%3Bstatus%3Aactive%2Cpending&searchFields=name%3Alike%3Bage%3A%3E%3D%3Bstatus%3Ain&searchJoin=and&sortedBy=desc
```

## Constants & Helpers

The package exports robust constants to prevent typos and ensure valid query formats:

- **`CONDITIONS`**: `EQ`, `GTE`, `LTE`, `GT`, `LT`, `DIFF`, `IN`, `LIKE`, `ILIKE`, `BTW`
- **`SEARCH_JOIN`**: `AND`, `OR`
- **`SORT_BY`**: `ASC`, `DESC`

## Development

- `pnpm test` - Run tests using vitest
- `pnpm build` - Compile TypeScript to standard module formats
- `pnpm format` - Auto-format the codebase

## License

MIT
