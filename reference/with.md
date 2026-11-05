# Eager Loading Parameters: `with` and `withCount`

> **File:** `Prettus\Repository\Criteria\RequestCriteria.php`  
> **Config:** `config('repository.criteria.params.with', 'with')`, `config('repository.criteria.params.withCount', 'withCount')`

---

## Table of Contents

1. [Overview](#overview)
2. [How It Works: Under the Hood](#how-it-works-under-the-hood)
3. [Delimiters & Syntax](#delimiters--syntax)
4. [Nested Relationships (Dot Notation)](#nested-relationships-dot-notation)
5. [`withCount` Mechanics](#withcount-mechanics)
6. [`with` vs. `include`: The Critical Difference](#with-vs-include-the-critical-difference)
7. [Common Mistakes & Traps](#common-mistakes--traps)
   - [The Comma Delimiter Trap](#1-the-comma-delimiter-trap)
   - [Invalid / Missing Relation Fatal Exception](#2-invalid--missing-relation-fatal-exception)
   - [Security & DoS Vulnerability](#3-security--dos-vulnerability)
   - [Relationship Pruning with `filter`](#4-relationship-pruning-with-filter)
8. [Examples: Correct vs. Incorrect](#examples-correct-vs-incorrect)

---

## Overview

The `with` and `withCount` parameters enable **database-level eager loading** directly from the HTTP request. 

- `with`: Tells Eloquent to fetch related models in batch queries to prevent the N+1 problem.
- `withCount`: Tells Eloquent to calculate the number of related records using an aggregate SQL subquery without hydrating the related models.

---

## How It Works: Under the Hood

The implementation in `RequestCriteria.php` (lines 172–180) reads:

```php
if ($with) {
    $with = explode(';', $with);
    $model = $model->with($with);
}

if ($withCount) {
    $withCount = explode(';', $withCount);
    $model = $model->withCount($withCount);
}
```

### Execution Mechanics:
1. `RequestCriteria` retrieves `with` from `$request->get('with')`.
2. Splits the string by **semicolon (`;`)**.
3. Passes the array of relation strings directly into Eloquent's `$model->with(...)`.
4. Eloquent executes the primary model query followed by separate `WHERE IN` queries for each eager-loaded relation.

---

## Delimiters & Syntax

Always separate multiple relationships with **semicolons (`;`)**:

```
?with=author;comments;tags
```

This transforms into:
```php
$model->with(['author', 'comments', 'tags']);
```

---

## Nested Relationships (Dot Notation)

Eloquent's standard dot notation (`parent.child.subchild`) is fully supported:

```
?with=author.profile;comments.author
```

This instructs Eloquent to:
1. Eager-load the `author` relation.
2. Eager-load the `profile` relation on the `author`.
3. Eager-load the `comments` relation.
4. Eager-load the `author` on each comment.

---

## `withCount` Mechanics

`withCount` counts related records using an efficient SQL `COUNT(*)` subquery:

```
?withCount=comments;likes
```

### Generated SQL:
```sql
SELECT `posts`.*, 
       (SELECT COUNT(*) FROM `comments` WHERE `posts`.`id` = `comments`.`post_id`) AS `comments_count`,
       (SELECT COUNT(*) FROM `likes` WHERE `posts`.`id` = `likes`.`post_id`) AS `likes_count`
FROM `posts`
```

The count is placed directly onto the Eloquent model attributes as `{relation}_count`:
- `$post->comments_count`
- `$post->likes_count`

---

## `with` vs. `include`: The Critical Difference

A frequent source of confusion in `l5-repository` is the distinction between `with` and `include`:

| Feature | `with` | `include` |
|---|---|---|
| **Handled By** | `RequestCriteria` (Eloquent ORM) | `FractalPresenter` (League Fractal) |
| **Layer** | **Database / SQL Query** | **Output / JSON Serialization** |
| **Delimiter** | **Semicolon (`;`)** | **Comma (`,`)** |
| **Action** | Eager-loads relations into Eloquent memory | Serializes related models into JSON response |
| **Prerequisite** | Eloquent model relationship method | Presenter + Transformer definition |

### The Golden Rule:
- Use `with` to control **database performance** (preventing N+1 queries).
- Use `include` to control **JSON payload shape**.
- In an ideal API setup using Fractal Presenters, pass **both**:
  ```
  ?with=author;comments&include=author,comments
  ```
  This ensures the database fetches relations in a single batch query, and Fractal serializes them into the JSON output.

---

## Common Mistakes & Traps

### 1. The Comma Delimiter Trap
Using commas instead of semicolons:
```
?with=author,comments
```
`explode(';', 'author,comments')` returns `['author,comments']`. Eloquent looks for a relationship method named `author,comments()` on the Model and crashes:
`Illuminate\Database\Eloquent\RelationNotFoundException: Call to undefined relationship [author,comments] on model [Post].`

### 2. Invalid / Missing Relation Fatal Exception
`RequestCriteria` performs **no validation** against whether a relation actually exists or is allowed. If a malicious or mistaken user passes:
```
?with=nonExistentRelation
```
Laravel immediately crashes with an unhandled 500 error (`RelationNotFoundException`).

### 3. Security & DoS Vulnerability
Because `RequestCriteria` directly passes raw user input to Eloquent's `with()`, clients can request deeply nested relations:
```
?with=user.posts.comments.author.posts.comments
```
This can generate massive database memory spikes, heavy query loads, or expose internal relations (e.g. `with=secretAuditLogs;user.passwordResets`).

### 4. Relationship Pruning with `filter`
If you select specific columns using `filter`, **you must include the foreign key**:
```
# FAILS: author relation will be null!
?with=author&filter=id;title

# WORKS: includes the author_id foreign key
?with=author&filter=id;title;author_id
```

---

## Examples: Correct vs. Incorrect

### 1. Eager Loading Multiple Relations
- ❌ **Incorrect (uses comma):**
  ```
  ?with=author,comments,tags
  ```
-  **Correct (uses semicolon):**
  ```
  ?with=author;comments;tags
  ```

### 2. Eager Loading Nested Relations
- ❌ **Incorrect (using slash or arrow syntax):**
  ```
  ?with=comments/author
  ```
-  **Correct (dot notation):**
  ```
  ?with=comments.author;author.profile
  ```

### 3. Combining `with` and `withCount`
-  **Correct:**
  ```
  ?with=author&withCount=comments;likes
  ```

### 4. Working with Filter
- ❌ **Incorrect (foreign key dropped):**
  ```
  ?with=category&filter=id;title
  ```
-  **Correct (foreign key included):**
  ```
  ?with=category&filter=id;title;category_id
  ```
