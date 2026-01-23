'use strict';
const core = require('@lumjs/core');
const { isObj } = core.types;

class CacheBuilder {
  
  constructor(ctx, traits={}) {
    this.cacheDefs = {};
    this.ctx = ctx;
    this.traits = traits;
  }

  add(key, def={}, ...traits) {
    if (typeof key !== 'string') {
      throw new TypeError("key must be a string");
    }

    if (traits.length > 0) {
      for (let i=0; i < traits.length; i++) {
        if (typeof traits[i] === 'string') {
          traits[i] = this.traits[i];
        }
      }
    }
    else if (isObj(this.traits.default)) {
      traits.push(this.traits.default);
    }

    def = this.cacheDefs[key] = Object.assign(def, ...traits);

    if (typeof def.ver !== 'number') {
      def.ver = Date.now(); // auto-version
    }

    return this;
  }

  finalize() {
    return this.ctx.useCaches(this.cacheDefs);
  }

}

module.exports = CacheBuilder;
