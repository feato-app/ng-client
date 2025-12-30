# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-12-30

### Added

- 🎉 Initial release of `@feato/ng-client`
- Real-time feature flag updates via Server-Sent Events (SSE)
- `FeatoClient` service with comprehensive API:
  - **Signal API**: `flags()`, `initialized()`, `flag(key)` - reactive signals for modern Angular apps
  - **Observable API**: `flags$`, `initialized$`, `flag$(key)` - RxJS observables for stream composition
- `provideFeatoClient()` function for easy DI configuration
- `featoGuard()` route guard for feature flag-based navigation control
- Support for multiple environments (dev, staging, prod, etc.)
- Automatic reconnection on SSE connection errors
- Graceful error handling and fallback behavior
- TypeScript support with full type definitions
- Comprehensive test coverage for all features

### Features

- **Dual API**: Both Angular Signals and RxJS Observables supported
- **Type-safe**: Full TypeScript definitions for all public APIs
- **Lightweight**: Minimal dependencies, no framework internals
- **DI-friendly**: Designed for Angular's dependency injection system
- **Real-time**: Instant flag updates via SSE without polling
- **Resilient**: Automatic disconnect/reconnect on errors

[1.0.0]: https://github.com/feato-app/ng-client/releases/tag/v1.0.0
