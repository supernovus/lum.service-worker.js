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
    console.error("Invalid function definition", func, factory, thisVal, args, fallback);
    return fallback;
  }
}

class ServiceWorkerCache
{
  constructor(key, cmod, sw)
  {
    this.serviceWorker = sw;
    this.key = key;
    this.ver = cmod.ver ?? 0;
    this.name = key + sw.cacheSeparator + this.ver;
    this.installer = cmod.installer ?? false;
    this.events = {};
    this.conf = cmod;

    // Set our match() function.
    this.match = getFunc((cmod.match ?? 'default'), MatchFactory, this, [], function () { return false; });

    if (isObj(cmod.events))
    { // Set some event functions.
      for (const ename in cmod.events)
      {
        const efunc = cmod.events[ename];
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
