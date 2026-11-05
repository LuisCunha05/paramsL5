# L5 Repository Query Parameters: Complete Technical Reference

> **Deep-dive architectural and parameter parsing reference for [`andersao/l5-repository`](https://github.com/andersao/l5-repository)**.  
> Compiled directly from source code inspection of `Prettus\Repository\Criteria\RequestCriteria`, `Prettus\Repository\Presenter\FractalPresenter`, and `Prettus\Repository\Eloquent\BaseRepository`.

---

## Table of Contents

1. [Architecture Overview & Lifecycle](#architecture-overview--lifecycle)
2. [Master Parameter Cheat Sheet & Delimiter Matrix](#master-parameter-cheat-sheet--delimiter-matrix)
3. [Component Documentation Index](#component-documentation-index)
4. [Configuration Reference (`config/repository.php`)](#configuration-reference-configrepositoryphp)
5. [Global Quirks, Edge Cases & Hidden Traps](#global-quirks-edge-cases--hidden-traps)

---

## Architecture Overview & Lifecycle

Parameters sent in HTTP requests are parsed by different layers in `l5-repository`:

```
                       HTTP Request Query String
                                  │
      ┌───────────────────────────┼───────────────────────────┐
      │                           │                           │
      ▼                           ▼                           ▼
┌──────────────┐           ┌──────────────┐           ┌──────────────┐
│ Request      │           │ Fractal      │           │ Base         │
│ Criteria     │           │ Presenter    │           │ Repository   │
└──────┬───────┘           └──────┬───────┘           └──────┬───────┘
       │                          │                          │
       ├─ search                  └─ include                 ├─ limit
       ├─ searchFields                                       ├─ page
       ├─ searchJoin                                         └─ skipCache
       ├─ filter
       ├─ orderBy / sortedBy
       ├─ with
       └─ withCount
```

### 1. `RequestCriteria` Layer (`Prettus\Repository\Criteria\RequestCriteria`)
Executed when `$repository->pushCriteria(app(RequestCriteria::class))` is called on a repository. It inspects the `Request` instance, constructs Eloquent query builder constraints (`where`, `orWhere`, `whereHas`, `select`, `with`, `withCount`, `orderBy`, `leftJoin`), and returns the mutated Eloquent model/builder instance.

### 2. `FractalPresenter` Layer (`Prettus\Repository\Presenter\FractalPresenter`)
Executed during the repository result serialization lifecycle (`$repository->parserResult($results)`). If a Fractal Presenter is bound to the repository, it extracts the `include` parameter and forwards it to `League\Fractal\Manager::parseIncludes()`.

### 3. `BaseRepository` & Cache Layer (`Prettus\Repository\Eloquent\BaseRepository`)
Handles pagination limit resolution, query appending for pagination metadata (`$results->appends(...)`), and cache bypass flags (`skipCache`) via `CacheableRepository`.

---

## Master Parameter Cheat Sheet & Delimiter Matrix

| Parameter | Handled By | Delimiter | Default | Example | Config Key |
|---|---|---|---|---|---|
| [`search`](./search.md) | `RequestCriteria` | Pairs: `;`<br>Key-Value: `:`<br>Array: `,` | `null` | `name:John;status:active,pending` | `repository.criteria.params.search` |
| [`searchFields`](./search.md) | `RequestCriteria` | Fields: `;`<br>Condition: `:` | `null` | `name:like;age:=` | `repository.criteria.params.searchFields` |
| [`searchJoin`](./search.md) | `RequestCriteria` | Single token | `'or'` | `and` or `or` | `repository.criteria.params.searchJoin` |
| [`filter`](./filter.md) | `RequestCriteria` | Columns: `;` | `null` | `id;title;created_at` | `repository.criteria.params.filter` |
| [`orderBy`](./order-by.md) | `RequestCriteria` | Columns: `;`<br>Join: `\|`<br>Keys: `:` and `,` | `null` | `categories:cat_id\|name;created_at` | `repository.criteria.params.orderBy` |
| [`sortedBy`](./order-by.md) | `RequestCriteria` | Directions: `;` | `'asc'` | `desc;asc` | `repository.criteria.params.sortedBy` |
| [`with`](./with.md) | `RequestCriteria` | Relations: `;` | `null` | `user;comments.author` | `repository.criteria.params.with` |
| [`withCount`](./with.md) | `RequestCriteria` | Relations: `;` | `null` | `comments;likes` | `repository.criteria.params.withCount` |
| [`include`](./include.md) | `FractalPresenter` | Relations: `,` | `null` | `author,comments.author` | `repository.fractal.params.include` |
| [`skipCache`](./pagination-and-cache.md) | `CacheableRepository` | Single token | `false` | `true` or `1` | `repository.cache.params.skipCache` |
| [`limit`](./pagination-and-cache.md) | `BaseRepository::paginate` | Integer | `15` | `25` | `repository.pagination.limit` |
| [`page`](./pagination-and-cache.md) | Laravel Paginator | Integer | `1` | `2` | N/A (Laravel core) |

> [!WARNING]
> **Delimiter Inconsistency Trap**: Note that while almost all `RequestCriteria` multi-value parameters (`filter`, `with`, `withCount`, `orderBy`, `sortedBy`, `search`) use **semicolons (`;`)**, `include` (Fractal) and array values inside `search` (`in` and `between`) use **commas (`,`)**.

---

## Component Documentation Index

For detailed mechanics, code excerpts, SQL output, and common mistakes, consult the dedicated guides:

- **[Search, SearchFields & SearchJoin (`search.md`)](./search.md)**:
  Global vs. field-specific search, operators (`=`, `like`, `ilike`, `in`, `between`), dynamic conditions whitelist, relationship queries via dot notation, and `and`/`or` boolean grouping.
- **[Filter (`filter.md`)](./filter.md)**:
  SQL column projection (`select()`), why semicolon is mandatory (despite misleading config comments), and risks of dropping primary/foreign keys.
- **[With & WithCount (`with.md`)](./with.md)**:
  Eloquent eager-loading at database level, semicolon delimiter, nested dot-notation relations, and safety considerations.
- **[Include (`include.md`)](./include.md)**:
  Fractal Transformer includes, comma delimiter, difference between `with` and `include`, and resolving the N+1 query disaster.
- **[OrderBy & SortedBy (`order-by.md`)](./order-by.md)**:
  Multi-column sorting, fallback directions, and the hidden cross-table `LEFT JOIN` syntax (`table|column`, `table:fk|column`, `table:fk,pk|column`).
- **[Pagination & Cache (`pagination-and-cache.md`)](./pagination-and-cache.md)**:
  `limit`, `page`, parameter preservation across pagination links, and the `skipCache` parameter.

---

## Configuration Reference (`config/repository.php`)

All parameter names can be customized via Laravel's configuration:

```php
return [
    'pagination' => [
        'limit' => 15,
    ],

    'fractal' => [
        'params' => [
            'include' => 'include',
        ],
        'serializer' => League\Fractal\Serializer\DataArraySerializer::class,
    ],

    'cache' => [
        'enabled' => false,
        'minutes' => 30,
        'repository' => 'cache',
        'clean' => [
            'enabled' => true,
            'on' => [
                'create' => true,
                'update' => true,
                'delete' => true,
            ],
        ],
        'params' => [
            'skipCache' => 'skipCache',
        ],
        'allowed' => [
            'only' => null,
            'except' => null,
        ],
    ],

    'criteria' => [
        'acceptedConditions' => [
            '=',
            'like',
            'in',
        ],
        'params' => [
            'search'       => 'search',
            'searchFields' => 'searchFields',
            'filter'       => 'filter',
            'orderBy'      => 'orderBy',
            'sortedBy'     => 'sortedBy',
            'with'         => 'with',
            'searchJoin'   => 'searchJoin',
            'withCount'    => 'withCount',
        ],
    ],
];
```

---

## Global Quirks, Edge Cases & Hidden Traps

### 1. Semicolons vs URL Encoding
In URLs, semicolons `;` are reserved characters (RFC 3986, sub-delimiters). While modern web servers (Nginx, Apache) and PHP parse raw `;` in query strings without issue, standard client libraries (like JavaScript's `URLSearchParams` or `encodeURIComponent`) encode `;` as `%3B`. `l5-repository` handles both raw `;` and decoded `%3B` identically because PHP decodes `$_GET` before `RequestCriteria` executes.

### 2. The PHP "0" Falsy Check Bug
In `RequestCriteria.php`:
```php
if ($search && is_array($fieldsSearchable) && count($fieldsSearchable))
```
In PHP, the string `"0"` evaluates to `false`. If a user queries `?search=0` or `?search=status:0`, `$search` evaluates to false, and the search filter is **completely bypassed**!

### 3. Missing `fieldSearchable` on the Repository
If the Repository class does not define `$fieldSearchable = [...]`, passing `?search=...` has **no effect**. `RequestCriteria` silently ignores the search parameter.

### 4. Raw Colon Delimiter Collisions
`RequestCriteria::parserSearchData()` splits by colon:
```php
list($field, $value) = explode(':', $row);
```
Because no limit argument is passed to `explode()`, searching for values containing colons (such as times `14:30`, URLs `https://example.com`, or timestamps) will lose everything after the second colon!
