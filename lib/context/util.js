"use strict";

function fromFactory(func, factory, thisVal, args, fallback)
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
    console.error("Invalid function definition", 
      {func, factory, thisVal, args, fallback});
    return fallback;
  }
}

module.exports =
{
  fromFactory,
}
