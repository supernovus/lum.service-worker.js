# lum.service-worker.js

Helper classes for working with Service Workers.

## Status: *DEAD*

I am unhappy with the design of this package, and rather than overhaul it,
I decided to replace it entirely with [@lumjs/web-workers], which was designed 
from the start as a zero-dependency collection of ES Modules; one module for 
each supported global context. 

## Exports

### `@lumjs/service-worker/context`

A class for use inside a Service Worker context. Provides a few simplistic
methods and sub-classes for handling caches and a few other features.

### `@lumjs/service-worker/window`

A class for use in a browser window to register, active, and commuicate with
a Service Worker.

### `@lumjs/service-worker`

Returns the `context` class if loaded in a Service Worker,
or the `window` class if loaded in a browser window.

If the current JS context is neither a window or a service worker,
(e.g. called directly from node.js) an error object will be returned.

## Official URLs

This library can be found in two places:

 * [Github](https://github.com/supernovus/lum.service-worker.js)
 * [NPM](https://www.npmjs.com/package/@lumjs/service-worker)

## Author

Timothy Totten <2010@totten.ca>

## License

[MIT](https://spdx.org/licenses/MIT.html)

[@lumjs/web-workers]: https://github.com/supernovus/lum.web-workers.js
