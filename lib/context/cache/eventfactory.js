"use strict";

/**
 * Functions for cache event handlers
 * @alias module:@lumjs/service-worker/context.cache.EventFactory
 */
const EventFactory = 
{
  logOpen()
  {
    const cc = this;
    return function(cache)
    {
      console.log(`Opened ${cc.key} cache version ${cc.ver}…`,{cache, cc});
      return cache;
    }
  },

} // EventFactory

module.exports = EventFactory;
