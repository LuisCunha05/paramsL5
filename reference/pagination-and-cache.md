# Pagination & Caching: `limit`, `page`, and `skipCache`

> **Files:** `Prettus\Repository\Eloquent\BaseRepository.php`, `Prettus\Repository\Traits\CacheableRepository.php`  
> **Config:** `config('repository.pagination.limit', 15)`, `config('repository.cache.params.skipCache', 'skipCache')`

---

## Table of Contents

1. [Overview](#overview)
2. [Pagination Mechanics (`limit` & `page`)](#pagination-mechanics-limit--page)
   - [Under the Hood in `BaseRepository::paginate()`](#under-the-hood-in-baserepositorypaginate)
   - [Parameter Preservation via `appends()`](#parameter-preservation-via-appends)
3. [Cache Bypass (`skipCache`)](#cache-bypass-skipcache)
   - [Under the Hood in `CacheableRepository`](#under-the-hood-in-cacheablerepository)
   - [Prerequisites for Caching](#prerequisites-for-caching)
4. [Common Mistakes & Traps](#common-mistakes--traps)
5. [Examples: Correct vs. Incorrect](#examples-correct-vs-incorrect)

---

## Overview

While filtering, sorting, and eager loading operate on database query conditions, `limit`, `page`, and `skipCache` control **result windowing** and **caching behavior**.

---

## Pagination Mechanics (`limit` & `page`)

### Under the Hood in `BaseRepository::paginate()`

Inside `Prettus\Repository\Eloquent\BaseRepository.php` (lines 482–492):

```php
public function paginate($limit = null, $columns = ['*'], $method = "paginate")
{
    $this->applyCriteria();
    $this->applyScope();
    $limit = is_null($limit) ? config('repository.pagination.limit', 15) : $limit;
    $results = $this->model->{$method}($limit, $columns);
    $results->appends(app('request')->query());
    $this->resetModel();

    return $this->parserResult($results);
}
```

### Execution Flow:

1. `applyCriteria()` applies `RequestCriteria` (search, filter, with, orderBy).
2. If `$limit` is not passed to the method call, it defaults to `config('repository.pagination.limit', 15)`.
3. In controller code, developers often forward the request's `limit` parameter:
   ```php
   $limit = $request->get('limit', null);
   return $repository->paginate($limit);
   ```
4. Laravel's underlying paginator automatically parses the `page` parameter from the HTTP request (`?page=2`).

### Parameter Preservation via `appends()`

Notice line 488:

```php
$results->appends(app('request')->query());
```

`l5-repository` automatically appends the entire incoming request query string to all generated pagination links (`next_page_url`, `prev_page_url`).  
This ensures that if a user paginates through a filtered search (`?search=name:John&page=1`), clicking the next page URL maintains the search criteria (`?search=name:John&page=2`).

---

## Cache Bypass (`skipCache`)

### Under the Hood in `CacheableRepository`

In `Prettus\Repository\Traits\CacheableRepository.php` (lines 70–79):

```php
public function isSkippedCache()
{
    $skipped = isset($this->skipCache) ? $this->skipCache : false;
    $request = app('Illuminate\Http\Request');
    $skipCacheParam = config('repository.cache.params.skipCache', 'skipCache');

    if ($request->has($skipCacheParam) && $request->get($skipCacheParam)) {
        $this->skipCache(true);
    }

    return $this->skipCache;
}
```

When caching is enabled in `config/repository.php`:

```php
'cache' => [
    'enabled' => true,
    'minutes' => 30,
    'params' => [
        'skipCache' => 'skipCache',
    ],
],
```

Every read operation (`all`, `paginate`, `find`, `findByField`) checks `isSkippedCache()`.

### Bypassing Cache via Request

Passing `skipCache=true` or `skipCache=1` tells the repository to bypass the cache store and query the database directly:

```
?search=status:active&skipCache=true
```

---

## Prerequisites for Caching

For `skipCache` to have any effect:

1. The repository must implement `Prettus\Repository\Contracts\CacheableInterface`.
2. The repository must use the `Prettus\Repository\Traits\CacheableRepository` trait.
3. Caching must be globally enabled in `config/repository.php` (`'enabled' => true`).

```php
namespace App\Repositories;

use Prettus\Repository\Eloquent\BaseRepository;
use Prettus\Repository\Contracts\CacheableInterface;
use Prettus\Repository\Traits\CacheableRepository;

class PostRepository extends BaseRepository implements CacheableInterface
{
    use CacheableRepository;

    public function model()
    {
        return Post::class;
    }
}
```

---

## Common Mistakes & Traps

### 1. Expecting `limit` to Work Automatically Without Controller Forwarding

Unlike `search` and `filter` (which `RequestCriteria` pulls directly from `$this->request->get(...)`), `BaseRepository::paginate($limit = null)` only receives `$limit` as a method argument. If the controller executes `$repository->paginate()` without passing `$request->get('limit')`, the `?limit=50` URL parameter will be ignored!

### 2. Passing Negative or Extreme `limit` Values

Passing unconstrained `limit` (e.g. `?limit=1000000`) can cause database timeouts and out-of-memory errors. The controller should validate and cap `limit` (e.g. `min(100, (int) $request->get('limit', 15))`).

### 3. Caching Serializer Issues in Newer Laravel Versions

As noted in `config/repository.php`, Laravel 11/12/13 hardens cache serialization. If criteria objects are serialized into cache keys, all criteria classes should be whitelisted in `config/cache.php` under `serializable_classes`.

---

## Examples: Correct vs. Incorrect

### 1. Requesting a Specific Page and Limit

- **Correct:**

```
?page=3&limit=25
```

### 2. Bypassing Cache for Fresh Data

- **Correct:**

```
?search=status:pending&skipCache=true
```

or

```
?search=status:pending&skipCache=1
```

### 3. Combining Search, Ordering, and Pagination

- **Correct (All parameters survive pagination):**

```
?search=title:Laravel&orderBy=created_at&sortedBy=desc&limit=10&page=2
```
