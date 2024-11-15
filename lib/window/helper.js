"use strict";

const core = require('@lumjs/core');
const {S,F,isObj} = core.types;
const {urlBase64ToUint8Array} = require('./util');
const copy = Object.assign;

/**
 * The main helper class for working with service-workers
 * from a browser window context
 * @alias module:@lumjs/service-worker/window.Helper
 */
class ServiceWorkerWindowHelper
{
  constructor(url, noHandlers=false)
  {
    if (typeof url !== S)
    {
      throw new Error("Invalid URL parameter passed to ServiceWorker()");
    }

    this.url = url;
    this.events = {};

    this.vapid = 
    {
      pubKey: null,
      keyUrl: null,
      keyMethod: 'GET',
      keyOpts: {},
    }

    this.subscription =
    {
      current: null,
      serverData: null,
      sendUrl: null,
      sendMethod: 'POST',
      sendOpts: {},
      sendData: {},
      sendName: 'subscription',
    }

    function add(name, def)
    {
      if (typeof def === F)
      {
        this.events[name] = def;
      }

      this[name] = function (func)
      {
        if (typeof func === F)
        { // A valid event handler.
          this.events[name] = func;
        }
        else if (func === null)
        { // Clear the event handler
          delete(this.events[name]);
        }
        else
        {
          console.error(name, "accepts function or null; not:", func);
        }

        return this;
      }
    }

    const defReg = noHandlers ? null : (reg) => 
      console.debug('ServiceWorker registered', this, reg);
    const defFail = noHandlers ? null : (err) =>
      console.error('ServiceWorker registration failed', this, err);
  
    // Event for successful registration.
    add('onRegister', defReg);
    // Event for failed registration.
    add('onFailure', defFail);
    // Event for successful push subscription.
    add('onSubscribe');
  }

  setVapidKey (key)
  {
    if (typeof key === S)
    { // Convert the base64 key to a Uint8Array object.
      key = urlBase64ToUint8Array(key);
    }

    if (key instanceof Uint8Array)
    { // That's valid.
      this.vapid.pubKey = key;
    }
    else
    { // That's not.
      throw new TypeError("Invalid Vapid Key");
    }

    return this;
  }

  setVapidUrl (url, meth, opts)
  {
    const vo = this.vapid;

    if (typeof url !== S)
    {
      throw new TypeError("Invalid Vapid URL");
    }
    
    vo.keyUrl = url;

    if (typeof meth === S)
    {
      vo.keyMethod = meth;
    }

    copy(vo.keyOpts, opts);

    return this;
  }

  setSubOptions (opts)
  {
    const so = this.subscription;

    let opt = opts.url ?? opts.sendUrl ?? opts.sendURL;
    if (typeof opt === S)
    {
      so.sendUrl = opt;
    }

    opt = opts.method ?? opts.http ?? opts.httpMethod ?? opts.sendMethod;
    if (typeof opt === S)
    {
      so.sendMethod = opt;
    }

    opt = opts.name ?? opts.subName ?? opts.sendName;
    if (typeof opt === S)
    {
      so.sendName = opt;
    }

    opt = opts.opts ?? opts.sendOpts;
    copy(so.sendOpts, opt);

    opt = opts.data ?? opts.sendData;
    copy(so.sendData, opt);

    return this;
  }

  register()
  {
    if (!('serviceWorker' in navigator))
    { // Uh...
      if (typeof self.Promise === F)
      { // Return a rejected promise.
        return Promise.reject(new Error("No serviceWorker API found"));
      }
      else
      { // This should never happen, but...
        throw new Error("No support for Promise");
      }
    }

    const promise = navigator.serviceWorker.register(this.url);
    const ev = this.events;

    if (typeof ev.onRegister === F || typeof ev.onFailure === F)
    { // Return the chained promise.
      return promise.then(ev.onRegister, ev.onFailure);
    }
    else
    { // Return the registration promise.
      return promise;
    }

  } // register()

  get ready()
  {
    return navigator.serviceWorker.ready;
  }

  subscribe(reg)
  {
    const ev = this.events;
    const vo = this.vapid;
    const so = this.subscription;

    let promise = reg.pushManager.getSubscription()
    .then(async function(sub)
    { // If a subscripion already exists, use it.
      if (sub)
      {
        return sub;
      }

      const subOpts = {userVisibleOnly: true};

      if (vo.pubKey instanceof Uint8Array)
      { // A key has been explicitly set.
        subOpts.applicationServerKey = vo.pubKey;
      }
      else if (typeof vo.keyUrl === S)
      { // We're going to get the key from the server.
        const fetchOpts = copy(
        {
          method: vo.keyMethod,
        }, vo.keyOpts);

        const keyRes = await fetch(vo.keyUrl, fetchOpts);
        const keyStr = await keyRes.text();
        const keyObj = urlBase64ToUint8Array(keyStr);
        subOpts.applicationServerKey = vo.pubKey = keyObj;
      }
      
      return reg.pushManager.subscribe(subOpts);
    });

    if (typeof so.sendUrl === S)
    { // A URL to send subscription info to
      promise = promise.then(async function(sub)
      {
        so.current = sub;

        const fetchBody = copy({}, so.sendData);
        fetchBody[so.sendName] = sub;

        const fetchOpts = copy(
        { // Some reasonable defaults
          method: so.sendMethod,
          headers: {'Content-Type': 'application/json'},
        }, 
        so.sendOpts,
        { // The body cannot be overridden
          body: JSON.stringify(fetchBody),
        });

        const sres = await fetch(so.sendUrl, fetchOpts);
        so.serverData = await sres.json();

        return sub;
      });
    }
    else
    { // No URL? That's odd. Save the sub info anyway.
      promise = promise.then(function(sub)
      {
        so.current = sub;
        return sub;
      });
    }

    if (typeof ev.onSubscribe === F)
    { // Get the chained promise.
      promise = promise.then(ev.onSubscribe);
    }

    // Finally, return the promise.
    return promise;
  } // subscribe()

  /**
   * A wrapper around register() and subscribe() that is meant as the
   * primary way to start the service worker process.
   */
  run()
  {
    const out = {};

    // We always call register.
    out.registration = this.register();

    // Now a bit of conditional stuff.
    if ( typeof this.events.onSubscribe === F
      || typeof this.vapid.pubKey       === O
      || typeof this.vapid.keyUrl       === S)
    { // Let's do the subscription.
      out.subscription = this.ready.then((reg) => this.subscribe(reg));
    }

    // Finally return all the promises.
    return out;
  }

} // Lum.ServiceWorker for Browser context.

module.exports = ServiceWorkerWindowHelper;
