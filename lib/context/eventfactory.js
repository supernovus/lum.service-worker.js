
/**
 * Functions for Event cache handlers.
 */
const EventFactory = 
{
  logOpen()
  {
    const cc = this;
    return function(cache)
    {
      console.debug(`Opened ${cc.key} cache version ${cc.ver}…`);
      return cache;
    }
  },

} // EventFactory

module.exports = EventFactory;
