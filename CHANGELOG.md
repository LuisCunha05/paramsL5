# Changelog

All notable changes to this project will be documented in this file.

## [0.3.0] - 2026-11-19

### Bug Fixes

- Report empty string, Infinity, and btw element types in typeName
- Tighten btw tuple types and skip empty in arrays in strict mode
- Change default limit from 1 to 15

### Maintenance

- Resolve oxlint warnings and mark logger types readonly

## [0.2.0] - 2026-11-18

### Bug Fixes

- Fix restriction of only one type of input in the argumento of search
- _(orderBySortBy)_ Fix type inference e used reduce instead of map in final join step
- Missing builded files to package
- Added missing types for with and orderBySortBy
- Handle undefined in filterWithDelimeter, preserve error issues, and expand generator class tests
- Unwrap nullable relations in TPathPipe and fix OnlyOneKey typo
- Use u flag instead of v flag in Search delimiter regexes

### Documentation

- Add l5-repository query parameters reference documentation
- Add TSDoc comments with validation notes and examples
- Remove completed DESIGN_REVIEW.md
- Align filter, include, with, and withCount JSDoc with strict mode
- Update README for v0.2.0 API and usage

### Features

- Base package structure
- _(tests)_ Adding tests and resolving configs
- Added limit param and .nvmrc
- _(utils)_ Improved isNonEmptyString verification
- _(limit)_ Added tests for limit
- Added Page param
- Added Include param
- WIP Added Search param
- _(utils)_ Added isBaseValue
- _(search)_ WIP Added validation to search
- _(search)_ Added initial implementation toParams in Search
- _(tests)_ Added initial tests for search
- _(constants)_ Added object reference for url encoded special characters
- Feat(search): fix case when search would still generate params for array values for non 'bitween' or 'in'
  condition
- _(tests)_ Added more tests for search
- _(tests)_ Added markdown file with examples how to structure tests for the project
- _(orderBySortBy)_ Added functional implementation of orderBySortBy
- _(filter)_ Added functional filter implementation
- _(tests)_ Added tests for filter
- _(with)_ Added functional implementation of with called withRel
- Restructure files and final export
- Fix typo in condition and separated search output to search and searchFields
- Removed default limit and altered related test
- _(orderBySortBy)_ Allow not passing sortBy and added argument for default SortBy
- _(tests)_ Added tests for default SortBy in orderBySortBy
- _(page)_ Removed default value for page
- _(search)_ Added argument for default condition
- _(tests)_ Added tests for default search
- Added createClient function to allow passing defult options to paramsL5
- _(generators)_ Added some info logging and changed some errors to warnings
- _(tests)_ Add tests for external logger in searchCriteria
- Added fallback logger in generator functions
- Add prefix in all logs for log builder
- _(tests)_ Adiciona tests for Log builder
- _(logs)_ Add more logging messages in generators
- _(tests)_ Add tests for include, page, searchJoin and with
- Add object shape inference for arguments
- Add client.for method with duplicate path and key validation
- Replace params property with toParams method
- Add centralized message catalog and align query labels
- Make searchFields opt-in via includeSearchFields option
- Implement withCount parameter support
- Add PathPipe type for relations support in with parameter
- Loosen types for search
- Extract and export standalone query generator, fix import paths
- Return key-value objects from all generators using QUERY_NAMES
- Remove default logger
- Add ParamsL5ValidationError, Result type, and filterWithDelimeter
- Add non-enumerable toString and Symbol.toPrimitive coercion to ParamsL5 result
- Add delimiter collision protection to Search
- Correlate TSearch field values and operators with schema types
- Add defaultValue support to Page options and wire ParamsL5 fallback

### Maintenance

- Update libs
- Format
- Format and changed tsconfig to inclide tests
- Updated node version to 24 e set package manager to pnpm
- Added .zed to gitignore
- Changed spacing in biome config
- Format
- Fix paramsL5 class errors
- Moves all constants to constansts file
- Removed types for classes not utilized
- Config package
- Added missing exports
- Updated README.md
- Removed unnecessary logger from tests
- _(deps)_ Update pnpm
- Format
- Add oxlint and oxfmt and remove biome
- Format
- Change quota style and format
- _(deps)_ Fix build script and add libs to check lib output
- _(deps)_ Update libs
- Disable lint rule for sort imports
- Update repository url protocol in package.json
- Move helper const to test folder to reduce bundle size
- Alter import alias in package.json
- Add api improvements todo
- Configure npm packaging, prepublishOnly, and sourcemap-free build

### Refactoring

- _(limit)_ Added isNumber to utils and change limit validation
- _(tests)_ Alter tests and added some exceptions for errors instead of silent treating them
- Made searchCriteria alter existing keys instead of throwing
- _(search)_ Changed search to permit only unique keys
- _(limit)_ Changed implementation of limit to funcional
- _(tests)_ Migrated tests to vitest
- _(page)_ Refactor page to function
- _(page)_ Refactor include to function
- _(searchJoin)_ Refactor searchJoin to function
- _(searchCriteria)_ Refactor searchCriteria to function
- _(tests)_ Refactored searchCriteria tests for functional implementation
- _(search)_ Initial refactor to function of search
- _(search)_ Almost finish refactor search to functional
- _(tests)_ Refactored tests for limit to follow new pattern
- _(page)_ Changed return value of page
- Changed return type and added logger
- _(tests)_ Refactor client test for new api
- _(tests)_ Refactor limit tests for the new api
- _(tests)_ Refactor limit for new api
- _(tests)_ Refactor orderBySortBy for new api
- _(tests)_ Refactor search and search criteria for new api
- _(tests)_ Change the mocking style all tests to use Log builder
- _(tests)_ Add Function name at the begging of log messages
- Simplify query generators return types and update tests
- Rename files to kebab-case and update compiler options
- Move MIN_PAGE constant to page generator
- _(utils)_ Extract START_CHAR constant in encodeSearchParam
- _(types)_ Remove unused uniquePaths and rename generic parameters
- Overhaul logger configuration and use default logger across generators
- Migrate path aliases to subpath imports (#s/*)
- Extract toParams utility and define query constants
- _(generators)_ Standardize messages in filter, include, and withRel
- _(generators)_ Standardize messages in limit, page, and searchJoin
- _(generators)_ Standardize messages in orderSort, search, and searchCriteria
- Convert message catalog from object to standalone functions for optimal minification
- Remove searchCriteria and fix documentation examples in README
- Prefix types and interfaces with T convention
- Convert filter generator to Filter class
- Convert include generator to Include class
- Convert with generator to With class
- Convert withCount generator to WithCount class
- Update client, paramsL5, and exports to use Filter, Include, With, and WithCount classes
- Convert limit, page, and searchJoin to classes with defaults and update tests
- Replace search function with Search class and update callers and tests
- Replace orderBySortBy function with OrderBySortBy class and update callers and tests
- Switch OrderBySortBy to object input with TPathPipe and update tests
- Convert ParamsL5 to class with strict validation and remove createClient
- Remove unused encodeSearchParam and decodeSearchParam from utils

### Style

- Apply oxfmt and oxlint fixes to message catalog and generators
