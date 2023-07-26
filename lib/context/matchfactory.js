const core = require('@lumjs/core');
const {O,F} = core.types;

/**
 * Functions for Match cache handlers
 */
const MatchFactory =
{

  default()
  { // If we have a list of URLs, see if the request URL is one of them.
    return function(event)
    {
      const urls = this.conf.urls;
      const req = event.request.clone();
      return (Array.isArray(urls) && urls.includes(req.url));
    }
  },

  byRegex()
  { // Match by a regular expression, optionally checking rules for submatches.
    return function(event)
    {
      const regex = this.conf.regex;
      const submatch = this.conf.submatch;
      const req = event.request.clone();
      if (typeof regex === O)
      {
        let matches = regex.exec(req.url);
        if (matches)
        {
          if (typeof submatch === F)
          { // One extra filter.
            return submatch.call(this, matches);
          }
          return true;
        }
      }
      return false;
    }
  },

} // MatchFactory

module.exports = MatchFactory;
