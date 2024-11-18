"use strict";

const core = require('@lumjs/core');
const {S,isObj} = core.types;
const {urlBase64ToUint8Array} = require('./util');
const copy = Object.assign;

const sendSubAsData = ['', '*'];

/**
 * The main helper class for working with service-workers
 * from a browser window context
 * @alias module:@lumjs/service-worker/window.Helper
 */
class ServiceWorkerWindowHelper
{
  constructor(url, opts={})
  {
    if (typeof url !== S)
    {
      throw new Error("Invalid URL parameter passed to ServiceWorker()");
    }

    this.url = url;
    this.options = opts;
    
    this.registration =
    {
      current: null,
    }

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

  } // constructor()

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

  register(opts)
  {
    if (!('serviceWorker' in navigator))
    { // Well that's not good...
      return Promise.reject(new Error("No serviceWorker API found"));
    }

    return (navigator.serviceWorker
      .register(this.url, copy({}, this.options, opts))
      .then(reg => 
      {
        this.registration.current = reg;
      })
    );
  }

  get ready()
  {
    return navigator.serviceWorker.ready;
  }

  subscribe(reg)
  {
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

        let fetchBody;
        if (sendSubAsData.includes(so.sendName))
        { // Using the sub object AS the JSON body
          fetchBody = sub;
        }
        else
        { // Adding the sub object TO a JSON body
          fetchBody = copy({}, so.sendData);
          fetchBody[so.sendName] = sub;
        }

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
      promise = promise.then(sub =>
      {
        so.current = sub;
        return sub;
      });
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
    if (typeof this.vapid.keyUrl === S
      || isObj(this.vapid.pubKey))
    { // Let's do the subscription.
      out.subscription = this.ready.then((reg) => this.subscribe(reg));
    }

    // Finally return all the promises.
    return out;
  }

} // Lum.ServiceWorker for Browser context.

module.exports = ServiceWorkerWindowHelper;
