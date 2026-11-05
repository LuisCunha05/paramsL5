# Filter Parameter: `filter`

> **File:** `Prettus\Repository\Criteria\RequestCriteria.php`  
> **Config:** `config('repository.criteria.params.filter', 'filter')`

---

## Table of Contents

1. [Overview](#overview)
2. [How It Works: Under the Hood](#how-it-works-under-the-hood)
3. [The Semicolon Delimiter Rule](#the-semicolon-delimiter-rule)
4. [The Critical Config Comment Trap](#the-critical-config-comment-trap)
5. [Array Query Syntax Support](#array-query-syntax-support)
6. [Critical Side Effects & Common Mistakes](#critical-side-effects--common-mistakes)
   - [Dropping the Primary Key (`id`)](#1-dropping-the-primary-key-id)
   - [Breaking Relationships & Eager Loading (Foreign Keys)](#2-breaking-relationships--eager-loading-foreign-keys)
   - [Breaking Fractal Presenters / Transformers](#3-breaking-fractal-presenters--transformers)
   - [Ambiguous Column Collisions on Joins](#4-ambiguous-column-collisions-on-joins)
7. [Examples: Correct vs. Incorrect](#examples-correct-vs-incorrect)

---

## Overview

The `filter` parameter controls **SQL column projection** (`SELECT`). It restricts the database columns retrieved from the table, reducing network bandwidth, query latency, and PHP memory consumption.

---

## How It Works: Under the Hood

The implementation in `RequestCriteria.php` (lines 164–170) is minimal and direct:

```php
if (isset($filter) && !empty($filter)) {
    if (is_string($filter)) {
        $filter = explode(';', $filter);
    }

    $model = $model->select($filter);
}
```

### Execution Flow:
1. `RequestCriteria` retrieves the parameter value from `$request->get('filter')`.
2. If it is a string, it splits the string by the semicolon character (`;`).
3. It passes the resulting array directly into Laravel Eloquent's `$model->select($filter)` method.
4. The generated SQL becomes:
   ```sql
   SELECT `id`, `name`, `email` FROM `users` WHERE ...
   ```

---

## The Semicolon Delimiter Rule

Unlike many REST APIs that separate projection fields with commas (`,`), `l5-repository` uses **semicolons (`;`)**:

```
?filter=id;title;status;created_at
```

PHP parses this into:
```php
['id', 'title', 'status', 'created_at']
```
And passes it to Eloquent:
```php
$model->select(['id', 'title', 'status', 'created_at']);
```

---

## The Critical Config Comment Trap

> [!CAUTION]
> **Documentation Bug in `config/repository.php`:**  
> The official default configuration file distributed with `l5-repository` contains the following misleading docblock at line 199:
> ```php
> /*
>  * - filter : Fields that must be returned to the response object
>  *   Ex:
>  *   http://prettus.local/?search=lorem&filter=id,name
>  */
> ```
> **This example is incorrect!**

If you pass `filter=id,name`:
1. `explode(';', 'id,name')` returns `['id,name']` (an array with one single string).
2. Eloquent attempts: `$model->select(['id,name'])`.
3. In MySQL / MariaDB, the database driver generates:
   ```sql
   SELECT `id,name` FROM `posts`
   ```
4. The database crashes with:
   `SQLSTATE[42S22]: Column not found: 1054 Unknown column 'id,name' in 'field list'`

**Always use semicolons (`filter=id;name`).**

---

## Array Query Syntax Support

Because `RequestCriteria` checks:
```php
if (is_string($filter)) {
    $filter = explode(';', $filter);
}
```
If the client submits PHP array parameters in the query string:
```
?filter[]=id&filter[]=title&filter[]=status
```
PHP decodes `$_GET['filter']` as `['id', 'title', 'status']`. Since it is already an array, `is_string($filter)` is `false`, and the array is passed directly to `$model->select()`. This is fully supported and safe.

---

## Critical Side Effects & Common Mistakes

### 1. Dropping the Primary Key (`id`)
If you filter columns without including the model's primary key (`id`):
```
?filter=title;body
```
- Eloquent models are instantiated with `$model->id === null`.
- Model methods like `$model->save()`, `$model->update()`, or `$model->delete()` fail because the model cannot identify its database row.
- Cache invalidation and event listeners relying on `$model->getKey()` will fail.

### 2. Breaking Relationships & Eager Loading (Foreign Keys)
If you combine `filter` with `with` or `include` to load relationships, **you must include the foreign keys**:
- Post belongs to User: `author_id` is required.
  ```
  # WRONG - User relationship will return null because author_id was not selected!
  ?with=author&filter=id;title
  
  # CORRECT - Includes the foreign key
  ?with=author&filter=id;title;author_id
  ```

### 3. Breaking Fractal Presenters / Transformers
If your repository uses a Presenter / Transformer:
```php
public function transform(Post $post)
{
    return [
        'id'         => (int) $post->id,
        'title'      => $post->title,
        'created_at' => $post->created_at->toIso8601String(), // Crashes if created_at is omitted!
    ];
}
```
If `created_at` is omitted from `filter`, `$post->created_at` is `null`, causing:
`Call to a member function toIso8601String() on null`.

### 4. Ambiguous Column Collisions on Joins
If you use cross-table sorting (e.g. `orderBy=categories|name`), `RequestCriteria` performs a `LEFT JOIN`. If you filter by unqualified column names like `id`:
```
?orderBy=categories|name&filter=id;title
```
The database will throw:
`Column 'id' in field list is ambiguous`.

**Fix:** Qualify the columns with the table name:
```
?orderBy=categories|name&filter=posts.id;posts.title
```

---

## Examples: Correct vs. Incorrect

### 1. Basic Column Selection
- ❌ **Incorrect (uses comma):**
  ```
  ?filter=id,title,views
  ```
-  **Correct (uses semicolon):**
  ```
  ?filter=id;title;views
  ```

### 2. Array Syntax
-  **Correct (array bracket syntax):**
  ```
  ?filter[]=id&filter[]=title&filter[]=views
  ```

### 3. Selection with Eager-Loaded Relation
- ❌ **Incorrect (missing foreign key `author_id`):**
  ```
  ?with=author&filter=id;title;content
  ```
-  **Correct (includes foreign key `author_id`):**
  ```
  ?with=author&filter=id;title;content;author_id
  ```

### 4. Selection with Table Qualifiers on Joins
- ❌ **Incorrect (unqualified columns causing ambiguity):**
  ```
  ?orderBy=categories|name&filter=id;title
  ```
-  **Correct (explicitly table-prefixed):**
  ```
  ?orderBy=categories|name&filter=posts.id;posts.title
  ```
