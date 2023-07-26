const core = require('@lumjs/core');
const {S,F} = core.types;
const {urlBase64ToUint8Array} = require('./util');

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
    this.vapidPublicKey  = null;
    this.vapidKeyUrl     = null;
    this.vapidHttpMethod = null;
    this.subscriptionUrl = null;
    this.subHttpMethod   = 'POST';

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
        else
        { // Clear the event handler
          delete(this.events[name]);
        }

        return this;
      }
    }
  
    // Event for successful registration.
    add('onRegister', (reg) => 
      console.debug('ServiceWorker registered', this, reg));
    // Event for failed registration.
    add('onFailure', (err) =>
        console.error('ServiceWorker registration failed', this, err));
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
      this.vapidPublicKey = key;
    }
    else
    { // That's not.
      throw new TypeError("Invalid Vapid Key");
    }

    return this;
  }

  setVapidUrl (url, httpMethod)
  {
    if (typeof url !== S)
    {
      throw new TypeError("Invalid Vapid URL");
    }
    
    this.vapidKeyUrl = url;

    if (typeof httpMethod === S)
    {
      this.vapidHttpMethod = httpMethod;
    }

    return this;
  }

  setSubscriptionUrl (url, httpMethod)
  {
    if (typeof url !== S)
    {
      throw new TypeError("Invalid Subscription URL");
    }
    
    this.subscriptionUrl = url;

    if (typeof httpMethod === S)
    {
      this.subHttpMethod = httpMethod;
    }

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
    const swork = this;
    const ev = this.events;
    let promise = reg.pushManager.getSubscription()
    .then(async function(sub)
    { // If a subscripion already exists, use it.
      if (sub)
      {
        return sub;
      }

      const subOpts = {userVisibleOnly: true};

      if (swork.vapidPublicKey instanceof Uint8Array)
      { // A key has been explicitly set.
        subOpts.applicationServerKey = swork.vapidPublicKey;
      }
      else if (typeof swork.vapidKeyUrl === S)
      { // We're going to get the key from the server.
        const fetchOpts = {};
        if (typeof swork.vapidHttpMethod === S)
        {
          fetchOpts.method = swork.vapidHttpMethod;
        }
        const keyRes = await fetch(swork.vapidKeyUrl, fetchOpts);
        const keyStr = await keyRes.text();
        const keyObj = urlBase64ToUint8Array(keyStr);
        subOpts.applicationServerKey = keyObj;
      }
      
      return reg.pushManager.subscribe(subOpts);
    });

    if (typeof this.subscriptionUrl === S)
    {
      const subUrl = this.subscriptionUrl;
      const subMeth = this.subHttpMethod;
      promise = promise.then(function(sub)
      {
        fetch(subUrl,
        {
          method: subMeth,
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({subscription: sub}),
        });

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
      || typeof this.vapidPublicKey     === O
      || typeof this.vapidKeyUrl        === S)
    { // Let's do the subscription.
      out.subscription = this.ready.then((reg) => this.subscribe(reg));
    }

    // Finally return all the promises.
    return out;
  }

} // Lum.ServiceWorker for Browser context.

module.exports = ServiceWorkerWindowHelper;
