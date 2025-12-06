# Synclets Copilot Instructions

## Project Overview

Synclets is a storage-agnostic sync engine development kit. It enables data synchronization between various storage backends (SQLite, PGlite, TinyBase, Files, Memory) over different transport layers (WebSockets, BroadcastChannel, Memory).

## Architecture

- **Core (`src/core/synclet.ts`)**: The `Synclet` class is the central orchestrator. It composes:
  - **Data Connector**: Handles reading/writing of actual data (Atoms).
  - **Meta Connector**: Handles reading/writing of metadata (Timestamps/HLC).
  - **Transport**: Handles sending/receiving messages.
- **Connectors**: Implementations for specific storage engines.
  - **Database Connectors**: `src/connector/database/common.ts` provides a generic SQL implementation used by `sqlite3` and `pglite`.
  - **File/Directory Connectors**: `src/fs/`
  - **Browser Storage**: `src/browser/`
  - **Other Connectors**: `src/connector/` (memory, tinybase, database)
- **Transports**: Implementations for communication channels.
  - **WebSocket Transport**: `src/ws/`
  - **Other Transports**: `src/transport/` (broadcast-channel, memory, durable-object)
- **Types (`src/@types/`)**: Type definitions are explicitly separated into this directory, mirroring the source structure.

## Key Concepts

- **Address**: A hierarchical path to a node, represented as an array of strings (e.g., `['users', '123', 'name']`).
- **Atom**: The leaf value at an address (string, number, boolean, null).
- **Timestamp**: Hybrid Logical Clock (HLC) strings used for conflict resolution (Last-Write-Wins).
- **Merkle Tree**: The sync protocol uses hashes of sub-trees to efficiently detect differences between peers.

## Development Workflows

- **Task Runner**: The project uses `gulp` for all build and maintenance tasks.
- **Commands**:
  - `npm run compileAndTestUnit`: Compiles and runs unit tests (`gulp compileAndTestUnit`).
  - `npm run lint`: Runs ESLint and Prettier (`gulp lint`).
  - `npm run ts`: Runs TypeScript type checking (`gulp ts`).
  - `npm run preCommit`: Runs the full suite of checks (lint, spell, ts, test, build).
- **Build**: `gulpfile.mjs` dynamically builds modules defined in `src/tsconfig.json`.
- **Code Reuse**: Always check for existing helper functions before implementing new functionality:
  - Look in the current file first (e.g., `gulpfile.mjs` has `execute()` for running commands)
  - Check `src/common/` for utility functions
  - Review similar implementations in the same file for patterns
  - Use established project patterns rather than reinventing solutions

## Coding Conventions

- **Functional Factories**: Prefer factory functions (e.g., `createSynclet`, `createSqlite3Connector`) over class inheritance.
- **Type Definitions**: Look in `src/@types` for interfaces. Implementation files often import types from `@synclets/@types/...`.
- **Documentation Convention**: Type definitions in `src/@types/index.d.ts` use triple-slash comments (`///`) as documentation labels that connect to corresponding entries in `src/@types/docs.js`. For example:
  - `/// TypeName` - Documents the type itself
  - `/// TypeName.propertyName` - Documents a property or method
  - The label in `index.d.ts` must exactly match the key in the `TYPES` object in `docs.js`
  - **Indentation matters**: Properties and methods must be indented in `docs.js` to match the alignment in the generated `index.d.ts` files
  - When adding new types or properties, update both files to avoid build errors
- **Database Abstraction**: When implementing a new SQL-based connector, adapt `createDatabaseConnector` (`src/connector/database/common.ts`) instead of writing from scratch.
- **Utilities**: Use shared utilities from `src/common` (internal) and `src/utils` (public).

## Important Files

- `src/core/synclet.ts`: The core synchronization logic and protocol implementation.
- `src/connector/database/common.ts`: Shared logic for SQL-based connectors.
- `gulpfile.mjs`: The build, test, and linting orchestration script.
- `src/tsconfig.json`: Defines the module structure and path mappings used by the build system.

## Code Style & Patterns

### Naming Conventions

1. **Type Aliases & Interfaces**
   - PascalCase for types: `Synclet`, `Connector`, `Transport`, `Atom`
   - Suffix with purpose: `Listener`, `Callback`, `Options`, `Config`

2. **Functions**
   - camelCase for all functions
   - Factory functions: `create` prefix (e.g., `createSynclet`, `createPgliteConnectors`)
   - Utility functions: descriptive verbs

3. **Constants**
   - UPPER_SNAKE_CASE for string constants
   - Used for configuration keys and internal identifiers

4. **Variables**
   - camelCase for all variables
   - Descriptive names preferred over abbreviations

### Utility Function Patterns

Following TinyBase patterns, use utility wrappers for consistency and tree-shaking:

1. **Array Operations**:

   ```typescript
   arrayForEach(array, callback); // instead of array.forEach
   arrayMap(array, callback); // instead of array.map
   arrayPush(array, ...items); // instead of array.push
   ```

2. **Map Operations**:

   ```typescript
   mapNew(); // new Map()
   mapGet(map, key); // map?.get(key)
   mapSet(map, key, value); // map.set(key, value)
   mapForEach(map, callback); // map.forEach
   ```

3. **Object Operations**:
   ```typescript
   objNew(); // {}
   objKeys(obj); // Object.keys
   objHas(obj, id); // id in obj
   ```

**Why This Pattern?**

- Consistent null/undefined handling
- Enables aggressive tree-shaking in bundlers
- Provides single point for debugging/logging
- Reduces repetitive null checks

### TypeScript Patterns

1. **Generic Constraints**

   ```typescript
   <T extends Connector = Connector>
   <Options extends Record<string, unknown> = Record<string, unknown>>
   ```

2. **Type Guards**
   - `isUndefined`, `isString`, `isObject`, `isArray`, `isFunction`
   - Used for runtime type checking

3. **Pure Function Annotations**

   ```typescript
   export const mapNew = /* @__PURE__ */ <Key, Value>(): Map<Key, Value> =>
     new Map();
   ```

   - Marks functions for tree-shaking by bundlers

### Testing Requirements

- **High Code Coverage**: Maintain comprehensive test coverage
- **Test Organization**:
  - Unit tests in `test/unit/` mirror source structure
  - Performance tests in `test/perf/`
  - End-to-end tests in `test/e2e/`
  - Production build tests in `test/prod/`

### Linting & Formatting

1. **ESLint Configuration** (see `eslint.config.js`)
   - Max line length: 80 characters
   - Single quotes for strings (template literals allowed)
   - Comma-dangle: always-multiline
   - Object curly spacing: none (`{key: value}`)

2. **Code Style**
   - Prefer const over let
   - Use arrow functions for callbacks
   - Avoid `var` entirely
   - Use ternary for simple conditionals

3. **Import Organization**
   - Type imports separated (`import type`)
   - Group by: external, internal types, internal code, relative
   - Alphabetical within groups (preferred)

### Error Handling

1. **Fail Fast**
   - Throw descriptive errors early
   - Validate inputs at public API boundaries

2. **Try-Catch Pattern**
   ```typescript
   try {
     await action();
   } catch (error) {
     handleError(error);
   }
   ```

## Documentation System

Synclets has a documentation system similar to TinyBase that generates the website from source code and markdown files.

### Documentation Structure

1. **Type Definitions (`src/@types/*/`)**:
   - TypeScript `.d.ts` files contain the API type definitions
   - **Never add comments directly to `.d.ts` files**

2. **Documentation Files (`src/@types/*/docs.js`)**:
   - Companion `docs.js` files sit alongside `.d.ts` files
   - Use `///` convention to document types and functions
   - These are stitched together at build time to generate documentation

3. **Guide Files (`site/guides/*/`)**:
   - Markdown files in the `site/guides/` directory
   - Source files for guides on the website

4. **Generated Files**:
   - `/releases.md`, `/readme.md`, and `/agents.md` in the root are **GENERATED**
   - These are built from source files in `/site/`
   - **Never edit the generated files directly**

### Documentation Testing

Synclets uses automated tests that validate inline code examples in documentation:

```bash
npx vitest run ./test/unit/documentation.test.ts --retry=0
```

**How it works**:

- Extracts all code blocks from markdown files and `docs.js` files
- Concatenates all examples from each file together
- Parses and executes them to ensure they work
- Examples in the same file share scope

**Critical constraints**:

- Don't redeclare variables across examples in the same file
- First example can declare `const synclet = createSynclet(...)`, subsequent examples reuse it
- Include necessary imports in examples that use them
- Avoid async operations in examples unless necessary
- Keep examples simple and focused

**Common pitfalls**:

- ❌ Declaring `const synclet` multiple times in the same file
- ❌ Using undefined functions (forgot import statement)
- ✅ First example: `const synclet = await createSynclet(...)`
- ✅ Later examples: `await synclet.start()` (reuses existing synclet)

### Adding New Documentation

1. **API Documentation**: Edit `docs.js` file next to the type definition
2. **Guide Content**: Edit markdown files in `/site/guides/`
3. **Release Notes**: Edit `/site/guides/2_releases.md` (not `/releases.md`)
4. **Agents Guide**: Edit `/site/guides/15_agents.md` (not `/agents.md`)
5. **Always run documentation tests** after changes to verify examples work

## Anti-Patterns to Avoid

1. **Don't use native array/object methods directly in utility code**
   - Use the wrapper functions for consistency

2. **Don't create circular dependencies**
   - Common utilities should have minimal dependencies
   - Type definitions should not import implementations

3. **Don't mutate inputs**
   - Return new objects/maps, or document when mutating in-place

4. **Don't skip tests**
   - Every new feature needs comprehensive tests

5. **Don't use dynamic property access without type safety**
   - Use type guards and narrowing
   - Leverage TypeScript's type system

6. **Don't add console.log statements**
   - Will fail linting
   - Use proper error throwing or callbacks

7. **Don't edit generated files**
   - `/readme.md`, `/releases.md`, `/agents.md` are generated from `/site/`

## Key Takeaways for Copilot

1. **Consistency is paramount** - Follow existing patterns exactly
2. **Size matters** - Every byte counts, use utility wrappers and `@__PURE__` annotations
3. **Types are documentation** - Use descriptive types and TSDoc comments via `docs.js`
4. **Test thoroughly** - Write comprehensive tests for new features
5. **Modular design** - Each connector and transport should be independently usable
6. **Storage agnostic** - Design for flexibility across different storage backends
7. **Generated files** - Never edit `/readme.md`, `/releases.md`, or `/agents.md` directly
8. **Documentation examples** - All code examples in docs must be executable and valid

## Questions to Consider When Contributing

- Does this maintain good test coverage?
- Is the bundle size impact minimal?
- Does it follow the existing utility wrapper patterns?
- Are TypeScript types properly defined in `@types/`?
- Is the API consistent with similar existing functionality?
- Will this work across supported environments (browser, Node)?
- Is documentation updated (TSDoc comments via `docs.js`, guides)?
- Does it pass all linting and formatting checks?
- Are documentation code examples tested and working?
