"use strict";

const SWNAME = 'ServiceWorkerContext';

/**
 * Factory functions for cache handlers
 * @alias module:@lumjs/service-worker/context.cache.HandlerFactory
 */
const CacheHandlerFactory =
{
  install: function (sw)
  {
    return function (ev)
    { // We'll use the install event to cache the current resources.
      const EHNAME = SWNAME+':install[Caches]';
      if (sw.conf.logLevel > 1) console.debug(EHNAME, ev);
      ev.waitUntil(sw.caches.installCaches());
    }
  }, // install()

  activate: function (sw)
  {
    return function (ev)
    { // We'll use the active event to clean up old caches.
      const EHNAME = SWNAME+':activate[Caches]';
      const log = sw.conf.logLevel;
      if (log > 1) console.debug(EHNAME, ev);
      clients.claim();
      ev.waitUntil(
        caches.keys().then(function(cacheNames)
        {
          return Promise.all(
            cacheNames.map(function(cacheName)
            {
              if (!sw.caches.hasName(cacheName))
              {
                if (log > 0) 
                  console.debug(EHNAME, 'Deleting stale cache', cacheName);
                return caches.delete(cacheName);
              } // if !currentCaches.has
            }) // cacheNames.map()
          ); // Promise.all()
        }) // keys.then()
      ) // waitUntil
    }
  }, // activate()
  
  fetch: function (sw)
  {
    return function (ev)
    { // Finally the fetch event handles getting cached content, as well as
      // adding content to a cache if the content matches.
      const EHNAME = SWNAME+':fetch[Caches]';
      const log = sw.conf.logLevel;
      ev.respondWith(
        caches.match(ev.request.clone()).then(function(response)
        {
          if (response)
          { // Response was cached, we're good to go.
            if (log > 2) console.debug(EHNAME, ev.request.url, 'was cached');
            return response;
          }
    
          return fetch(ev.request.clone()).then(function (response)
          {    
            if (log > 2) console.debug(EHNAME, ev.request.url, 
              'fetched', response.status);
            if (response.status < 400)
            { // Not an error response.
              sw.caches.match(ev, response.clone());
            }
    
            // Okay, all done, return the response.
            return response; 
    
          }).catch(function(err)
          { // An error occurred.
            console.error('Error in fetch handler', err);
          });
        })
      );
    }
  }, // fetch() 
}

module.exports = CacheHandlerFactory;
