# Agents Guide

This file follows the [agents.md](https://agents.md/) specification for AI agent
context. If you're a human reading this, it provides a comprehensive overview of
the Synclets project for AI assistants working with the codebase.

## Overview

**Synclets** is an open, storage-agnostic sync engine development kit. It is a
TypeScript library that provides a flexible synchronization framework for
local-first applications. It's designed to make it easy to synchronize data
between different parts of your applications, whether between local storage and
remote servers, between different devices, or even across worker boundaries. The
library is modular, extensible, and not locked to any specific storage solution,
transport layer, or vendor.

- **Website**: https://synclets.org
- **Repository**: https://github.com/tinyplex/synclets
- **Documentation**: https://synclets.org/api/
- **License**: MIT
- **Author**: James Pearce (@jamesgpearce)

## Core Concepts

### Synclets

A Synclet is the main synchronization unit that coordinates data sync between
storage and transport layers. It combines:

- **Data Connector**: Manages the actual application data storage
- **Meta Connector**: Manages synchronization metadata (versions, checksums, etc.)
- **Transport**: Handles communication between different Synclet instances

Synclets work by tracking changes to data, propagating those changes to remote
instances, and resolving conflicts when they occur.

### Connectors

Connectors provide an abstraction layer over different storage backends. They
come in two types:

- **Data Connectors**: Store and retrieve actual application data
- **Meta Connectors**: Store synchronization metadata separately

This separation allows mixing and matching different storage backends for data
and metadata based on your needs.

### Transports

Transports handle the communication layer between Synclet instances. They define
how data changes are sent and received between different parts of your
application, whether across network boundaries or within the same process.

## Key Features

### Storage Agnostic

Multiple storage backends supported via Connectors:

- **Browser**: localStorage, sessionStorage, IndexedDB
- **Databases**: PGlite, SQLite3
- **TinyBase**: Integration with TinyBase reactive data store
- **Files**: Node.js file system
- **Memory**: In-memory storage for testing

### Flexible Transport

Multiple transport layers supported:

- **WebSockets**: Real-time sync over WebSocket connections (client and server)
- **BroadcastChannel**: Same-origin tab synchronization
- **Memory**: In-process communication for testing

### Modular Architecture

Each connector and transport is independently importable, allowing tree-shaking
and minimal bundle sizes. Only import what you need.

### Type Safety

Strong TypeScript support throughout the library with comprehensive type
definitions and compile-time validation.

## Architecture

### Modular Design

Synclets uses a modular architecture where each feature is an independent module
that can be imported separately:

```
synclets                          # Core synclet module
synclets/core                     # Core types and utilities
synclets/browser                  # Browser storage connectors
synclets/fs                       # File system connectors
synclets/connector/database/pglite # PGlite database connectors
synclets/connector/database/sqlite3 # SQLite3 database connectors
synclets/connector/memory         # Memory connectors
synclets/connector/tinybase       # TinyBase connectors
synclets/ws                       # WebSocket transport
synclets/transport/broadcast-channel # BroadcastChannel transport
synclets/transport/durable-object # Durable Object transport
synclets/transport/memory         # Memory transport
synclets/server                   # Server utilities
```

### Type System

Strong TypeScript support with:

- Generic types for extensibility
- Conditional types for type-safe APIs
- Comprehensive interface definitions
- Full IntelliSense support

### Build System

- **Gulp**: Build orchestration
- **TypeScript**: Source language with strict mode
- **Rollup**: Bundling
- **ESM**: Primary module format
- **Tree-shaking**: Modular design for minimal bundles

## Development

### Prerequisites

- Node.js >= 23.10.0
- npm >= 10.9.2

### Setup

```bash
git clone https://github.com/tinyplex/synclets.git
cd synclets
npm install
```

### Common Commands

```bash
npm run compileAndTestUnit  # Compile and run unit tests
npm run testUnitFast        # Quick test iteration
npm run lint                # Run ESLint
npm run spell               # Spell check
npm run preCommit           # Full pre-commit check
npm run compileDocs         # Generate API documentation
npm run serveDocs           # Preview documentation locally
```

### Testing

- **Framework**: Vitest
- **Coverage**: Istanbul coverage reporting
- **Types**: Unit, performance, end-to-end, production
- **Environment**: happy-dom (unit), puppeteer (e2e)

### Code Style

- **ESLint**: Enforced with strict rules
- **Prettier**: Automatic formatting
- **Max line length**: 80 characters
- **Quotes**: Single quotes (template literals allowed)
- **Semicolons**: Required
- **Object spacing**: No spaces in braces `{key: value}`

## Project Structure

```
synclets/
├── src/                       # Source code
│   ├── @types/                # TypeScript declarations
│   ├── core/                  # Core synclet implementation
│   ├── connector/             # Storage connectors
│   │   ├── browser/           # Browser storage (localStorage, etc.)
│   │   ├── database/          # Database connectors
│   │   │   ├── pglite/        # PGlite connector
│   │   │   └── sqlite3/       # SQLite3 connector
│   │   ├── fs/                # File system connector
│   │   ├── memory/            # Memory connector
│   │   └── tinybase/          # TinyBase connector
│   ├── transport/             # Transport implementations
│   │   ├── ws/                # WebSocket transport
│   │   ├── broadcast-channel/ # BroadcastChannel transport
│   │   └── memory/            # Memory transport
│   ├── server/                # Server utilities
│   ├── utils/                 # Shared utilities
│   ├── common/                # Common code
│   └── index.ts               # Main entry point
├── test/                      # Tests
│   ├── unit/                  # Unit tests
│   ├── perf/                  # Performance tests
│   ├── e2e/                   # End-to-end tests
│   └── prod/                  # Production build tests
├── docs/                      # Generated documentation
├── dist/                      # Build output
├── site/                      # Documentation site source
├── servers/                   # Example servers
├── gulpfile.mjs               # Build configuration
├── vitest.config.ts           # Test configuration
├── eslint.config.js           # Linting rules
└── tsconfig.json              # TypeScript config
```

## Contributing

Contributions are welcome! This is a spare-time project, so response times may
vary.

**Requirements**:

1. Follow the Prettier and ESLint configurations
2. Write tests for new features
3. Update documentation for API changes
4. Add examples for new features

**Process**:

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Run `npm run preCommit` to verify
5. Submit a pull request

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## Community

- **Discussions**: https://github.com/tinyplex/synclets/discussions
- **Issues**: https://github.com/tinyplex/synclets/issues
- **Bluesky**: https://bsky.app/profile/synclets.bsky.social
- **Twitter/X**: https://x.com/syncletsjs

## Use Cases

Synclets is ideal for:

- **Local-first applications**: Apps that work offline and sync later
- **Real-time collaboration**: Multi-user applications with distributed sync
- **Multi-device sync**: Keeping data synchronized across devices
- **Cross-worker communication**: Syncing data across web workers
- **Progressive Web Apps**: Offline-capable web applications
- **Mobile apps**: React Native apps with flexible storage
- **Edge computing**: Cloudflare Workers, Durable Objects
- **Microservices**: Distributed data synchronization

## Performance

- Modular design for minimal bundle sizes
- Efficient change tracking and propagation
- Optimized for both bundle size and runtime performance
- Tree-shakeable exports
- Zero unnecessary dependencies

## Related Projects

- **TinyBase**: Reactive data store and sync engine (https://tinybase.org)
- **TinyWidgets**: Widget toolkit for rich UIs (https://tinywidgets.org)
- **TinyTick**: Task orchestration library (https://tinytick.org)

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Note for AI Agents**: Synclets follows similar patterns to TinyBase, including
utility function wrappers for consistency and tree-shaking. Always use factory
functions (`createSynclet`, `createPgliteConnectors`, etc.) with builder pattern
chaining. Follow the strict 80-character line length. See
`.github/copilot-instructions.md` for detailed coding patterns if available.

## Documentation System

Synclets has a documentation system that generates the website from source code
and markdown files, similar to TinyBase.

### Documentation Structure

1. **Type Definitions (`src/@types/*/`)**: TypeScript `.d.ts` files contain the
   API type definitions. **Never add comments directly to `.d.ts` files**.

2. **Documentation Files (`src/@types/*/docs.js`)**: Companion `docs.js` files
   sit alongside `.d.ts` files. Use `///` convention to document types and
   functions. These are stitched together at build time to generate
   documentation.

3. **Guide Files (`site/guides/*/`)**: Markdown files in the `site/guides/`
   directory. These are source files for guides on the website.

4. **Generated Files**: `/releases.md` and `/readme.md` in the root are
   **GENERATED** from source files in `/site/`. **Never edit the generated
   files directly**.

### Documentation Testing

Synclets uses automated tests that validate inline code examples in
documentation (if implemented):

```bash
npx vitest run ./test/unit/documentation.test.ts --retry=0
```

**How it works**:

- Extracts all code blocks from markdown files and `docs.js` files
- Concatenates all examples from each file together
- Parses and executes them to ensure they work
- This means examples in the same file share scope

**Critical constraints**:

- Don't redeclare variables across examples in the same file
- First example can declare `const synclet = createSynclet(...)`, subsequent
  examples reuse it
- Include necessary imports in examples that use them
- Avoid async operations in examples unless necessary
- Keep examples simple and focused

**Common pitfalls**:

- ❌ Declaring `const synclet` multiple times in the same file
- ❌ Using undefined functions (forgot import statement)
- ✅ First example: `const synclet = createSynclet(...)`
- ✅ Later examples: `await synclet.start()` (reuses existing synclet)

### Adding New Documentation

1. **API Documentation**: Edit `docs.js` file next to the type definition
2. **Guide Content**: Edit markdown files in `/site/guides/`
3. **Release Notes**: Edit `/site/guides/2_releases.md` (not `/releases.md`)
4. **Always run documentation tests** after changes to verify examples work

## Current Status

Synclets is in **pre-alpha** development. The core functionality is in place
with:

- ✅ Core synclet implementation
- ✅ Multiple connector types (browser, database, file, memory, TinyBase)
- ✅ Multiple transport types (WebSocket, BroadcastChannel, memory)
- ✅ Basic test suites
- ✅ Initial documentation
- 🚧 More connectors and transports planned
- 🚧 More examples needed
- 🚧 Production hardening in progress

The project is under active development, and APIs may change before the 1.0
release.
