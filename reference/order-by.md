# Ordering & Sorting: `orderBy` and `sortedBy`

> **File:** `Prettus\Repository\Criteria\RequestCriteria.php`  
> **Config:** `config('repository.criteria.params.orderBy', 'orderBy')`, `config('repository.criteria.params.sortedBy', 'sortedBy')`

---

## Table of Contents

1. [Overview](#overview)
2. [How It Works: Under the Hood](#how-it-works-under-the-hood)
3. [Multi-Column Sorting & Semicolon Alignment](#multi-column-sorting--semicolon-alignment)
4. [The Hidden Cross-Table JOIN Sorting Engine](#the-hidden-cross-table-join-sorting-engine)
   - [Syntax 1: Conventional Foreign Key (`table|column`)](#syntax-1-conventional-foreign-key-tablecolumn)
   - [Syntax 2: Custom Foreign Key (`table:fk|column`)](#syntax-2-custom-foreign-key-tablefkcolumn)
   - [Syntax 3: Custom Foreign Key + Custom Primary Key (`table:fk,pk|column`)](#syntax-3-custom-foreign-key--custom-primary-key-tablefkpkcolumn)
   - [Preventing Column Ambiguity with Qualified Names](#preventing-column-ambiguity-with-qualified-names)
5. [Common Mistakes & Traps](#common-mistakes--traps)
6. [Examples: Correct vs. Incorrect](#examples-correct-vs-incorrect)

---

## Overview

The `orderBy` and `sortedBy` parameters control the order of query results. In addition to basic single- and multi-column sorting, `l5-repository` includes a little-known, built-in **cross-table sorting engine** that automatically joins foreign tables on the fly.

---

## How It Works: Under the Hood

Inside `RequestCriteria.php` (lines 151–162):

```php
if (isset($orderBy) && !empty($orderBy)) {
    $orderBySplit = explode(';', $orderBy);
    if (count($orderBySplit) > 1) {
        $sortedBySplit = explode(';', $sortedBy);
        foreach ($orderBySplit as $orderBySplitItemKey => $orderBySplitItem) {
            $sortedBy = isset($sortedBySplit[$orderBySplitItemKey]) 
                ? $sortedBySplit[$orderBySplitItemKey] 
                : $sortedBySplit[0];
            $model = $this->parserFieldsOrderBy($model, $orderBySplitItem, $sortedBy);
        }
    } else {
        $model = $this->parserFieldsOrderBy($model, $orderBySplit[0], $sortedBy);
    }
}
```

### Execution Flow:
1. `orderBy` is split by **semicolon (`;`)**.
2. If multiple sort fields are present, `sortedBy` is also split by semicolon.
3. If `sortedBy` has fewer entries than `orderBy`, `RequestCriteria` **falls back to the first direction** (`$sortedBySplit[0]`).
4. If `sortedBy` is completely omitted or empty, it defaults to `'asc'`.
5. Each field is routed through `parserFieldsOrderBy()`.

---

## Multi-Column Sorting & Semicolon Alignment

You can sort by multiple columns by joining fields and directions with semicolons:

```
?orderBy=created_at;title&sortedBy=desc;asc
```

### Generated SQL:
```sql
ORDER BY `created_at` DESC, `title` ASC
```

### Fallback Behavior:
If you supply multiple order columns but only one sort direction:
```
?orderBy=created_at;title;views&sortedBy=desc
```
Because `count($sortedBySplit) < count($orderBySplit)`, every column automatically adopts `desc`:
```sql
ORDER BY `created_at` DESC, `title` DESC, `views` DESC
```

---

## The Hidden Cross-Table JOIN Sorting Engine

One of the most powerful features in `l5-repository` is the ability to sort by columns in related tables using the pipe (`|`) delimiter.

Inside `parserFieldsOrderBy($model, $orderBy, $sortedBy)`:

```php
$split = explode('|', $orderBy);
if (count($split) > 1) {
    $table = $model->getModel()->getTable();
    $sortTable = $split[0];
    $sortColumn = $split[1];

    $split = explode(':', $sortTable);
    $localKey = '.id';
    if (count($split) > 1) {
        $sortTable = $split[0];

        $commaExp = explode(',', $split[1]);
        $keyName = $table.'.'.$split[1];
        if (count($commaExp) > 1) {
            $keyName = $table.'.'.$commaExp[0];
            $localKey = '.'.$commaExp[1];
        }
    } else {
        $prefix = Str::singular($sortTable);
        $keyName = $table.'.'.$prefix.'_id';
    }

    $model = $model
        ->leftJoin($sortTable, $keyName, '=', $sortTable.$localKey)
        ->orderBy($sortColumn, $sortedBy)
        ->addSelect($table.'.*');
} else {
    $model = $model->orderBy($orderBy, $sortedBy);
}
```

### Syntax 1: Conventional Foreign Key (`table|column`)
If your table follows standard Laravel naming conventions:
- Main Table: `posts`
- Target Table: `categories`
- Foreign Key: `posts.category_id` -> `categories.id`

URL:
```
?orderBy=categories|name&sortedBy=asc
```
What `RequestCriteria` does:
1. Infers the singular prefix: `Str::singular('categories')` ➔ `'category'`.
2. Assumes local key is `posts.category_id`.
3. Assumes foreign target key is `categories.id`.
4. Executes:
   ```sql
   SELECT `posts`.* 
   FROM `posts` 
   LEFT JOIN `categories` ON `posts`.`category_id` = `categories`.`id` 
   ORDER BY `name` ASC
   ```

### Syntax 2: Custom Foreign Key (`table:fk|column`)
If your foreign key name does not match the singular convention:
- Main Table: `posts`
- Target Table: `categories`
- Custom Foreign Key on `posts`: `custom_cat_id`

URL:
```
?orderBy=categories:custom_cat_id|name&sortedBy=asc
```
Executes:
```sql
SELECT `posts`.* 
FROM `posts` 
LEFT JOIN `categories` ON `posts`.`custom_cat_id` = `categories`.`id` 
ORDER BY `name` ASC
```

### Syntax 3: Custom Foreign Key + Custom Primary Key (`table:fk,pk|column`)
If both the foreign key and the target table's primary key are non-standard:
- Main Table: `posts`
- Target Table: `categories`
- Custom Foreign Key on `posts`: `category_code`
- Custom Key on `categories`: `code`

URL:
```
?orderBy=categories:category_code,code|name&sortedBy=asc
```
Executes:
```sql
SELECT `posts`.* 
FROM `posts` 
LEFT JOIN `categories` ON `posts`.`category_code` = `categories`.`code` 
ORDER BY `name` ASC
```

### Preventing Column Ambiguity with Qualified Names
Notice that in the examples above, `sortColumn` was `name`. If both `posts` and `categories` have a `name` column:
```
# Ambiguous column error!
?orderBy=categories|name
```
You can explicitly qualify the sort column with the table name:
```
# Safe and unambiguous:
?orderBy=categories|categories.name
```

---

## Common Mistakes & Traps

### 1. Ambiguous Column Collisions
Sorting by `id` on joined queries without prefixing:
```
?orderBy=categories|id
```
Crashes with:
`Column 'id' in order clause is ambiguous`.  
**Fix:** Pass `categories|categories.id` or `posts.id`.

### 2. Duplicate Rows from One-to-Many Relationships
If you join a table that has a one-to-many relationship (for example, sorting posts by `comments|created_at`), SQL's `LEFT JOIN` duplicates parent `posts` rows for every matching child comment!  
Cross-table sorting is primarily designed for **belongsTo** relationships.

### 3. Invalid Direction Value
Passing values other than `asc` or `desc` (e.g. `sortedBy=up` or `sortedBy=descending`):
Laravel's query builder will either throw an exception or execute unpredictable sorting depending on the database driver.

### 4. Overriding `select` Clauses
Notice that `parserFieldsOrderBy()` calls:
```php
$model->addSelect($table.'.*');
```
If you combine a cross-table `orderBy` with `filter=title`:
- `filter` sets `SELECT posts.title`
- `orderBy` adds `SELECT posts.*`
- The result is that **all** columns of `posts` are selected regardless of `filter`!

---

## Examples: Correct vs. Incorrect

### 1. Basic Single Column
- ❌ **Incorrect (direction in orderBy):**
  ```
  ?orderBy=created_at desc
  ```
-  **Correct (direction in sortedBy):**
  ```
  ?orderBy=created_at&sortedBy=desc
  ```

### 2. Multi-Column with Different Directions
- ❌ **Incorrect (using comma):**
  ```
  ?orderBy=created_at,views&sortedBy=desc,asc
  ```
-  **Correct (using semicolon):**
  ```
  ?orderBy=created_at;views&sortedBy=desc;asc
  ```

### 3. Cross-Table Sorting
- ❌ **Incorrect (using dot notation instead of pipe):**
  ```
  ?orderBy=category.name&sortedBy=asc
  ```
  *(Generates `ORDER BY category.name` without joining the categories table, crashing with unknown column)*
-  **Correct (using pipe syntax):**
  ```
  ?orderBy=categories|name&sortedBy=asc
  ```

### 4. Cross-Table with Custom Foreign Key
-  **Correct:**
  ```
  ?orderBy=authors:created_by_user_id|name&sortedBy=asc
  ```
