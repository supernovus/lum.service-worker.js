# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.21.1] - 2026-05-14
### Changed
- Updated the README file to note that this package is no longer
  being worked on and will be archived. It's been replaced by the
  new [@lumjs/web-workers] package which actually works properly.

## [0.21.0] - 2026-01-12
### Added
- A new CacheBuilder class for quickly building cache definitions.
- `Context#buildCache` method for creating a CacheBuilder.
### Plans
- Support more cache modes. Currently this has only 'cache-first' mode;
  I want to add cache-first-with-refresh, and network-first modes.

## [0.20.0] - 2024-11-18
### Changed
- Overhauled the entire `context` submodule.
  It was frankly a mess and while it had worked for a very limited
  scope I'd used it on in the past, it didn't support features that
  would be used in a real-world context.
- Refactored the `window` submodule.
  - Made the vapid/subscription stuff a lot cleaner.
  - Removed the makeshift event system (it was garbage).
- Made the window.Helper and context.Context classes named exports.
- As for the version bump, if the version had been `1.x`, it'd be `2.x` now,
  as this breaks compatibility entirely. So yeah, big revamp.

## [0.10.0] - 2024-10-29
### Changed
- Rejigged the default module to simply re-export the sub-module
  appropriate for the current context.
- Made `window.{onRegister,onFailure,onSubscribe}` methods a bit more strict.
- Actually made the `noHandlers` argument for `window` constructor do something.
- Changed root dependency from `@lumjs/core` to `@lumjs/web-core`.

## [0.9.0] - 2023-07-25
### Added
- Initial release.

---

[Unreleased]: https://github.com/supernovus/lum.service-worker.js/compare/v0.20.0...HEAD
[0.20.0]: https://github.com/supernovus/lum.service-worker.js/compare/v0.10.0...v0.20.0
[0.10.0]: https://github.com/supernovus/lum.service-worker.js/compare/v0.9.0...v0.10.0
[0.9.0]: https://github.com/supernovus/lum.service-worker.js/releases/tag/v0.9.0
[@lumjs/web-workers]: https://github.com/supernovus/lum.web-workers.js
