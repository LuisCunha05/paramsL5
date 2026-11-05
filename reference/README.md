# L5-Repository Query Parameters Documentation

This directory contains in-depth documentation and code-level rules for all query parameters used by [andersao/l5-repository](https://github.com/andersao/l5-repository).

## Quick Navigation

1. **[Master Reference (`reference.md`)](./reference.md)**: Architectural lifecycle, delimiter matrix, configuration options, and global quirks.
2. **[Search & SearchFields (`search.md`)](./search.md)**: `search`, `searchFields`, `searchJoin`, conditions (`=`, `like`, `in`, `between`, etc.), relation querying, and whitelist mechanics.
3. **[Filter (`filter.md`)](./filter.md)**: Column projection (`select`), semicolon rule, and config docblock bug warning.
4. **[With & WithCount (`with.md`)](./with.md)**: Eloquent eager-loading, relation counting, semicolon delimiter, and security implications.
5. **[Include (`include.md`)](./include.md)**: League Fractal Presenter transformation, comma delimiter, and avoiding N+1 performance degradation.
6. **[OrderBy & SortedBy (`order-by.md`)](./order-by.md)**: Multi-column sorting, fallback directions, and the hidden cross-table `LEFT JOIN` syntax (`table|column`, `table:fk|column`, `table:fk,pk|column`).
7. **[Pagination & Cache (`pagination-and-cache.md`)](./pagination-and-cache.md)**: `limit`, `page`, query persistence across paginator links, and `skipCache`.
