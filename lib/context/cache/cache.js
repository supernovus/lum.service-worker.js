const core = require('@lumjs/core');
const {F,S,isObj,def} = core.types;
const MatchFactory = require('./matchfactory');
const EventFactory = require('./eventfactory');
const {fromFactory} = require('../util');

/**
 * A helper for working with service worker caches
 * @alias module:@lumjs/service-worker/context.cache.Handler
 */
class ServiceWorkerCache
{
  constructor(key, conf, reg)
  {
    this.registry = reg;
    this.ctx = reg.ctx;
    this.key = key;
    this.ver = conf.ver ?? 0;
    this.name = key + reg.csep + this.ver;
    this.events = {};
    this.conf = conf;

    // Match rules may be explicit or implicit
    const mc = conf.match ?? conf;

    // See if the match rules have a _fixed list_ of URLs.
    let urls = mc.urls ?? mc.url;
    if (typeof urls === S)
    {
      urls = urls.split(reg.lsep);
    }
    else if (!Array.isArray(urls))
    {
      urls = null;
    }
    this.urlList = urls;

    this.installer = !!(conf.installer ?? urls);

    // Assign a match() function.
    this.match = MatchFactory.get(mc);

    if (isObj(conf.events))
    { // Assign some event functions.
      for (const ename in conf.events)
      {
        const efunc = conf.events[ename];
        this.events[ename] = fromFactory(efunc, EventFactory, this, [ename]);
      }
    }

  } // constructor()

  open()
  {
    let promise = caches.open(this.name);
    if (typeof this.events.onOpen === F)
    { // Call the opOpen event.
      promise = promise.then(this.events.onOpen);
    }
    return promise;
  }

}

module.exports = ServiceWorkerCache;
