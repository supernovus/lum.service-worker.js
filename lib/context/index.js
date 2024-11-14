"use strict";

const core = require('@lumjs/core');
const {S,isObj,def} = core.types;
const root = core.context.root;

const CH = require('./cache/cachefactory');
const CR = require('./cache/registry');

const CST = require('./const');
const {CINIT} = CST;

const DEF_CONF =
{
  logLevel: 1,
}

/**
 * A helper for use in the ServiceWorker context.
 */
class ServiceWorkerContext
{
  constructor(opts)
  {
    const conf = Object.assign({}, DEF_CONF, opts);

    def(this, 'conf',    {value: conf});
    def(this, 'caches',  new CR(this));
  }

  setCacheSeparator(sep)
  {
    if (typeof sep === S)
    {
      this.caches.csep = sep;
    }
    return this;
  }

  setListSeparator(sep)
  {
    if (typeof sep === S || sep instanceof RegExp)
    {
      this.caches.lsep = sep;
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
    if (this[CINIT]) 
    { 
      console.error("Caches already initialized", {swc: this});
      return this;
    }

    if (isObj(cacheDefs))
    {
      this.caches.addAll(cacheDefs);
    }

    if (this.caches.length > 0)
    {
      this.onInstall(CH.install(this));
      this.onActivate(CH.activate(this));
      this.onFetch(CH.fetch(this));

      // Now mark it as having been done.
      def(this, CINIT, true);
    }

    return this;
  }

} // Lum.ServiceWorker for ServiceWorker context.

def(ServiceWorkerContext, '$C', CST);

module.exports = ServiceWorkerContext;
