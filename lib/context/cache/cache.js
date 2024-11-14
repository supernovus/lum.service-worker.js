const core = require('@lumjs/core');
const {F,S,isObj,def} = core.types;
const MatchFactory = require('./matchfactory');
const EventFactory = require('./eventfactory');

function getFunc(func, factory, thisVal, args, fallback)
{
  if (typeof func === F)
  {
    return func;
  }
  else if (typeof func === S && typeof factory[func] === F)
  {
    return factory[func].apply(thisVal, args);
  }
  else
  {
    console.error("Invalid function definition", 
      {func, factory, thisVal, args, fallback});
    return fallback;
  }
}

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
        this.events[ename] = getFunc(efunc, EventFactory, this, [ename]);
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

def(ServiceWorkerCache, 'getFunc', getFunc);

module.exports = ServiceWorkerCache;
