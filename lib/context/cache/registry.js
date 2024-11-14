"use strict";

const core = require('@lumjs/core');
const {isObj} = core.types;
const CC = require('./cache');

const CACHE_SEP = '-cache-v';
const LIST_SEP  = /[\s,]+/g;

/**
 * A registry of caches for a Context instance
 * @alias module:@lumjs/service-worker/context.cache.Registry
 */
class CacheRegistry
{
  constructor(sw)
  {
    this.ctx = sw;
    this.byKeys = new Map();
    this.byName = new Map();
    this.csep = CACHE_SEP;
    this.lsep = LIST_SEP;
  }

  hasKey(v)
  {
    return this.byKeys.has(v);
  }

  hasName(v)
  {
    return this.byName.has(v);
  }

  add(key, conf)
  {
    const cache = (conf instanceof CC) 
      ? conf 
      : new CC(key, conf, this);

    this.byKeys.set(key, cache);
    this.byName.set(cache.name, cache);

    return this;
  }

  addAll(cacheDefs)
  {
    if (isObj(cacheDefs))
    {
      for (const cname in cacheDefs)
      {
        this.add(cname, cacheDefs[cname]);
      }
    }
    else 
    {
      console.error("Invalid cache definitions", 
        {cacheDefs, registry: this});
    }    
  }

  install()
  {
    return Promise.allSettled(this.items.map(function(cc)
    {
      if (cc.installer)
      {
        const urls = cc.urlList;
        if (urls)
        {
          const log = cc.ctx.conf.logLevel;
          return cc.open().then(function(cache)
          {
            if (log > 0) 
              console.debug(`Auto-installing ${cc.key} cache URLs…`);
            cache.addAll(urls);
          });
        }
      } // if cc.installer
      else
      {
        return Promise.resolve(null);
      }
    }));
  }

  match(event, response)
  {
    for (const cc of this.items)
    {
      if (cc.match(event, response))
      { // This cache matched the request, cache it.
        cc.open().then(function(cache)
        {
          cache.put(event.request, response);
        });

        break;
      }
    }    
  }

  get items()
  {
    return this.byKeys.values();
  }

  get size()
  {
    return this.byKeys.size;
  }

}

module.exports = CacheRegistry;
