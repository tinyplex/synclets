# Synclets Copilot Instructions

## Project Overview

Synclets is a storage-agnostic sync engine development kit. It enables data synchronization between various storage backends (SQLite, PGlite, TinyBase, Files, Memory) over different transport layers (WebSockets, BroadcastChannel, Memory).

## Architecture

- **Core (`src/core/synclet.ts`)**: The `Synclet` class is the central orchestrator. It composes:
  - **Data Connector**: Handles reading/writing of actual data (Atoms).
  - **Meta Connector**: Handles reading/writing of metadata (Timestamps/HLC).
  - **Transport**: Handles sending/receiving messages.
- **Connectors (`src/connector/`)**: Implementations for specific storage engines.
  - **Database Connectors**: `src/connector/database/common.ts` provides a generic SQL implementation used by `sqlite3` and `pglite`.
- **Transports (`src/transport/`)**: Implementations for communication channels.
- **Types (`src/@types/`)**: Type definitions are explicitly separated into this directory.

## Key Concepts

- **Address**: A hierarchical path to a node, represented as an array of strings (e.g., `['users', '123', 'name']`).
- **Atom**: The leaf value at an address (string, number, boolean, null).
- **Timestamp**: Hybrid Logical Clock (HLC) strings used for conflict resolution (Last-Write-Wins).
- **Merkle Tree**: The sync protocol uses hashes of sub-trees to efficiently detect differences between peers.

## Development Workflows

- **Task Runner**: The project uses `gulp` for all build and maintenance tasks.
- **Commands**:
  - `npm run test`: Runs unit and performance tests (`gulp test`).
  - `npm run lint`: Runs ESLint and Prettier (`gulp lint`).
  - `npm run ts`: Runs TypeScript type checking (`gulp ts`).
  - `npm run preCommit`: Runs the full suite of checks (lint, spell, ts, test, build).
- **Build**: `gulpfile.mjs` dynamically builds modules defined in `src/tsconfig.json`.

## Coding Conventions

- **Functional Factories**: Prefer factory functions (e.g., `createSynclet`, `createSqlite3Connector`) over class inheritance.
- **Type Definitions**: Look in `src/@types` for interfaces. Implementation files often import types from `@synclets/@types/...`.
- **Database Abstraction**: When implementing a new SQL-based connector, adapt `createDatabaseConnector` (`src/connector/database/common.ts`) instead of writing from scratch.
- **Utilities**: Use shared utilities from `src/common` (internal) and `src/utils` (public).

## Important Files

- `src/core/synclet.ts`: The core synchronization logic and protocol implementation.
- `src/connector/database/common.ts`: Shared logic for SQL-based connectors.
- `gulpfile.mjs`: The build, test, and linting orchestration script.
- `src/tsconfig.json`: Defines the module structure and path mappings used by the build system.
