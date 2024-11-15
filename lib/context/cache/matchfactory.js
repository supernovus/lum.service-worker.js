const core = require('@lumjs/core');
const {S,F,isObj,isIterable,isArray,isNil} = core.types;

const opc = o => isNil(o) ? 0 : Object.keys(o).length;

const CT = 'content-type';

// Tests for handlers in MatchFactory
const Tests =
{
  allOf(conf)
  {
    return isObj(conf.allOf ?? conf.and);
  },

  anyOf(conf)
  {
    return isObj(conf.anyOf ?? conf.or);
  },

  urlList(conf)
  {
    const urls = conf.urls ?? conf.url;
    return (typeof urls === S || isArray(urls));
  },

  urlRegExp(conf)
  {
    const urls = conf.urls ?? conf.url;
    return (urls instanceof RegExp);
  },

  ctList(conf)
  {
    const ct = conf.contentType ?? conf.mimeType ?? conf.mime;
    return (typeof ct === S || isArray(ct));
  },

  ctRegExp(conf)
  {
    const ct = conf.contentType ?? conf.mimeType ?? conf.mime;
    return (ct instanceof RegExp);
  },

}

// The main function for finding matcher definitions
// Used by `allOf`, `anyOf`, and itself recursively.
function findMatchers(conf, cc, found=[], level=0)
{
  if (typeof conf === F)
  { // Assume the conf IS the matcher
    found.push(conf);
  }
  else if (isIterable(conf))
  { // An array or other iterable of sub-definitions
    for (const subdef of conf)
    {
      findMatchers(subdef, cc, found, level+1);
    }
  }
  else if (isObj(conf))
  { // A plain object, run tests to find matchers
    for (const id in Tests)
    {
      const test = Tests[id];
      if (test(conf))
      { // Found a matching handler
        found.push(MatchFactory[id].call(cc,conf));
      }
    }
  }
  
  if (found.length === 0)
  {
    console.error("no valid match found", {conf,cc,level});
    if (!level) found.push(noMatch);
  }

  return found;
}

function noMatch() { return false }

/**
 * Functions for cache request/response matching handlers
 * @alias module:@lumjs/service-worker/context.cache.MatchFactory
 */
const MatchFactory =
{
  // The main entry point for the factory
  get(conf, cc)
  {
    if (opc(conf) === 1 && (conf.anyOf ?? conf.or) !== undefined)
    { // A special case for when there's just a single 'anyOf' rule
      return MatchFactory.anyOf.call(cc, conf);
    }

    if (!isObj(conf) || ((conf.allOf ?? conf.and) === undefined))
    {
      conf = {allOf: conf}
    }
    return MatchFactory.allOf.call(cc, conf);
  },

  allOf(conf)
  {
    const fns = findMatchers((conf.allOf ?? conf.and), this);

    return function(ev, res)
    {
      for (const fn of fns)
      {
        if (!fn.call(this, ev, res))
        { // A sub-test failed
          return false;
        }
      }
      return true;
    }
  },

  anyOf(conf)
  {
    const fns = getSubs((conf.anyOf ?? conf.or), this);

    return function(ev, res)
    {
      for (const fn of fns)
      {
        if (fn.call(this, ev, res))
        { // A sub-test passed
          return true;
        }
      }
      return false;
    }
  },

  urlList(conf)
  { // If we have a list of URLs, see if the request URL is one of them.
    let urls = conf.urls ?? conf.url;
    
    if (typeof urls === S)
    { // Split strings into an array
      urls = urls.split(this.registry.lsep);
    }

    return function(ev)
    {
      return urls.includes(ev.request.url);
    }
  },

  urlRegExp(conf)
  { // Match by a regular expression
    const urls = conf.urls ?? conf.url;

    return function(ev)
    {
      return ev.request.url.match(urls);
    }
  },

  ctList(conf)
  {
    let types = conf.contentType ?? conf.mimeType ?? conf.mime;

    if (typeof types === S)
    {
      types = types.split(this.registry.lsep);
    }

    return function(_, res)
    {
      const ct = res.headers.get(CT);
      return types.includes(ct);
    }
  },

  ctRegExp(conf)
  {
    const types = conf.contentType ?? conf.mimeType ?? conf.mime;

    return function(_, res)
    {
      const ct = res.headers.get(CT);
      return ct.match(types);
    }
  },

  // The test definitions
  Tests,

  // Functions for extensions
  Meta: 
  { 
    findMatchers,
    noMatch,
  },

} // MatchFactory

module.exports = MatchFactory;
