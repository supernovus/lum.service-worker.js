const core = require('@lumjs/core');
const {S,isObj,def} = core.types;
const root = core.context.root;
const CC = require('./cache');
const CacheHandlerFactory = require('./cachefactory');

const CACHE_SEP = '-cache-v';

/**
 * A helper for use in the ServiceWorker context.
 */
class ServiceWorkerContext
{
  constructor()
  {
    this.cacheSeparator = CACHE_SEP;

    def(this, '$eventHandlers', {});
    def(this, '$modules', {});

    def(this, 'caches', {});

    const cprop = def(this.caches);

    cprop('add', function(key, cmod)
    {
      this[key] = new CC(key,cmod, this);
    });

    cprop('addAll', function(cacheDefs)
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
        console.error("Invalid cache definitions", cacheDefs);
      }
    });
  
    cprop('keys', { get: function()
    {
      return Object.keys(this);
    }});
  
    cprop('values', { get: function()
    {
      return Object.values(this);
    }});

    cprop('length', { get: function()
    {
      return Object.keys(this).length;
    }});
  
    cprop('has', function(name)
    {
      for (let key in this)
      {
        const cache = this[key];
        if (cache.name === name)
        { // We found a match.
          return true;
        }
      }
      // No matching cache found.
      return false;
    });
  
    cprop('installCaches', function()
    {
      const me = this;
      return Promise.allSettled(
        me.values.map(function(cc)
        {
          if (cc.installer)
          {
            return cc.open().then(function(cache)
            {
              console.debug(`Auto-installing ${cc.key} cache URLs…`);
              cache.addAll(cc.conf.urls);
            });
          } // if cc.installer
          else
          {
            return Promise.resolve(null);
          }
        })
      )
    }); // installCaches()
  
    cprop('match', function(event, response)
    {
      for (const cc of this.values)
      {
        if (cc.match(event))
        { // This cache matched the request, cache it.
          cc.open().then(function(cache)
          {
            cache.put(event.request, response);
          });
  
          break;
        }
      } // for this.values 
    }); // match()

  } // Lum.ServiceWorker::construct();

  setCacheSeparator(sep)
  {
    if (typeof sep === S)
    {
      this.cacheSeparator = sep;
    }
    return this;
  }

  on()
  {
    root.addEventListener(...arguments);
    return this;
  }

  off()
  {
    root.removeEventListener(...arguments);
    return this;
  }

  onInstall()
  {
    return this.on('install', ...arguments);
  }

  onActivate()
  {
    return this.on('activate', ...arguments);
  }

  onFetch()
  {
    return this.on('fetch', ...arguments);
  }

  useCaches(cacheDefs)
  {
    if (this.$cachesInitialized) return; // We only initialize once.

    if (isObj(cacheDefs))
    {
      this.caches.addAll(cacheDefs);
    }

    if (this.caches.length > 0)
    {
      this.onInstall(CacheHandlerFactory.install(this));
      this.onActivate(CacheHandlerFactory.activate(this));
      this.onFetch(CacheHandlerFactory.fetch(this));

      // Now mark it as having been done.
      this.$cachesInitialized = true;
    }
  }

} // Lum.ServiceWorker for ServiceWorker context.

module.exports = ServiceWorkerContext;
