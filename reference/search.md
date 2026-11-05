# Search Parameters: `search`, `searchFields`, and `searchJoin`

> **File:** `Prettus\Repository\Criteria\RequestCriteria.php`  
> **Config:** `config('repository.criteria.params.search')`, `searchFields`, `searchJoin`, `acceptedConditions`

---

## Table of Contents

1. [Overview & Prerequisites](#overview--prerequisites)
2. [How It Works: Under the Hood](#how-it-works-under-the-hood)
3. [Search Modes](#search-modes)
   - [Global Search](#1-global-search)
   - [Field-Specific Search](#2-field-specific-search)
   - [Hybrid Search](#3-hybrid-search)
4. [Conditions & Operators](#conditions--operators)
   - [Equality (`=`)](#equality-)
   - [Partial Match (`like` & `ilike`)](#partial-match-like--ilike)
   - [Array Inclusion (`in`)](#array-inclusion-in)
   - [Range (`between`)](#range-between)
   - [Comparison Operators (`>`, `>=`, `<`, `<=`, `!=`)](#comparison-operators----)
5. [Dynamic Conditions via `searchFields`](#dynamic-conditions-via-searchfields)
6. [Relationship Queries (Dot Notation)](#relationship-queries-dot-notation)
7. [Boolean Logic with `searchJoin`](#boolean-logic-with-searchjoin)
8. [Common Mistakes & Traps](#common-mistakes--traps)
9. [Examples: Correct vs. Incorrect](#examples-correct-vs-incorrect)

---

## Overview & Prerequisites

Searching is the most sophisticated parsing feature in `l5-repository`. It allows API clients to execute complex database queries across multiple columns and relations through URL query strings.

### The Golden Rule: Repository `$fieldSearchable`
Before any `search` query can work, the target repository **must** explicitly define which fields are searchable via the `$fieldSearchable` property:

```php
namespace App\Repositories;

use Prettus\Repository\Eloquent\BaseRepository;

class PostRepository extends BaseRepository
{
    protected $fieldSearchable = [
        'title' => 'like',
        'slug',                  // defaults to '='
        'author.name' => 'like', // relationship query
        'status' => 'in',
        'views' => '>=',
    ];

    public function model()
    {
        return Post::class;
    }
}
```

> [!CRITICAL]
> If `$fieldSearchable` is empty (`[]`) or omitted from the repository, `RequestCriteria` **silently ignores all search parameters** and runs an unfiltered query.

---

## How It Works: Under the Hood

When `RequestCriteria::apply()` runs, the search parsing executes in 5 sequential stages:

```
1. Request Input
   search=title:Laravel;views:100&searchFields=views:>&searchJoin=and
        │
        ├─► parserSearchData()      ──► ['title' => 'Laravel', 'views' => '100']
        ├─► parserSearchValue()     ──► null
        ├─► parserFieldsSearch()    ──► ['title' => 'like', 'views' => '>']
        │
2. Eloquent Builder Construction
   $model->where(function ($query) {
       $query->where('posts.title', 'like', '%Laravel%');
       $query->where('posts.views', '>', '100');
   });
```

### Stage 1: `parserSearchData($search)`
Splits `$search` by `;`. For each segment containing a `:`, it calls:
```php
list($field, $value) = explode(':', $row);
$searchData[$field] = $value;
```

### Stage 2: `parserSearchValue($search)`
Extracts a global search term if one was passed. If any segment in `$search` lacks a `:`, that segment is returned as the fallback `$search` value. If all segments contain colons, it returns `null`.

### Stage 3: `parserFieldsSearch($fieldsSearchable, $searchFields, $dataKeys)`
1. Checks if any dynamic condition in `searchFields` is allowed by `config('repository.criteria.acceptedConditions')`.
2. Merges fields found in `search` (`$dataKeys`) with fields in `searchFields`.
3. Intersects them against the repository's `$fieldSearchable`.
4. If `searchFields` contains non-searchable fields resulting in 0 matches, it **throws an Exception**.

### Stage 4: Query Building
All search conditions are nested inside a single Eloquent closure:
```php
$model = $model->where(function ($query) use (...) { ... });
```
This ensures database precedence: `WHERE (condition1 OR condition2) AND deleted_at IS NULL`.

---

## Search Modes

### 1. Global Search
Pass a single raw string without colons:
```
?search=john
```
- Iterates over **all** fields declared in `$fieldSearchable` (except those defined with `in` or `between`).
- Applies the value to each column using that column's configured condition.
- **Generated SQL** (assuming `name => 'like'`, `email => 'like'`):
  ```sql
  WHERE (users.name LIKE '%john%' OR users.email LIKE '%john%')
  ```

### 2. Field-Specific Search
Specify key-value pairs using `:` separated by `;`:
```
?search=name:John;email:john@example.com
```
- Only filters `name` and `email`.
- Ignores other fields in `$fieldSearchable`.
- By default, combines fields using `OR` unless `searchJoin=and` is supplied.

### 3. Hybrid Search
Pass both key-value pairs and a loose string:
```
?search=status:active;john
```
- For `status`, it queries `status = 'active'`.
- For all other fields in `$fieldSearchable`, it queries `LIKE '%john%'`!

---

## Conditions & Operators

### Equality (`=`)
Used when a field is specified as a string without a condition, or explicitly with `=`:
```php
protected $fieldSearchable = ['status']; // defaults to '='
```
- URL: `?search=status:active`
- SQL: `WHERE table.status = 'active'`

### Partial Match (`like` & `ilike`)
```php
protected $fieldSearchable = ['title' => 'like'];
```
- URL: `?search=title:quick`
- `RequestCriteria` **automatically wraps the value with `%`**:
  ```php
  $value = "%{$searchData[$field]}%";
  ```
- SQL: `WHERE table.title LIKE '%quick%'`
- `ilike` behaves identically in PHP code (wrapped in `%...%`), emitting `WHERE table.title ILIKE '%quick%'` (PostgreSQL case-insensitive matching).

> [!NOTE]
> Do **not** send `%` in the URL parameter. Sending `search=title:%quick%` results in SQL `LIKE '%%quick%%'`.

### Array Inclusion (`in`)
```php
protected $fieldSearchable = ['role' => 'in'];
```
- Comma-delimited list:
  ```
  ?search=role:admin,manager,editor
  ```
- `RequestCriteria` executes:
  ```php
  $value = explode(',', $value);
  $query->whereIn($modelTableName.'.'.$field, $value);
  ```
- SQL: `WHERE table.role IN ('admin', 'manager', 'editor')`

### Range (`between`)
```php
protected $fieldSearchable = ['age' => 'between'];
```
- Requires at least two comma-delimited items:
  ```
  ?search=age:18,30
  ```
- `RequestCriteria` executes:
  ```php
  $value = explode(',', $value);
  if (count($value) < 2) { $value = null; }
  $query->whereBetween($modelTableName.'.'.$field, $value);
  ```
- SQL: `WHERE table.age BETWEEN '18' AND '30'`

### Comparison Operators (`>`, `>=`, `<`, `<=`, `!=`)
You can define numeric/comparison operators in `$fieldSearchable`:
```php
protected $fieldSearchable = [
    'price' => '>=',
    'stock' => '>',
    'status' => '!=',
];
```
- URL: `?search=price:100;stock:0;status:archived`
- SQL: `WHERE table.price >= '100' AND table.stock > '0' AND table.status != 'archived'` (with `searchJoin=and`)

---

## Dynamic Conditions via `searchFields`

The `searchFields` parameter allows the API consumer to dynamically specify or override the search condition for a column.

Syntax: `searchFields=field1:condition1;field2:condition2`

```
?search=name:John;age:25&searchFields=name:like;age:=
```

### The `acceptedConditions` Whitelist Guard
In `config/repository.php`:
```php
'acceptedConditions' => [
    '=',
    'like',
    'in',
],
```
When `searchFields` is parsed:
```php
if (in_array($field_parts[1], $acceptedConditions)) {
    // Condition override is accepted
}
```
If a client attempts to pass a condition not in `acceptedConditions` (for example `searchFields=age:>=`), **the override is silently ignored**, and the repository's default condition from `$fieldSearchable` remains active.

### Strict Field Validation
If `searchFields` specifies fields that are not in the repository's `$fieldSearchable`, `RequestCriteria` calculates:
```php
if (count($fields) == 0) {
    throw new \Exception(trans('repository::criteria.fields_not_accepted', [
        'field' => implode(',', $searchFields)
    ]));
}
```
This triggers an HTTP 500 error: `"Some Fields (xyz) are not accepted to query"`.

---

## Relationship Queries (Dot Notation)

`RequestCriteria` natively supports querying relationships using standard dot notation:

```php
protected $fieldSearchable = [
    'author.name' => 'like',
    'comments.author.email' => '=',
];
```

In `RequestCriteria.php`:
```php
if (stripos($field, '.')) {
    $explode = explode('.', $field);
    $field = array_pop($explode);       // 'name'
    $relation = implode('.', $explode); // 'author' or 'comments.author'

    $query->whereHas($relation, function ($query) use ($field, $condition, $value) {
        $query->where($field, $condition, $value);
    });
}
```

URL:
```
?search=author.name:Taylor
```
SQL:
```sql
WHERE EXISTS (
    SELECT * FROM authors 
    WHERE posts.author_id = authors.id 
      AND authors.name LIKE '%Taylor%'
)
```

Nested relationships (`comments.author.email`) resolve into nested `whereHas` calls automatically supported by Laravel Eloquent.

---

## Boolean Logic with `searchJoin`

By default, when multiple search fields are matched, `RequestCriteria` joins them with **`OR`**:

- Default:
  ```
  ?search=name:John;email:doe
  ```
  SQL:
  ```sql
  WHERE (users.name = 'John' OR users.email = 'doe')
  ```

- With `searchJoin=and`:
  ```
  ?search=name:John;email:doe&searchJoin=and
  ```
  SQL:
  ```sql
  WHERE (users.name = 'John' AND users.email = 'doe')
  ```

Implementation detail:
```php
$modelForceAndWhere = strtolower($searchJoin) === 'and';

if ($isFirstField || $modelForceAndWhere) {
    $query->where(...);
    $isFirstField = false;
} else {
    $query->orWhere(...);
}
```

---

## Common Mistakes & Traps

### 1. Searching for "0" (The PHP Falsy Bug)
```php
// RequestCriteria.php line 51:
if ($search && is_array($fieldsSearchable) && count($fieldsSearchable))
```
If a client sends `?search=0`, PHP evaluates `"0"` to boolean `false`. The entire search block is skipped!  
**Workaround:** Pass field notation: `?search=id:0` (since `stripos('id:0', ':')` is non-empty, `$search` evaluates to truthy).

### 2. Colons in Search Values (Truncation Trap)
```php
list($field, $value) = explode(':', $row);
```
`explode(':', ...)` has no limit parameter. If the search value contains a colon (e.g. `created_at:2026-11-05 14:00:00` or `url:https://google.com`), only the first two elements are captured:
- `$field = 'url'`
- `$value = 'https'` (everything after the colon is discarded!)

### 3. Whitespace Around Delimiters
Segments are not trimmed before splitting:
- `?search=name:John ; email:doe`
- `$field` becomes `' email'` (with a leading space), which will not match `'email'` in `$fieldSearchable`.

### 4. Global Search Skips `in` and `between`
```php
if (!is_null($search) && !in_array($condition, ['in', 'between'])) { ... }
```
If a repository configures `'role' => 'in'`, and the client sends a global search `?search=admin`, the `role` field is completely skipped. `in` and `between` can only be queried via explicit field pairs (`role:admin`).

### 5. Using Comma Instead of Semicolon for Pairs
- Incorrect: `?search=name:John,email:doe`
- Result: Parses as a single field with key `'name'` and value `'John,email:doe'`.

---

## Examples: Correct vs. Incorrect

### 1. Equality and Multiple Fields with AND
- ❌ **Incorrect (uses comma and default OR):**
  ```
  ?search=status:active,role:admin
  ```
-  **Correct:**
  ```
  ?search=status:active;role:admin&searchJoin=and
  ```

### 2. Partial Search with LIKE
- ❌ **Incorrect (manually adding SQL % wildcards):**
  ```
  ?search=title:%Laravel%
  ```
-  **Correct (l5 adds wildcards automatically):**
  ```
  ?search=title:Laravel
  ```

### 3. List Matching (IN)
- ❌ **Incorrect (using semicolons inside IN):**
  ```
  ?search=status:active;pending
  ```
-  **Correct (semicolon separates fields, comma separates IN values):**
  ```
  ?search=status:active,pending
  ```

### 4. Date Range Matching (BETWEEN)
- ❌ **Incorrect (only 1 date given):**
  ```
  ?search=created_at:2026-01-01
  ```
-  **Correct (requires exactly 2 comma-separated items):**
  ```
  ?search=created_at:2026-01-01,2026-12-31
  ```

### 5. Overriding Condition Dynamically
- ❌ **Incorrect (specifying non-searchable field or unapproved condition):**
  ```
  ?search=password:secret&searchFields=password:like
  ```
  *(Throws Exception: fields not accepted)*
-  **Correct (both field is searchable and condition is in `acceptedConditions`):**
  ```
  ?search=name:John&searchFields=name:like
  ```
