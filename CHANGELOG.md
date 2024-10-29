# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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


[Unreleased]: https://github.com/supernovus/lum.service-worker.js/compare/v0.10.0...HEAD
[0.10.0]: https://github.com/supernovus/lum.service-worker.js/compare/v0.9.0...v0.10.0
[0.9.0]: https://github.com/supernovus/lum.service-worker.js/releases/tag/v0.9.0
