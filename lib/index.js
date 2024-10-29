const {ctx} = require('@lumjs/core/context');

if (ctx.isServiceWorker)
{
  module.exports = require('./context');
}
else if (ctx.isWindow)
{
  module.exports = require('./window');
}
else 
{
  module.exports = new ReferenceError("Not in a Window or ServiceWorker");
}
