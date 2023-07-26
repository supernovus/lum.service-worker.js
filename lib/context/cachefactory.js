const SWNAME = 'ServiceWorkerContext';

/**
 * Factory functions for cache handlers.
 */
const CacheHandlerFactory =
{
  install: function (sw)
  {
    return function (event)
    { // We'll use the install event to cache the current resources.
      const EHNAME = SWNAME+':install[Caches]';
      console.debug(EHNAME, event);
      event.waitUntil(sw.caches.installCaches());
    }
  }, // install()

  activate: function (sw)
  {
    return function (event)
    { // We'll use the active event to clean up old caches.
      const EHNAME = SWNAME+':activate[Caches]';
      console.debug(EHNAME, event);
      clients.claim();
      event.waitUntil(
        caches.keys().then(function(cacheNames)
        {
          return Promise.all(
            cacheNames.map(function(cacheName)
            {
              if (!sw.caches.has(cacheName))
              {
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
    return function (event)
    { // Finally the fetch event handles getting cached content, as well as
      // adding content to a cache if the content matches.
      const EHNAME = SWNAME+':fetch[Caches]';
      event.respondWith(
        caches.match(event.request.clone()).then(function(response)
        {
          if (response)
          { // Response was cached, we're good to go.
            console.debug(EHNAME, event, response.clone());
            return response;
          }
    
          return fetch(event.request.clone()).then(function (response)
          {
            let resClone = response.clone();
    
            if (response.status < 400)
            { // Not an error response.
              console.debug(EHNAME, event, resClone.clone());
              sw.caches.match(event, resClone);
            }
    
            // Okay, all done, return the response.
            return response; 
    
          }).catch(function(e)
          { // An error occurred.
            console.error('Error in fetch handler', e);
          });
        })
      );
    }
  }, // fetch() 
}

module.exports = CacheHandlerFactory;
