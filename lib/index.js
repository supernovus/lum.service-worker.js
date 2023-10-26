const {lazy} = require('@lumjs/core/types');

lazy(exports, 'context', () => require('./context'));
lazy(exports, 'window',  () => require('./window'));
